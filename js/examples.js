/**
 * 🎁 少儿 Python 趣味案例库
 * 专为 10 岁孩子量身打造：生动好玩、代码简练、交互丰富
 */
// 示例分类（趣味宝库用）
const EXAMPLE_CATEGORIES = [
  { id: "basic",  name: "入门启蒙", emoji: "🌟" },
  { id: "turtle", name: "海龟画室", emoji: "🐢" },
  { id: "game",   name: "游戏乐园", emoji: "🎮" },
  { id: "math",   name: "数学魔法", emoji: "🧮" },
  { id: "text",   name: "文字艺术", emoji: "✍️" }
];

// 每个示例的分类 / 难度 / 一句话介绍
const EXAMPLE_META = {
  ex_1:  { category: "basic",  level: 1, desc: "用 print 做自我介绍，认识 Python" },
  ex_13: { category: "basic",  level: 1, desc: "打印一张爱心电子贺卡送给家人" },
  ex_2:  { category: "turtle", level: 2, desc: "小海龟转一圈画出彩虹风车" },
  ex_4:  { category: "turtle", level: 2, desc: "画一颗饱满的红心贺卡" },
  ex_6:  { category: "turtle", level: 3, desc: "在夜空里撒下会闪的星星" },
  ex_7:  { category: "turtle", level: 3, desc: "循环画出彩色螺旋线" },
  ex_3:  { category: "game",   level: 2, desc: "猜数字游戏，用 input 互动" },
  ex_8:  { category: "game",   level: 3, desc: "和电脑玩石头剪刀布" },
  ex_5:  { category: "math",   level: 2, desc: "口算闯关，考考反应速度" },
  ex_9:  { category: "math",   level: 1, desc: "双层循环打印九九乘法表" },
  ex_10: { category: "math",   level: 3, desc: "斐波那契数列，兔子家族的秘密" },
  ex_11: { category: "text",   level: 1, desc: "用自己的名字做艺术字" },
  ex_12: { category: "text",   level: 2, desc: "英汉小词典，输入单词查中文" }
};

const DEFAULT_EXAMPLES = [
  {
    id: "ex_1",
    name: "01_魔法问候.py",
    content: `# 🌟 案例 1：我的第一个 Python 魔法程序
# 💡 提示：点击右侧运行舞台上的绿色「🚀 运行代码」按钮试试吧！

print("==================================")
print("   🎉 欢迎来到 Python 奇幻世界！  ")
print("==================================")

name = "小小宇航员"
age = 10
hobby = "探险宇宙与编程"

print(f"大家好！我是【{name}】🐱")
print(f"今年 {age} 岁啦！最喜欢的事情是：{hobby}！")
print("今天我要用 Python 创造属于我自己的小游戏！✨")
print("一起来倒数发射火箭吧：🚀")

for i in [3, 2, 1]:
    print(f"  倒计时: {i} ...")

print("💥 咻~~~~ 火箭发射升空！太酷啦！🌟")
`
  },
  {
    id: "ex_2",
    name: "02_彩虹海龟画风车.py",
    content: `# 🐢 案例 2：彩虹海龟风车画卷
# 💡 Python 的海龟画笔会一步一步在右边的画布上画出美丽风车！

import turtle

t = turtle.Turtle()
t.pensize(3)
t.speed(8)

# 绚丽的彩虹颜色列表
rainbow_colors = ["#EF4444", "#F97316", "#FBBF24", "#10B981", "#06B6D4", "#6366F1", "#EC4899"]

print("🎨 小海龟正在挥舞魔法画笔画彩虹风车...")

# 画一个美丽的七彩旋转风车
for i in range(28):
    color = rainbow_colors[i % len(rainbow_colors)]
    t.color(color)
    t.forward(i * 5 + 20)
    t.right(75)

print("✨ 哇塞！彩虹风车绘制完成啦，是不是超级漂亮！🎉")
`
  },
  {
    id: "ex_3",
    name: "03_神奇猜数字游戏.py",
    content: `# 🎲 案例 3：人机互动猜数字大冒险
# 💡 电脑悄悄想了一个 1 到 20 之间的神秘数字，你能猜中吗？

import random

secret_number = random.randint(1, 20)
attempts = 0
max_tries = 5
won = False

print("🤖 电脑：我已经想好了一个 1~20 的神秘数字！")
print(f"你有 {max_tries} 次机会，快来挑战吧！🎯")

while attempts < max_tries:
    attempts += 1
    # 提问并等待小朋友在下方输入
    guess_str = input(f"第 {attempts} 次猜，请输入你的数字 (1-20): ")
    
    # 检查输入是否为数字
    if not guess_str.isdigit():
        print("⚠️ 要输入纯数字哦，这一次机会用掉啦！")
        continue
        
    guess = int(guess_str)
    
    if guess == secret_number:
        won = True
        print(f"🎉 太聪明啦！你只用了 {attempts} 次就猜中了！答案就是 {secret_number}！🏆")
        break
    elif guess < secret_number:
        print("📈 哎呀，猜小了一点点，再大一点试试！")
    else:
        print("📉 哎呀，猜大了一点点，再小一点试试！")

if not won:
    print(f"😢 机会用光啦，其实神秘数字是 {secret_number}，下次一定能赢！💪")
`
  },
  {
    id: "ex_4",
    name: "04_爱心魔法阵.py",
    content: `# ❤️ 案例 4：海龟画图制作爱心贺卡
# 💡 运行后小海龟会画出一颗漂亮饱满的红心！

import turtle

t = turtle.Turtle()
t.pensize(4)
t.color("#EF4444")
t.speed(7)

print("正在绘制充满爱意的心形图案...❤️")

t.begin_fill()
t.left(50)
t.forward(120)
t.circle(45, 200)
t.right(140)
t.circle(45, 200)
t.forward(120)
t.end_fill()

print("❤️ 爱心绘制完成！把这份温暖送给爸爸妈妈和好朋友吧！✨")
`
  },
  {
    id: "ex_5",
    name: "05_超级算术小神童.py",
    content: `# 🧠 案例 5：算术闯关大挑战
# 💡 考考你的数学反应速度！一共 3 道题，看看能得多少分！

import random

score = 0
total_questions = 3

print("欢迎来到【口算大冲关】！准备好挑战了吗？🚀")

for q_num in range(1, total_questions + 1):
    a = random.randint(3, 15)
    b = random.randint(2, 12)
    correct_ans = a + b
    
    user_ans = input(f"第 {q_num} 题：{a} + {b} 等于多少？ ")
    
    if user_ans.strip() == str(correct_ans):
        print("✅ 恭喜答对！加 100 分！🌟")
        score += 100
    else:
        print(f"❌ 哎呀算错啦，正确答案是 {correct_ans} 哦，别灰心！")

print(f"🏁 挑战结束！你的总分是：{score} 分！")
if score == 300:
    print("👑 太厉害了！满分小数学天才！")
elif score >= 200:
    print("👏 很优秀！继续加油！")
else:
    print("💪 练一练你会更棒的！")
`
  },
  {
    id: "ex_6",
    name: "06_星空许愿池.py",
    content: `# 🌟 案例 6：星空许愿池
# 💡 小海龟会在深蓝色的夜空里，随机撒下 40 颗一闪一闪的星星！

import turtle
import random

t = turtle.Turtle()
t.speed(0)
t.hideturtle()
t.pensize(2)
turtle.bgcolor("#0B1026")

colors = ["#FDE68A", "#FCA5A5", "#93C5FD", "#C4B5FD", "#FFFFFF"]

for i in range(40):
    x = random.randint(-220, 220)
    y = random.randint(-220, 220)
    t.penup()
    t.goto(x, y)
    t.pendown()
    t.color(random.choice(colors))
    size = random.randint(6, 18)
    for k in range(5):
        t.forward(size)
        t.right(144)

print("🌟 星空画好啦！每一颗星星都是一个愿望，快许个愿吧~")
`
  },
  {
    id: "ex_7",
    name: "07_彩虹螺旋.py",
    content: `# 🌈 案例 7：彩虹螺旋
# 💡 每画一条线就转 59 度，颜色循环变化，就长成螺旋啦！

import turtle

t = turtle.Turtle()
t.speed(0)
t.pensize(3)

colors = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6", "#8B5CF6"]

for i in range(120):
    t.pencolor(colors[i % len(colors)])
    t.forward(i * 2)
    t.right(59)

print("🌈 彩虹螺旋完成！换个角度（59 改 91）会有惊喜哦~")
`
  },
  {
    id: "ex_8",
    name: "08_石头剪刀布.py",
    content: `# 🎮 案例 8：石头剪刀布
# 💡 在下方输入框里输入「石头」「剪刀」或「布」，和电脑大战 5 局！

import random

choices = ["石头", "剪刀", "布"]
wins = 0

print("来玩石头剪刀布吧！一共 5 局，看看你能赢几局~")

for round_no in range(1, 6):
    me = input(f"第 {round_no} 局，你出什么？ ").strip()
    if me not in choices:
        print("要输入 石头、剪刀 或 布 哦，这一局算平局~")
        continue
    cpu = random.choice(choices)
    print(f"你出【{me}】，电脑出【{cpu}】")
    if me == cpu:
        print("🤝 平局！再来一局~")
    elif (me == "石头" and cpu == "剪刀") or (me == "剪刀" and cpu == "布") or (me == "布" and cpu == "石头"):
        wins += 1
        print(f"🎉 你赢啦！当前胜场 {wins}")
    else:
        print("😅 这局输给电脑啦，别灰心！")

print(f"🏁 游戏结束，你一共赢了 {wins} 局！")
if wins >= 4:
    print("👑 猜拳小王者就是你！")
elif wins >= 2:
    print("👏 表现不错，下次试试连胜！")
else:
    print("💪 再来一局，运气马上就来啦！")
`
  },
  {
    id: "ex_9",
    name: "09_乘法口诀表.py",
    content: `# 🧮 案例 9：九九乘法口诀表
# 💡 外面的循环管「第几行」，里面的循环管「这一行有几句」。

print("📚 九九乘法口诀表")
print("-" * 34)

for i in range(1, 10):
    row = ""
    for j in range(1, i + 1):
        row += f"{j}x{i}={i * j}  "
    print(row)

print("-" * 34)
print("✨ 背熟它，你就是计算小达人！")
`
  },
  {
    id: "ex_10",
    name: "10_斐波那契兔子.py",
    content: `# 🐰 案例 10：兔子家族的秘密（斐波那契数列）
# 💡 规律：前两个数加起来，就是下一个数：0, 1, 1, 2, 3, 5, 8 ...

a = 0
b = 1
numbers = []

for i in range(12):
    numbers.append(a)
    a, b = b, a + b

print("🐰 兔子家族每月数量：")
print(numbers)
print(f"前 12 个月一共有 {sum(numbers)} 只兔子！")
print(f"数列里最大的数是 {max(numbers)}")
`
  },
  {
    id: "ex_11",
    name: "11_名字艺术字.py",
    content: `# ✍️ 案例 11：我的名字艺术字
# 💡 输入你的名字，Python 会把它排成漂亮的方框和竖排艺术字！

name = input("请输入你的名字：").strip()
if not name:
    name = "小小程序员"

frame = "✧" * (len(name) * 2 + 2)

print(frame)
print("✧ " + " ".join(name) + " ✧")
print(frame)
print("")
print("竖着写是这样：")
for ch in name:
    print("    " + ch)

print(f"你的名字一共 {len(name)} 个字，很好听！✨")
`
  },
  {
    id: "ex_12",
    name: "12_英汉小词典.py",
    content: `# 📖 案例 12：我的英汉小词典
# 💡 用字典保存单词和中文，输入单词就能马上查到！

words = {"apple": "苹果", "banana": "香蕉", "cat": "小猫", "dog": "小狗", "panda": "熊猫"}

print("我的小词典里有：", "、".join(words.keys()))

for i in range(3):
    word = input("输入一个英文单词（直接回车可跳过）：").strip().lower()
    if not word:
        break
    if word in words:
        print(f"🔤 {word} 的意思是：{words[word]}")
    else:
        print("我的小词典里还没有这个词，换一个试试吧~")

print("查词结束，你真棒！👏")
`
  },
  {
    id: "ex_13",
    name: "13_给家人的贺卡.py",
    content: `# 💌 案例 13：给家人的电子贺卡
# 💡 学会用 print 和 f-string 排版，做一张暖暖的贺卡！

dear = "爸爸妈妈"
wish = "身体健康，每天都开开心心"

print("❤️" * 20)
print(f"亲爱的{dear}：")
print("")
print(f"    我想对你们说：{wish}！")
print("    谢谢你们每天陪我长大~")
print("")
print("                爱你们的小朋友 💗")
print("❤️" * 20)
`
  }
];
