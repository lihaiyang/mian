#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_fonts.py —— 检查 en/assets/fonts/ 里的自托管字体。

做两件事：
    1. 字体文件在不在、多大、是不是空文件 / 明显损坏
    2. 关键字符覆盖：A-Z a-z 0-9 + 标点 + IPA（θ ð ʃ ʒ ŋ æ ɛ ɪ ɒ ʌ ə ʊ）
       装了 fontTools 就真查 cmap；没装就退化成「存在性检查」并把待查字符列出来

用法：
    python3 en/tools/check_fonts.py
    python3 en/tools/check_fonts.py --dir en/assets/fonts
    python3 en/tools/check_fonts.py --quiet

缺字符 / 缺文件会以非零退出码结束。
"""

import argparse
import os
import sys

EN_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_EXTS = (".woff2", ".woff", ".ttf", ".otf", ".ttc")

UPPER = [chr(c) for c in range(ord("A"), ord("Z") + 1)]
LOWER = [chr(c) for c in range(ord("a"), ord("z") + 1)]
DIGITS = [chr(c) for c in range(ord("0"), ord("9") + 1)]
PUNCT = list(".,!?'\"-:;()…&%/")
IPA = list("θðʃʒŋæɛɪɒʌəʊ")        # 词库音标里真正会用到的国际音标字符
IPA_EXTRA = list("ˈˌ")            # 重音符号（有更好，缺了只是音标不好看）
DISPLAY_ONLY = "Baloo"            # 展示字体：只画标题与数字，音标由 Andika 负责，缺 IPA 不算问题

TINY_BYTES = 4096                 # 太小基本是坏文件 / 占位文件
BIG_BYTES = 3 * 1024 * 1024       # 单文件偏大，移动端首屏会难受

errors, warnings = [], []


def E(msg):
    errors.append(msg)


def W(msg):
    warnings.append(msg)


def human_kb(n):
    if n < 1024:
        return "%d B" % n
    if n < 1024 * 1024:
        return "%.1f KB" % (n / 1024.0)
    return "%.2f MB" % (n / 1048576.0)


def load_fonttools():
    """→ (TTFont, None) 或 (None, 原因说明)"""
    try:
        from fontTools.ttLib import TTFont  # noqa: WPS433
    except Exception as e:                # ImportError 或装坏了
        return None, str(e)
    return TTFont, None


def cmap_of(TTFont, path):
    """取 cmap：{码点: 字形名}。失败抛异常。"""
    font = TTFont(path, fontNumber=0, lazy=True)
    try:
        cmap = font.getBestCmap()
        if not cmap:
            raise RuntimeError("字体里没有可用的 cmap 表")
        return set(cmap.keys())
    finally:
        try:
            font.close()
        except Exception:
            pass


def check_coverage(TTFont, path, quiet):
    """→ (缺失字符列表, 是否成功解析)"""
    try:
        codes = cmap_of(TTFont, path)
    except Exception as e:
        W("%s: 解析不了（%s）—— woff2 需要 brotli，或字体本身有问题"
          % (os.path.basename(path), str(e)[:120]))
        return None, False

    groups = [("大写 A-Z", UPPER), ("小写 a-z", LOWER), ("数字 0-9", DIGITS),
              ("标点", PUNCT), ("IPA", IPA), ("重音符", IPA_EXTRA)]
    missing_all = []
    parts = []
    for label, chars in groups:
        miss = [c for c in chars if ord(c) not in codes]
        parts.append("%s %d/%d%s" % (label, len(chars) - len(miss), len(chars),
                                     "" if not miss else " ✗"))
        if label != "重音符":            # 重音符只在警告里提
            missing_all += miss
        elif miss:
            W("%s: 缺重音符 %s（音标会稍微不好看，不算致命）"
              % (os.path.basename(path), " ".join(miss)))
    if not quiet:
        print("     覆盖：" + " · ".join(parts))
    return missing_all, True


def main(argv=None):
    ap = argparse.ArgumentParser(description="检查 assets/fonts 下的自托管字体")
    ap.add_argument("--dir", default=os.path.join(EN_ROOT, "assets", "fonts"),
                    help="字体目录（默认 en/assets/fonts）")
    ap.add_argument("--quiet", action="store_true", help="只打印汇总与问题")
    args = ap.parse_args(argv if argv is not None else sys.argv[1:])

    font_dir = os.path.abspath(args.dir)
    print("=" * 64)
    print("🔤 字体检查：%s" % font_dir)
    print("=" * 64)

    if not os.path.isdir(font_dir):
        E("字体目录不存在：%s（建一个，把自托管字体放进去）" % font_dir)
        print("\n✗ " + errors[-1])
        return 1

    files = sorted(f for f in os.listdir(font_dir)
                   if f.lower().endswith(FONT_EXTS) and not f.startswith("."))
    if not files:
        E("目录里一个字体文件都没有（支持 %s）" % " / ".join(FONT_EXTS))
        print("  ✗ " + errors[-1])
        print("  ℹ 建议放 woff2（体积最小），浏览器兼容性由 CSS 的 @font-face 兜底")
        return 1

    TTFont, why = load_fonttools()
    if TTFont is None:
        print("  ℹ 没装 fontTools（%s），本次只做「存在性 + 大小」检查。" % why.splitlines()[0][:80])
        print("    想查字符覆盖就装一下：pip3 install fonttools brotli")
        print("    待人工确认的字符：")
        print("      A-Z a-z 0-9 标点 %s" % "".join(PUNCT))
        print("      IPA %s" % " ".join(IPA))
    else:
        print("  ℹ fontTools 可用，逐个查 cmap 字符覆盖")

    total = 0
    ok_files = 0
    for name in files:
        path = os.path.join(font_dir, name)
        size = os.path.getsize(path)
        total += size
        miss = None
        if size == 0:
            E("%s: 是空文件（0 字节）" % name)
            continue
        if size < TINY_BYTES:
            E("%s: 只有 %s，基本是坏文件或占位文件" % (name, human_kb(size)))
        elif size > BIG_BYTES:
            W("%s: %s，单文件偏大，注意首屏体积" % (name, human_kb(size)))
        if not args.quiet:
            print("  📄 %-28s %9s" % (name, human_kb(size)))
        if TTFont is not None:
            miss, parsed = check_coverage(TTFont, path, args.quiet)
            if not parsed:
                continue
            if miss:
                ipa_set = set(IPA) | set(IPA_EXTRA)
                only_ipa = all(c in ipa_set for c in miss)
                if only_ipa and DISPLAY_ONLY in name:
                    # 展示字体（Baloo 2）只负责标题与数字，音标一律由 Andika 渲染 —— 缺 IPA 不算问题
                    W("%s: 缺 %d 个 IPA 字形（展示字体，音标由 Andika 负责，不影响）" % (name, len(miss)))
                else:
                    E("%s: 缺 %d 个关键字符：%s"
                      % (name, len(miss), " ".join("%s(U+%04X)" % (c, ord(c)) for c in miss)))
        ok_files += 1

    if TTFont is None:
        print("  ⚠ 退化为存在性检查：字符覆盖未验证（装 fontTools 后重跑即可）")

    print("-" * 64)
    print("字体 %d 个 · 合计 %s · 检查通过 %d 个" % (len(files), human_kb(total), ok_files))
    if warnings:
        print("\n提示 %d 条：" % len(warnings))
        for w in warnings[:20]:
            print("  ⚠ " + w)
    if errors:
        print("\n问题 %d 条：" % len(errors))
        for e in errors[:40]:
            print("  ✗ " + e)
        return 1
    print("\n🎉 字体检查通过（提示 %d 条）" % len(warnings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
