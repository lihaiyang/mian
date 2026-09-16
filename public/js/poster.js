/**
 * 🖼️ 作品海报生成器
 * 把「作品名 + 海龟画作 + 代码 + 署名」合成一张分享卡片
 */
const Poster = (() => {
  const W = 900;
  const H = 1200;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function create(options) {
    const filename = options.filename || "我的作品";
    const code = options.code || "";
    const turtleCanvas = options.turtleCanvas || null;

    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#EEF2FF");
    grad.addColorStop(0.5, "#F5F3FF");
    grad.addColorStop(1, "#FDF2F8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 顶部标题条
    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, "#5B5FED");
    bar.addColorStop(1, "#A855F7");
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 38px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = "middle";
    ctx.fillText("🐼 我的 Python 作品", 40, 50);

    // 作品名
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#1E293B";
    ctx.font = 'bold 30px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(filename.slice(0, 30), 40, 160);

    // 画作卡片
    const artX = 40, artY = 190, artW = W - 80, artH = 560;
    ctx.save();
    ctx.shadowColor = "rgba(15,23,42,0.12)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, artX, artY, artW, artH, 22);
    ctx.fill();
    ctx.restore();

    if (turtleCanvas && turtleCanvas.width) {
      ctx.save();
      roundRect(ctx, artX + 12, artY + 12, artW - 24, artH - 24, 16);
      ctx.clip();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(artX + 12, artY + 12, artW - 24, artH - 24);
      ctx.drawImage(turtleCanvas, artX + 12, artY + 12, artW - 24, artH - 24);
      ctx.restore();
    } else {
      ctx.fillStyle = "#94A3B8";
      ctx.font = '24px "PingFang SC", sans-serif';
      ctx.fillText("（这次作品没有海龟画作，画一个试试吧！）", artX + 60, artY + 90);
    }

    // 代码区
    const codeTitleY = artY + artH + 56;
    ctx.fillStyle = "#1E293B";
    ctx.font = 'bold 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText("📝 我的代码", 40, codeTitleY);

    const boxY = codeTitleY + 18;
    const boxH = 300;
    ctx.fillStyle = "#F8FAFC";
    roundRect(ctx, 40, boxY, W - 80, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    roundRect(ctx, 40, boxY, W - 80, boxH, 16);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = '18px "SF Mono", Menlo, Consolas, monospace';
    const lines = String(code).split(String.fromCharCode(10)).slice(0, 13);
    lines.forEach((ln, i) => {
      ctx.fillText(ln.slice(0, 48), 62, boxY + 40 + i * 21);
    });

    // 底部署名
    ctx.fillStyle = "#64748B";
    ctx.font = '18px "PingFang SC", sans-serif';
    const dateStr = new Date().toLocaleDateString("zh-CN");
    ctx.fillText("用「萌码 Python」创作 · " + dateStr, 40, H - 42);

    return c;
  }

  function toBlob(options) {
    const canvas = create(options);
    return new Promise((resolve) => {
      if (canvas.toBlob) {
        canvas.toBlob(b => resolve(b), "image/png");
      } else {
        const dataUrl = canvas.toDataURL("image/png");
        const bin = atob(dataUrl.split(",")[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        resolve(new Blob([bytes], { type: "image/png" }));
      }
    });
  }

  return { create, toBlob };
})();
