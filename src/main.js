import './style.css';
import { createScene } from './scene/createScene.js';
import { World } from './world/World.js';
import { Player } from './player/Player.js';
import { InputManager } from './systems/InputManager.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { BlockInteraction } from './systems/BlockInteraction.js';
import { Hotbar } from './ui/Hotbar.js';
import { GameUI } from './ui/GameUI.js';

// 入口负责连接模块和安排每帧顺序，具体功能在各自文件中。
const canvas = document.querySelector('#game-canvas');
try {
  const { scene, camera, renderer, dispose } = createScene(canvas);
  const world = new World(scene);
  world.generateFlatWorld(20);
  const input = new InputManager(canvas);
  const player = new Player(camera);
  const collision = new CollisionSystem(world);
  const interaction = new BlockInteraction(scene, world);
  const ui = new GameUI(canvas, input);
  const hotbar = new Hotbar(document.querySelector('#hotbar'), (type) => {
    input.selectedType = type;
  });

  let previousTime = performance.now();
  renderer.setAnimationLoop((time) => {
    // 毫秒除以1000转成秒。限制长帧，避免切回标签页后突然移动很远。
    const deltaTime = Math.min(Math.max((time - previousTime) / 1000, 0), 0.05);
    previousTime = time;
    if (input.active) {
      player.update(deltaTime, input, collision, world);
      interaction.update(camera);
      for (const action of input.consumeActions()) {
        const result = action.kind === 'break'
          ? interaction.breakBlock()
          : interaction.placeBlock(action.type, player, collision);
        ui.showAction(result.message, time);
        // 方块改变后立即刷新射线结果，防止下一次点击仍使用已经消失的方块。
        interaction.update(camera);
      }
    } else interaction.clear();

    hotbar.update(input.selectedType);
    ui.update(player, world, interaction.target, time);
    renderer.render(scene, camera);
  });

  // 热更新前停止事件和渲染循环，释放共用显存，避免越改代码越卡。
  if (import.meta.hot) import.meta.hot.dispose(() => {
    ui.dispose(); input.dispose(); hotbar.dispose();
    interaction.dispose(); world.dispose(); dispose();
  });
} catch (error) {
  console.error('游戏启动失败：', error);
  document.querySelector('#menu-message').textContent = '启动失败，请按 F12 查看第一条红色错误。';
  document.querySelector('#start-button').disabled = true;
}
