import { DEFAULT_BLOCK_TYPE } from '../config/blockTypes.js';

// 输入只记录操作，不直接移动玩家或修改方块。
export class InputManager {
  constructor(canvas) {
    this.active = false;
    this.lookMode = 'locked';
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.jumpRequested = false;
    this.actions = [];
    this.drag = null;
    this.selectedType = DEFAULT_BLOCK_TYPE;
    this.events = new AbortController();
    const options = { signal: this.events.signal };

    window.addEventListener('keydown', (event) => {
      if (!this.active) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'Digit1', 'Digit2', 'Digit3'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) this.jumpRequested = true;
      const type = { Digit1: 1, Digit2: 2, Digit3: 3 }[event.code];
      if (type) this.selectedType = type;
    }, options);
    window.addEventListener('keyup', (event) => this.keys.delete(event.code), options);
    document.addEventListener('mousemove', (event) => {
      if (!this.active) return;
      if (this.lookMode === 'locked') {
        this.mouseX += event.movementX;
        this.mouseY += event.movementY;
      } else if (this.drag) {
        // 鼠标在窗口外松开时可能收不到 mouseup；回来后按键已松开，就结束拖动。
        const buttonMask = this.drag.button === 0 ? 1 : 2;
        if (!(event.buttons & buttonMask)) { this.drag = null; return; }
        // 有些内置预览禁止 Pointer Lock。此时按住鼠标拖动转向，单击仍用于方块操作。
        if (Math.hypot(event.clientX - this.drag.startX, event.clientY - this.drag.startY) > 4) this.drag.moved = true;
        if (this.drag.moved) {
          this.mouseX += event.clientX - this.drag.lastX;
          this.mouseY += event.clientY - this.drag.lastY;
        }
        this.drag.lastX = event.clientX;
        this.drag.lastY = event.clientY;
      }
    }, options);
    canvas.addEventListener('mousedown', (event) => {
      if (!this.active || ![0, 2].includes(event.button)) return;
      event.preventDefault();
      if (this.lookMode === 'drag') {
        this.drag = {
          startX: event.clientX, startY: event.clientY,
          lastX: event.clientX, lastY: event.clientY,
          button: event.button, moved: false, type: this.selectedType,
        };
      } else this.queueClick(event.button, this.selectedType);
    }, options);
    document.addEventListener('mouseup', (event) => {
      if (!this.drag || event.button !== this.drag.button) return;
      if (this.active && !this.drag.moved) this.queueClick(event.button, this.drag.type);
      this.drag = null;
    }, options);
    canvas.addEventListener('contextmenu', (event) => event.preventDefault(), options);
    window.addEventListener('blur', () => this.clear(), options);
  }

  queueClick(button, type) {
    this.actions.push({ kind: button === 0 ? 'break' : 'place', type });
  }
  isDown(code) { return this.keys.has(code); }
  setActive(active, mode = 'locked') { this.active = active; this.lookMode = mode; this.clear(); }
  consumeMouse() {
    const movement = { x: this.mouseX, y: this.mouseY };
    this.mouseX = this.mouseY = 0;
    return movement;
  }
  consumeJump() {
    const requested = this.jumpRequested;
    this.jumpRequested = false;
    return requested;
  }
  consumeActions() {
    const actions = this.actions;
    this.actions = [];
    return actions;
  }
  clear() {
    this.keys.clear();
    this.mouseX = this.mouseY = 0;
    this.jumpRequested = false;
    this.actions = [];
    this.drag = null;
  }
  dispose() { this.events.abort(); this.clear(); }
}

