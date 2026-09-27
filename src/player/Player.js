import * as THREE from 'three';

export class Player {
  constructor(camera) {
    this.camera = camera;
    // position 表示脚底中心，不是摄像机位置。
    this.position = new THREE.Vector3(0, 0.501, 5);
    this.width = 0.6;
    this.height = 1.8;
    this.eyeHeight = 1.62;
    this.speed = 4.5;
    this.gravity = 22;
    this.jumpSpeed = 7.5;
    this.verticalSpeed = 0;
    this.onGround = false;
    this.yaw = 0;
    this.pitch = -0.35;
    this.sensitivity = 0.002;
    this.direction = new THREE.Vector3();
    this.displacement = new THREE.Vector3();
    camera.fov = 75;
    camera.updateProjectionMatrix();
    this.updateCamera();
  }

  updateLook(input) {
    const mouse = input.consumeMouse();
    // 鼠标像素数乘灵敏度得到弧度。yaw 控制左右，pitch 控制上下。
    this.yaw -= mouse.x * this.sensitivity;
    this.pitch -= mouse.y * this.sensitivity;
    // π/2 就是 90 度，限制上下转动以免视角翻转。
    const limit = Math.PI / 2 - 0.01;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -limit, limit);
  }

  getMoveDirection(input) {
    const forward = Number(input.isDown('KeyW')) - Number(input.isDown('KeyS'));
    const right = Number(input.isDown('KeyD')) - Number(input.isDown('KeyA'));
    // yaw=0 时前方是 -Z，右方是 +X；正弦与余弦把它们旋转到当前视线方向。
    this.direction.set(
      -Math.sin(this.yaw) * forward + Math.cos(this.yaw) * right, 0,
      -Math.cos(this.yaw) * forward - Math.sin(this.yaw) * right,
    );
    // 同按 W+D 的向量长度为 √2。归一化后，斜着走不会更快。
    if (this.direction.lengthSq() > 0) this.direction.normalize();
    return this.direction;
  }

  update(deltaTime, input, collision, world) {
    this.updateLook(input);
    if (input.consumeJump() && this.onGround) this.verticalSpeed = this.jumpSpeed;
    // 加速度改变速度，速度乘时间得到位移。Y 向上，因此重力要减去。
    this.verticalSpeed = Math.max(this.verticalSpeed - this.gravity * deltaTime, -35);
    this.displacement.copy(this.getMoveDirection(input)).multiplyScalar(this.speed * deltaTime);
    this.displacement.y = this.verticalSpeed * deltaTime;
    const result = collision.move(this, this.displacement);
    this.onGround = result.onGround;
    if (result.blockedY) this.verticalSpeed = 0;
    if (this.position.y < -20) this.respawn(world);
    this.updateCamera();
  }

  respawn(world) {
    const x = 0;
    const z = 5;
    let floorY = world.getHighestY(x, z);
    // 出生点被挖空时补回一块草地；如果被堆高，出生在最高方块上方。
    if (!Number.isFinite(floorY)) {
      world.addBlock(x, 0, z);
      floorY = 0;
    }
    this.position.set(x, floorY + 0.501, z);
    this.verticalSpeed = 0;
    this.onGround = false;
    this.yaw = 0;
    this.pitch = -0.35;
    this.updateCamera();
  }

  updateCamera() {
    this.camera.position.copy(this.position);
    this.camera.position.y += this.eyeHeight;
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    // 射线在渲染前使用相机，提前更新世界矩阵，避免目标落后一帧。
    this.camera.updateMatrixWorld();
  }
}
