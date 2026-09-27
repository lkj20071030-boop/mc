const EPSILON = 0.000001;

export class CollisionSystem {
  constructor(world) { this.world = world; }

  getPlayerBounds(player) {
    const halfWidth = player.width / 2;
    return {
      min: { x: player.position.x - halfWidth, y: player.position.y, z: player.position.z - halfWidth },
      max: { x: player.position.x + halfWidth, y: player.position.y + player.height, z: player.position.z + halfWidth },
    };
  }

  overlapsBlock(bounds, x, y, z) {
    // AABB：两个长方体在 X/Y/Z 三个方向都重叠时，才真正相交。
    // 方块中心是整数，边长为 1，所以边界等于中心 ± 0.5。
    // 小容差让“刚好接触”不被误认为穿入，避免站在地面上抖动。
    return bounds.min.x < x + 0.5 - EPSILON && bounds.max.x > x - 0.5 + EPSILON
      && bounds.min.y < y + 0.5 - EPSILON && bounds.max.y > y - 0.5 + EPSILON
      && bounds.min.z < z + 0.5 - EPSILON && bounds.max.z > z - 0.5 + EPSILON;
  }

  wouldOverlapPlayer(player, x, y, z) {
    return this.overlapsBlock(this.getPlayerBounds(player), x, y, z);
  }

  getNearbyBlocks(bounds) {
    const blocks = [];
    // 只检查玩家附近的网格。中心坐标制需要先加 0.5 再向下取整，负坐标也适用。
    for (let x = Math.floor(bounds.min.x + 0.5); x <= Math.floor(bounds.max.x + 0.5); x++) {
      for (let y = Math.floor(bounds.min.y + 0.5); y <= Math.floor(bounds.max.y + 0.5); y++) {
        for (let z = Math.floor(bounds.min.z + 0.5); z <= Math.floor(bounds.max.z + 0.5); z++) {
          const block = this.world.getBlock(x, y, z);
          if (block) blocks.push(block);
        }
      }
    }
    return blocks;
  }

  moveAxis(player, axis, amount) {
    if (amount === 0) return false;
    player.position[axis] += amount;
    let blocked = false;
    const nearby = this.getNearbyBlocks(this.getPlayerBounds(player));
    for (const block of nearby) {
      const { x, y, z } = block.position;
      if (!this.overlapsBlock(this.getPlayerBounds(player), x, y, z)) continue;
      // 按移动方向，将身体推回障碍物表面；脚底位置和身体中心的 Y 含义不同。
      if (axis === 'y') {
        player.position.y = amount > 0 ? y - 0.5 - player.height : y + 0.5;
      } else {
        const halfWidth = player.width / 2;
        player.position[axis] = block.position[axis] + (amount > 0 ? -0.5 - halfWidth : 0.5 + halfWidth);
      }
      blocked = true;
    }
    return blocked;
  }

  move(player, displacement) {
    // 每次最多移动 0.2 单位，避免卡顿或快速下落时一步跨过整个方块。
    const maxDistance = Math.max(Math.abs(displacement.x), Math.abs(displacement.y), Math.abs(displacement.z));
    const steps = Math.max(1, Math.ceil(maxDistance / 0.2));
    const result = { onGround: false, blockedY: false };
    for (let step = 0; step < steps; step++) {
      // 分轴移动：X 被墙挡住时，Z 仍可以移动，因此能沿着墙滑行。
      this.moveAxis(player, 'x', displacement.x / steps);
      this.moveAxis(player, 'z', displacement.z / steps);
      if (this.moveAxis(player, 'y', displacement.y / steps)) {
        result.blockedY = true;
        if (displacement.y < 0) result.onGround = true;
      }
    }
    return result;
  }
}
