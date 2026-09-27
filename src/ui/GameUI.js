import { BLOCK_TYPES } from '../config/blockTypes.js';

// 菜单、操作模式、提示文字由这里管理，让 main.js 专心连接游戏模块。
export class GameUI {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.menu = document.querySelector('#menu');
    this.startButton = document.querySelector('#start-button');
    this.menuMessage = document.querySelector('#menu-message');
    this.modeLabel = document.querySelector('#mode-label');
    this.targetLabel = document.querySelector('#target-label');
    this.statusText = document.querySelector('#status-text');
    this.actionMessage = document.querySelector('#action-message');
    this.blockCount = document.querySelector('#block-count');
    this.dragMode = false;
    this.startPending = false;
    this.messageUntil = 0;
    this.events = new AbortController();
    const options = { signal: this.events.signal };

    this.startButton.addEventListener('click', () => this.start(), options);
    document.addEventListener('pointerlockerror', () => this.useDragMode(), options);
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        // 如果点击进入后马上按了 Esc，就不要让延迟到达的锁定事件重新开始游戏。
        if (!this.startPending) { document.exitPointerLock(); return; }
        this.startPending = false;
        this.dragMode = false;
        this.setPlaying(true);
      } else if (!this.dragMode) this.setPlaying(false);
    }, options);
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') this.pause();
    }, options);
    window.addEventListener('blur', () => this.pause(), options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    }, options);
  }

  start() {
    if (this.dragMode) return this.setPlaying(true);
    this.startPending = true;
    // Pointer Lock 是浏览器 API：隐藏光标，提供相对位移。必须由点击触发。
    try { this.canvas.requestPointerLock()?.catch(() => this.useDragMode()); }
    catch { this.useDragMode(); }
  }

  useDragMode() {
    if (!this.startPending) return;
    this.startPending = false;
    this.dragMode = true;
    this.menuMessage.textContent = '此窗口使用拖动视角：按住鼠标拖动转向；单击左键挖掘，单击右键放置。';
    this.setPlaying(true);
  }

  setPlaying(playing) {
    this.input.setActive(playing, this.dragMode ? 'drag' : 'locked');
    this.menu.hidden = playing;
    document.body.dataset.playing = String(playing);
    document.body.dataset.lookMode = this.dragMode ? 'drag' : 'locked';
    if (playing) {
      this.startButton.textContent = '继续游戏 →';
      this.canvas.focus({ preventScroll: true });
    }
    this.modeLabel.textContent = this.dragMode ? '按住鼠标拖动转向 · Esc 暂停' : '鼠标转向 · Esc 暂停';
  }

  pause() {
    this.startPending = false;
    this.setPlaying(false);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  showAction(message, now) {
    this.actionMessage.textContent = message;
    this.messageUntil = now + 1500;
  }

  update(player, world, target, now) {
    if (now > this.messageUntil) this.actionMessage.textContent = '';
    this.targetLabel.textContent = target
      ? BLOCK_TYPES[target.block.userData.blockType].name + ' · ' + target.block.position.toArray().join(', ')
      : '看向5格以内的方块';
    const state = !this.input.active ? '已暂停' : player.onGround ? '已落地' : '空中';
    this.statusText.textContent = `X ${player.position.x.toFixed(1)} · Y ${player.position.y.toFixed(1)} · Z ${player.position.z.toFixed(1)} · ${state}`;
    this.blockCount.textContent = world.blocks.size + ' 个方块';
  }

  dispose() { this.pause(); this.events.abort(); }
}

