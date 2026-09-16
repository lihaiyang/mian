/**
 * 🐢 高保真海龟画图引擎 (Turtle Graphics Engine for Kids)
 * 纯 HTML5 Canvas 实现，支持海龟平滑转向、爬行动画、涂色、测速、画作导出
 */
const TurtleEngine = (() => {
  let canvas = null;
  let ctx = null;
  let sprite = null;

  // 画布逻辑大小
  const WIDTH = 500;
  const HEIGHT = 500;
  const ORIGIN_X = WIDTH / 2;
  const ORIGIN_Y = HEIGHT / 2;

  // 海龟实时状态
  let state = {
    x: 0,
    y: 0,
    angle: 0, // 0度朝右，90度朝上，逆时针方向与经典数学坐标系保持一致
    penDown: true,
    penColor: "#EF4444",
    fillColor: "#EF4444",
    penSize: 3,
    isFilling: false,
    fillPath: [],
    visible: true,
    speed: 7 // 1~10
  };

  // 待播放动画命令队列
  let commandQueue = [];
  let isAnimating = false;
  let animTimer = null;
  let idleListeners = [];

  function init(canvasElem, spriteElem) {
    canvas = canvasElem;
    sprite = spriteElem;
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    // 设置高分辨率清晰度
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";
    ctx.scale(dpr, dpr);

    // 画布自适应缩放：面板比 500px 窄时整体缩小，避免画作出界被裁切
    const container = document.getElementById("turtleContainer");
    if (window.ResizeObserver && container) {
      new ResizeObserver(fit).observe(container);
    }
    window.addEventListener("resize", fit);

    reset();
  }

  // 根据容器大小缩放画布舞台（视觉缩放，坐标系不变）
  function fit() {
    if (!canvas) return;
    const container = document.getElementById("turtleContainer");
    const stage = document.getElementById("turtleStage");
    if (!container || !stage) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return; // 视窗隐藏时跳过
    const scale = Math.min(w / WIDTH, h / HEIGHT, 1.15);
    stage.style.transform = `scale(${Math.max(0.2, scale)})`;
    stage.style.transformOrigin = "center center";
  }

  function reset() {
    stopAnimation();
    commandQueue = [];
    idleListeners = []; // 丢弃上一次运行遗留的回调，防止重复庆祝
    state = {
      x: 0,
      y: 0,
      angle: 0,
      penDown: true,
      penColor: "#EF4444",
      fillColor: "#EF4444",
      penSize: 3,
      isFilling: false,
      fillPath: [],
      visible: true,
      speed: parseInt(document.getElementById("turtleSpeedRange")?.value || 7)
    };

    // 恢复画布底色并清空
    if (canvas) canvas.style.background = "#FFFFFF";
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // 绘制轻微的中心十字浅色引导参考
    drawBackgroundGrid();
    updateSpritePosition();
  }

  function drawBackgroundGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(226, 232, 240, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // 中心微弱十字线
    ctx.beginPath();
    ctx.moveTo(0, ORIGIN_Y);
    ctx.lineTo(WIDTH, ORIGIN_Y);
    ctx.moveTo(ORIGIN_X, 0);
    ctx.lineTo(ORIGIN_X, HEIGHT);
    ctx.stroke();

    ctx.restore();
  }

  function updateSpritePosition() {
    if (!sprite) return;
    if (!state.visible) {
      sprite.style.display = "none";
      return;
    }
    sprite.style.display = "block";

    // 屏幕坐标转换：数学坐标系 (0,0) 在中心，y 朝上
    const screenX = ORIGIN_X + state.x;
    const screenY = ORIGIN_Y - state.y;

    // Sprite 本身宽高为 28px，中心居中
    const left = screenX - 14;
    const top = screenY - 14;

    // 经典 Turtle：0度朝东（右），right(90) 后顺时针朝南（下）
    // CSS 旋转也是顺时针正角，因此正好使用 -angle
    const rotationDeg = -state.angle;

    sprite.style.left = left + "px";
    sprite.style.top = top + "px";
    sprite.style.transform = `rotate(${rotationDeg}deg)`;
  }

  function toScreenX(mathX) {
    return ORIGIN_X + mathX;
  }

  function toScreenY(mathY) {
    return ORIGIN_Y - mathY;
  }

  // 执行一条画图指令（直接画或动画步进）
  function executeCommand(cmd) {
    switch (cmd.type) {
      case "FORWARD":
      case "BACKWARD": {
        // 将长距离拆成小步续帧执行，让海龟有「爬行动画」而不是瞬移
        const dirSign = cmd.type === "FORWARD" ? 1 : -1;
        const MAX_STEP = 10;
        const total = cmd.distance;
        const stepLen = Math.min(MAX_STEP, Math.abs(total)) * Math.sign(total || 1) * dirSign;
        const rad = (state.angle * Math.PI) / 180;
        const newX = state.x + stepLen * Math.cos(rad);
        const newY = state.y + stepLen * Math.sin(rad);

        if (state.penDown) {
          ctx.beginPath();
          ctx.strokeStyle = state.penColor;
          ctx.lineWidth = state.penSize;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(toScreenX(state.x), toScreenY(state.y));
          ctx.lineTo(toScreenX(newX), toScreenY(newY));
          ctx.stroke();
        }

        if (state.isFilling) {
          state.fillPath.push({ x: toScreenX(newX), y: toScreenY(newY) });
        }

        state.x = newX;
        state.y = newY;

        // 剩余距离放到队首继续，保证后续指令顺序正确（保留原始方向符号）
        const remaining = Math.abs(total) - Math.abs(stepLen);
        if (remaining > 0.01) {
          commandQueue.unshift({ type: cmd.type, distance: remaining * Math.sign(total || 1) });
        }
        break;
      }

      case "RIGHT": {
        state.angle = (state.angle - cmd.degrees) % 360;
        break;
      }

      case "LEFT": {
        state.angle = (state.angle + cmd.degrees) % 360;
        break;
      }

      case "GOTO": {
        // 同样分步移动，海龟平滑地「走」向目标点
        const dx = cmd.x - state.x;
        const dy = cmd.y - state.y;
        const dist = Math.hypot(dx, dy);
        const MAX_STEP = 10;
        let nx = cmd.x;
        let ny = cmd.y;
        if (dist > MAX_STEP) {
          nx = state.x + (dx / dist) * MAX_STEP;
          ny = state.y + (dy / dist) * MAX_STEP;
          commandQueue.unshift({ type: "GOTO", x: cmd.x, y: cmd.y });
        }
        if (state.penDown) {
          ctx.beginPath();
          ctx.strokeStyle = state.penColor;
          ctx.lineWidth = state.penSize;
          ctx.lineCap = "round";
          ctx.moveTo(toScreenX(state.x), toScreenY(state.y));
          ctx.lineTo(toScreenX(nx), toScreenY(ny));
          ctx.stroke();
        }
        if (state.isFilling) {
          state.fillPath.push({ x: toScreenX(nx), y: toScreenY(ny) });
        }
        state.x = nx;
        state.y = ny;
        break;
      }

      case "CIRCLE": {
        // 圆弧拟合：与真实 Python turtle 对齐
        // radius > 0：圆心在海龟左侧，逆时针（角度递增）
        // radius < 0：圆心在海龟右侧，顺时针（角度递减），距离取绝对值
        // 每帧只走一小步并续帧，让画弧也有流畅动画
        const ccw = cmd.radius >= 0;
        const radius = Math.abs(cmd.radius);
        const extent = cmd.extent == null ? 360 : cmd.extent;
        const steps = Math.max(12, Math.floor(Math.abs(extent) / 8));
        const done = cmd._done || 0;
        const stepDist = (2 * Math.PI * radius * Math.abs(extent) / 360) / steps;
        const stepAngle = extent / steps;

        const rad = (state.angle * Math.PI) / 180;
        const nextX = state.x + stepDist * Math.cos(rad);
        const nextY = state.y + stepDist * Math.sin(rad);

        if (state.penDown) {
          ctx.beginPath();
          ctx.strokeStyle = state.penColor;
          ctx.lineWidth = state.penSize;
          ctx.lineCap = "round";
          ctx.moveTo(toScreenX(state.x), toScreenY(state.y));
          ctx.lineTo(toScreenX(nextX), toScreenY(nextY));
          ctx.stroke();
        }

        if (state.isFilling) {
          state.fillPath.push({ x: toScreenX(nextX), y: toScreenY(nextY) });
        }

        state.x = nextX;
        state.y = nextY;
        state.angle += (ccw ? 1 : -1) * stepAngle;

        if (done + 1 < steps) {
          commandQueue.unshift({ type: "CIRCLE", radius: cmd.radius, extent: extent, _done: done + 1 });
        }
        break;
      }

      case "COLOR": {
        state.penColor = cmd.color;
        if (cmd.fillColor) state.fillColor = cmd.fillColor;
        break;
      }

      case "FILLCOLOR": {
        state.fillColor = cmd.color;
        break;
      }

      case "PENSIZE": {
        state.penSize = Math.max(1, cmd.size);
        break;
      }

      case "PENUP": {
        state.penDown = false;
        break;
      }

      case "PENDOWN": {
        state.penDown = true;
        break;
      }

      case "BEGIN_FILL": {
        state.isFilling = true;
        state.fillPath = [{ x: toScreenX(state.x), y: toScreenY(state.y) }];
        break;
      }

      case "END_FILL": {
        if (state.isFilling && state.fillPath.length > 2) {
          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = state.fillColor;
          ctx.moveTo(state.fillPath[0].x, state.fillPath[0].y);
          for (let i = 1; i < state.fillPath.length; i++) {
            ctx.lineTo(state.fillPath[i].x, state.fillPath[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        state.isFilling = false;
        state.fillPath = [];
        break;
      }

      case "SPEED": {
        // Python turtle 中 speed(0) 表示最快，与 1~10 档位对齐
        const s = cmd.speed === 0 ? 10 : Math.max(1, Math.min(10, cmd.speed));
        state.speed = s;
        // 同步 UI 滑块（如果代码中调用了 t.speed()）
        const slider = document.getElementById("turtleSpeedRange");
        const label = document.getElementById("speedLabel");
        if (slider) slider.value = s;
        if (label) {
          const labels = ["超慢", "很慢", "慢速", "适中", "正常", "稍快", "快速", "飞快", "超快", "闪电飞速⚡"];
          label.textContent = labels[s - 1] || "正常";
        }
        break;
      }

      case "SET_HEADING": {
        state.angle = cmd.degrees % 360;
        break;
      }

      case "SETX": {
        const targetX = cmd.x;
        if (state.penDown) {
          ctx.beginPath();
          ctx.strokeStyle = state.penColor;
          ctx.lineWidth = state.penSize;
          ctx.lineCap = "round";
          ctx.moveTo(toScreenX(state.x), toScreenY(state.y));
          ctx.lineTo(toScreenX(targetX), toScreenY(state.y));
          ctx.stroke();
        }
        if (state.isFilling) {
          state.fillPath.push({ x: toScreenX(targetX), y: toScreenY(state.y) });
        }
        state.x = targetX;
        break;
      }

      case "SETY": {
        const targetY = cmd.y;
        if (state.penDown) {
          ctx.beginPath();
          ctx.strokeStyle = state.penColor;
          ctx.lineWidth = state.penSize;
          ctx.lineCap = "round";
          ctx.moveTo(toScreenX(state.x), toScreenY(state.y));
          ctx.lineTo(toScreenX(state.x), toScreenY(targetY));
          ctx.stroke();
        }
        if (state.isFilling) {
          state.fillPath.push({ x: toScreenX(state.x), y: toScreenY(targetY) });
        }
        state.y = targetY;
        break;
      }

      case "HOME": {
        if (state.penDown) {
          ctx.beginPath();
          ctx.strokeStyle = state.penColor;
          ctx.lineWidth = state.penSize;
          ctx.lineCap = "round";
          ctx.moveTo(toScreenX(state.x), toScreenY(state.y));
          ctx.lineTo(ORIGIN_X, ORIGIN_Y);
          ctx.stroke();
        }
        state.x = 0;
        state.y = 0;
        state.angle = 0;
        break;
      }

      case "DOT": {
        const size = cmd.size || state.penSize + 4;
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = cmd.color || state.penColor;
        ctx.arc(toScreenX(state.x), toScreenY(state.y), Math.max(1, size / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case "WRITE": {
        ctx.save();
        ctx.fillStyle = state.penColor;
        ctx.font = "bold 15px 'PingFang SC', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(String(cmd.text), toScreenX(state.x), toScreenY(state.y));
        ctx.restore();
        break;
      }

      case "BGCOLOR": {
        if (canvas) canvas.style.background = cmd.color;
        break;
      }

      case "HIDETURTLE": {
        state.visible = false;
        break;
      }

      case "SHOWTURTLE": {
        state.visible = true;
        break;
      }

      case "CLEAR": {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        drawBackgroundGrid();
        break;
      }
    }

    updateSpritePosition();
  }

  // 动画步进驱动
  function processQueue() {
    if (commandQueue.length === 0) {
      isAnimating = false;
      // 队列播完，通知等待方（例如：画作完成后再撒花庆祝）
      const listeners = idleListeners;
      idleListeners = [];
      listeners.forEach(fn => {
        try { fn(); } catch (e) { console.error(e); }
      });
      return;
    }

    isAnimating = true;

    // 速度对应每帧执行的指令数和延迟
    // speed=10: 一帧跑多个指令；speed=1: 每次等待较长时间
    const speed = state.speed;
    const batchSize = speed >= 9 ? 6 : (speed >= 7 ? 3 : 1);
    const delay = speed >= 9 ? 4 : Math.max(8, (11 - speed) * 16);

    for (let i = 0; i < batchSize && commandQueue.length > 0; i++) {
      const cmd = commandQueue.shift();
      executeCommand(cmd);
    }

    animTimer = setTimeout(processQueue, delay);
  }

  function stopAnimation() {
    if (animTimer) {
      clearTimeout(animTimer);
      animTimer = null;
    }
    isAnimating = false;
  }

  function enqueue(cmd) {
    commandQueue.push(cmd);
    if (!isAnimating) {
      processQueue();
    }
  }

  return {
    init,
    reset,
    fit,

    // 注册「动画队列播完」回调；若当前空闲则立即执行
    onIdle(fn) {
      if (commandQueue.length === 0 && !isAnimating) {
        fn();
      } else {
        idleListeners.push(fn);
      }
    },

    clear() {
      enqueue({ type: "CLEAR" });
    },

    forward(dist) {
      enqueue({ type: "FORWARD", distance: dist });
    },

    backward(dist) {
      enqueue({ type: "BACKWARD", distance: dist });
    },

    right(deg) {
      enqueue({ type: "RIGHT", degrees: deg });
    },

    left(deg) {
      enqueue({ type: "LEFT", degrees: deg });
    },

    circle(radius, extent = 360) {
      enqueue({ type: "CIRCLE", radius: radius, extent: extent });
    },

    goto(x, y) {
      enqueue({ type: "GOTO", x: x, y: y });
    },

    color(c, fillC) {
      enqueue({ type: "COLOR", color: c, fillColor: fillC });
    },

    fillcolor(c) {
      enqueue({ type: "FILLCOLOR", color: c });
    },

    pensize(s) {
      enqueue({ type: "PENSIZE", size: s });
    },

    penup() {
      enqueue({ type: "PENUP" });
    },

    pendown() {
      enqueue({ type: "PENDOWN" });
    },

    begin_fill() {
      enqueue({ type: "BEGIN_FILL" });
    },

    end_fill() {
      enqueue({ type: "END_FILL" });
    },

    setSpeed(spd) {
      // speed(0) 在真实 turtle 中代表最快
      const s = spd === 0 ? 10 : Math.max(1, Math.min(10, spd));
      state.speed = s;
      enqueue({ type: "SPEED", speed: s });
    },

    hideturtle() {
      enqueue({ type: "HIDETURTLE" });
    },

    showturtle() {
      enqueue({ type: "SHOWTURTLE" });
    },

    setheading(deg) {
      enqueue({ type: "SET_HEADING", degrees: deg });
    },

    setx(x) {
      enqueue({ type: "SETX", x: x });
    },

    sety(y) {
      enqueue({ type: "SETY", y: y });
    },

    home() {
      enqueue({ type: "HOME" });
    },

    dot(size, color) {
      enqueue({ type: "DOT", size: size, color: color });
    },

    write(text) {
      enqueue({ type: "WRITE", text: text });
    },

    bgcolor(c) {
      enqueue({ type: "BGCOLOR", color: c });
    },

    // 导出画布为图片（先合成底色，避免透明背景在部分看图软件中显示为黑色）
    exportImage() {
      try {
        const temp = document.createElement("canvas");
        temp.width = canvas.width;
        temp.height = canvas.height;
        const tctx = temp.getContext("2d");
        tctx.fillStyle = canvas.style.background || "#FFFFFF";
        tctx.fillRect(0, 0, temp.width, temp.height);
        tctx.drawImage(canvas, 0, 0);

        const link = document.createElement("a");
        link.download = `我的海龟画作_${Date.now()}.png`;
        link.href = temp.toDataURL("image/png");
        link.click();
        SoundEffects.playSuccess();
      } catch (e) {
        console.error("导出图片失败", e);
      }
    }
  };
})();

// 挂载到全局 window，供 Python 桥接层直接调用
window.TurtleEngine = TurtleEngine;
