import { BLOCK_TYPES } from '../config/blockTypes.js';

// 选择栏只显示三种方块，并把点击选择通知给输入模块。
export class Hotbar {
  constructor(container, onSelect) {
    this.container = container;
    this.buttons = new Map();
    this.selectedType = null;
    this.events = new AbortController();
    container.replaceChildren();
    for (const type of Object.values(BLOCK_TYPES)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hotbar-slot';
      button.setAttribute('aria-label', `${type.id} ${type.name}`);
      button.innerHTML = `<span class="slot-key">${type.id}</span><span class="block-icon" aria-hidden="true"></span><span class="slot-name">${type.name}</span>`;
      button.querySelector('.block-icon').style.background =
        `linear-gradient(to bottom, ${type.color} 0 35%, ${type.sideColor} 35% 100%)`;
      button.addEventListener('click', () => onSelect(type.id), { signal: this.events.signal });
      this.buttons.set(type.id, button);
      container.append(button);
    }
  }

  update(selectedType) {
    if (this.selectedType === selectedType) return;
    this.selectedType = selectedType;
    for (const [type, button] of this.buttons) {
      button.classList.toggle('selected', type === selectedType);
      button.setAttribute('aria-pressed', String(type === selectedType));
    }
    document.querySelector('#selected-name').textContent = BLOCK_TYPES[selectedType].name + ' · 无限';
  }

  dispose() { this.events.abort(); this.container.replaceChildren(); }
}
