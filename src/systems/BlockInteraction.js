import * as THREE from 'three';
import { BLOCK_TYPES } from '../config/blockTypes.js';

// 负责屏幕中心的瞄准目标与方块操作，世界数据仍由 World 管理。
export class BlockInteraction {
  constructor(scene, world) {
    this.world = world;
    // Raycaster 发出虚拟射线，far=5 将操作距离限制在5个方块单位内。
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 5;
    this.screenCenter = new THREE.Vector2(0, 0);
    this.target = null;

    const box = new THREE.BoxGeometry(1.006, 1.006, 1.006);
    this.outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: '#fff8d8', depthTest: false }),
    );
    box.dispose();
    this.outline.renderOrder = 1;
    this.outline.visible = false;
    scene.add(this.outline);
  }

  update(camera) {
    camera.updateMatrixWorld();
    // 标准化屏幕坐标的中心是 (0,0)，因此射线始终沿准星方向发出。
    this.raycaster.setFromCamera(this.screenCenter, camera);
    // false 不检测方块内部的装饰格线，避免把线段误当成目标。
    const hit = this.raycaster.intersectObjects(this.world.getMeshes(), false)[0];
    if (!hit) { this.clear(); return null; }
    // 返回结果已经按距离排序，第一个就是最前面的方块，无法隔墙挖掘。
    this.target = { block: hit.object, normal: hit.face.normal.clone(), distance: hit.distance };
    this.outline.position.copy(hit.object.position);
    this.outline.visible = true;
    return this.target;
  }

  breakBlock() {
    if (!this.target) return { changed: false, message: '请先瞄准5格以内的方块' };
    const block = this.target.block;
    const { x, y, z } = block.position;
    this.world.removeBlock(x, y, z);
    this.clear();
    return { changed: true, message: '已破坏 ' + BLOCK_TYPES[block.userData.blockType].name };
  }

  placeBlock(type, player, collision) {
    if (!this.target) return { changed: false, message: '请先瞄准5格以内的方块' };
    if (!BLOCK_TYPES[type]) return { changed: false, message: '未知方块类型' };
    // 面法线指向该面的外侧；中心坐标加上法线，正好是紧邻的网格。
    // 世界中的方块没有旋转，因此局部面法线与世界方向相同。
    const position = this.target.block.position.clone().add(this.target.normal).round();
    const { x, y, z } = position;
    if (this.world.hasBlock(x, y, z)) return { changed: false, message: '这个位置已有方块' };
    if (collision.wouldOverlapPlayer(player, x, y, z)) {
      return { changed: false, message: '这里会碰到身体，请退后一点' };
    }
    this.world.addBlock(x, y, z, type);
    return { changed: true, message: '已放置 ' + BLOCK_TYPES[type].name };
  }

  clear() {
    this.target = null;
    this.outline.visible = false;
  }

  dispose() {
    this.outline.removeFromParent();
    this.outline.geometry.dispose();
    this.outline.material.dispose();
  }
}

