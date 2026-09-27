import * as THREE from 'three';
import { BLOCK_TYPES, DEFAULT_BLOCK_TYPE } from '../config/blockTypes.js';
import { Block, createBlockResources, disposeBlockResources } from './Block.js';

export class World {
  constructor(scene) {
    // Group 用来统一管理模型。不要旋转或缩放它，整数坐标就是世界坐标。
    this.group = new THREE.Group();
    scene.add(this.group);
    this.blocks = new Map();
    this.resources = createBlockResources();
  }

  getKey(x, y, z) { return `${x},${y},${z}`; }
  getBlock(x, y, z) { return this.blocks.get(this.getKey(x, y, z)); }
  hasBlock(x, y, z) { return this.blocks.has(this.getKey(x, y, z)); }
  getMeshes() { return Array.from(this.blocks.values()); }

  addBlock(x, y, z, type = DEFAULT_BLOCK_TYPE) {
    if (![x, y, z].every(Number.isInteger) || !BLOCK_TYPES[type]) {
      throw new Error('方块坐标必须是整数，类型必须是 1、2 或 3。');
    }
    if (this.hasBlock(x, y, z)) return null;
    const block = new Block(x, y, z, type, this.resources);
    this.blocks.set(this.getKey(x, y, z), block);
    this.group.add(block);
    block.updateMatrixWorld(true);
    return block;
  }

  removeBlock(x, y, z) {
    const block = this.getBlock(x, y, z);
    if (!block) return false;
    this.group.remove(block);
    this.blocks.delete(this.getKey(x, y, z));
    // 这里只移除模型；几何体和材质还被其他方块共用，不能销毁。
    return true;
  }

  generateFlatWorld(size = 20) {
    this.group.clear();
    this.blocks.clear();
    // size=20 时，中心坐标从 -10 到 9，正好 20 × 20 = 400 块。
    const start = -Math.floor(size / 2);
    for (let x = start; x < start + size; x++) {
      for (let z = start; z < start + size; z++) this.addBlock(x, 0, z);
    }
  }

  getHighestY(x, z) {
    let highest = -Infinity;
    for (const block of this.blocks.values()) {
      if (block.position.x === x && block.position.z === z) {
        highest = Math.max(highest, block.position.y);
      }
    }
    return highest;
  }

  dispose() {
    this.group.removeFromParent();
    this.group.clear();
    this.blocks.clear();
    disposeBlockResources(this.resources);
  }
}

