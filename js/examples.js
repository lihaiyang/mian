/**
 * 🎁 少儿 Python 趣味案例库
 * 专为 10 岁孩子量身打造：生动好玩、代码简练、交互丰富
 */
const DEFAULT_EXAMPLES = [
  {
    id: "ex_1",
    name: "01_魔法问候.py",
    content: `# 🌟 案例 1：我的第一个 Python 魔法程序
# 💡 提示：点击右上角的绿色「🚀 运行代码」试试吧！

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
  }
];
