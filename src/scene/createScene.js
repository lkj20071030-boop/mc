import * as THREE from 'three';

// 本文件只负责基础三维环境：场景、相机、渲染器、灯光和窗口适配。
export function createScene(canvas) {
  // Scene 是三维对象的容器；加入场景的对象才有机会被渲染出来。
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d5e7ee');

  // PerspectiveCamera 是透视相机，物体近大远小。
  // 参数依次是：垂直视野角度、宽高比、最近可见距离、最远可见距离。
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(3, 2.2, 4);
  camera.lookAt(0, 0, 0);

  // WebGLRenderer 把三维场景画到 canvas；antialias 用于减轻边缘锯齿。
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

  // HemisphereLight 用天空色和地面色给物体补光，避免背光面全黑。
  const skyLight = new THREE.HemisphereLight(0xffffff, 0x708060, 2);
  scene.add(skyLight);

  // DirectionalLight 模拟远处的平行光，让不同朝向的面出现明暗差异。
  const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunlight.position.set(4, 7, 5);
  scene.add(sunlight);

  function resize() {
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);

    // 宽高比 = 宽 ÷ 高。相机和画布比例一致，立方体才不会被拉伸。
    camera.aspect = width / height;
    // 修改相机参数后，要重新计算投影矩阵，使新比例生效。
    camera.updateProjectionMatrix();

    // 高分屏用更多像素绘图；最多取 2，控制显卡负担。
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    // false 表示不改 CSS 尺寸，显示大小仍由 style.css 控制。
    renderer.setSize(width, height, false);
  }

  resize();
  window.addEventListener('resize', resize);

  function dispose() {
    window.removeEventListener('resize', resize);
    renderer.setAnimationLoop(null);
    renderer.dispose();
  }

  return { scene, camera, renderer, dispose };
}
