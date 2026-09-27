import * as THREE from 'three';
import { BLOCK_TYPES } from '../config/blockTypes.js';

// 一个世界只创建一份资源，所有方块共用，避免重复占用显存。
export function createBlockResources() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const materials = new Map();
  const ownedMaterials = [];
  for (const type of Object.values(BLOCK_TYPES)) {
    const top = new THREE.MeshLambertMaterial({ color: type.color });
    const side = new THREE.MeshLambertMaterial({ color: type.sideColor });
    // 六个面的顺序为 +X、-X、+Y、-Y、+Z、-Z，+Y 就是顶面。
    materials.set(type.id, [side, side, top, side, side, side]);
    ownedMaterials.push(top, side);
  }
  const edges = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: '#293b29', transparent: true, opacity: 0.12,
  });
  return { geometry, materials, ownedMaterials, edges, edgeMaterial };
}

export class Block extends THREE.Mesh {
  constructor(x, y, z, type, resources) {
    super(resources.geometry, resources.materials.get(type));
    this.position.set(x, y, z);
    this.userData = { x, y, z, blockType: type };
    // EdgesGeometry 提取棱边，淡格线帮助分辨各个方块。
    this.add(new THREE.LineSegments(resources.edges, resources.edgeMaterial));
  }
}

export function disposeBlockResources(resources) {
  resources.geometry.dispose();
  resources.edges.dispose();
  resources.edgeMaterial.dispose();
  resources.ownedMaterials.forEach((material) => material.dispose());
}
