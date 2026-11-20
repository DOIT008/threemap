import {
  DepthFormat,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  PerspectiveCamera,
  Plane,
  UnsignedShortType,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Mesh,
  type Object3D,
  type PlaneGeometry,
  type Scene,
  type WebGLRenderer,
} from 'three';
import * as THREE from 'three';

import { BlurPass } from './mirror/BlurPass';
import { ReflectorMaterial } from './mirror/ReflectorMaterial';

// 参数与 demo 保持一致
const BLUR: [number, number] = [400, 100];
const RESOLUTION = 1024;
const MIX_BLUR = 10;
const MIX_STRENGTH = 1.4;
const MIRROR = 0;
const MIN_DEPTH_THRESHOLD = 0.85;
const MAX_DEPTH_THRESHOLD = 1;
const DEPTH_SCALE = 1;
const DEPTH_TO_BLUR_RATIO_BIAS = 0.25;
const DISTORTION = 1;
const MIX_CONTRAST = 1;
const REFLECTOR_OFFSET = 0;

export interface MirrorHandle {
  mesh: THREE.Mesh;
  /** 每帧在主渲染之前调用：把场景反射到离屏纹理 */
  render: (gl: WebGLRenderer, scene: Scene, camera: PerspectiveCamera) => void;
  dispose: () => void;
}

/**
 * 地面镜面反射（demo 的 Mirror.vue 的 three.js 版本）
 *
 * 做法：把一面镜像虚拟相机看到的场景渲染到 fbo，再按深度做模糊，
 * 最后由 ReflectorMaterial 把结果投回地面平面。
 * 地图本体是半透明的，倒影会「映进去」，这是通透感的重要来源。
 */
export function drawMirror(mapWidth: number, scene: Scene, camera: PerspectiveCamera): MirrorHandle {
  const size = mapWidth * 6.66; // demo 里是 100 / 15（地图世界宽）
  const geometry = new THREE.PlaneGeometry(size, size);
  const mesh = new THREE.Mesh(geometry) as any;
  // 镜面材质是 MeshStandardMaterial 的子类，构造函数里没有 textureMatrix 这个 uniform
  // （它是 onBeforeCompile 里注入的）。开辉光时 ThreeMap 会遍历场景把非发光材质
  // 换成同构造函数的纯黑实例来单独渲染 bloom，一旦换到这个材质，
  // textureMatrix 就是 null，渲染时 setValueM4 直接抛错、整个画面卡死。
  // 打上标记让 bloom 路径跳过它。
  mesh._skipBloomDarken = true;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -mapWidth * 0.00133; // demo: -0.02 / 15

  const hasBlur = BLUR[0] + BLUR[1] > 0;
  const targetParams = { minFilter: LinearFilter, magFilter: LinearFilter, type: HalfFloatType };
  const fbo1 = new WebGLRenderTarget(RESOLUTION, RESOLUTION, targetParams);
  fbo1.depthBuffer = true;
  fbo1.depthTexture = new DepthTexture(RESOLUTION, RESOLUTION);
  fbo1.depthTexture.format = DepthFormat;
  fbo1.depthTexture.type = UnsignedShortType;
  const fbo2 = new WebGLRenderTarget(RESOLUTION, RESOLUTION, targetParams);

  const blurPass = new BlurPass({
    resolution: RESOLUTION,
    width: BLUR[0],
    height: BLUR[1],
    minDepthThreshold: MIN_DEPTH_THRESHOLD,
    maxDepthThreshold: MAX_DEPTH_THRESHOLD,
    depthScale: DEPTH_SCALE,
    depthToBlurRatioBias: DEPTH_TO_BLUR_RATIO_BIAS,
  });

  const material = new ReflectorMaterial({ color: '#010a1c', metalness: 0.6, roughness: 1 });
  material.defines = {};
  if (hasBlur) material.defines.USE_BLUR = '';
  if (DEPTH_SCALE > 0) material.defines.USE_DEPTH = '';

  const textureMatrix = new Matrix4();
  const u = material.reflection;
  u.mirror.value = MIRROR;
  u.textureMatrix.value = textureMatrix;
  u.mixBlur.value = MIX_BLUR;
  u.tDiffuse.value = fbo1.texture;
  u.tDepth.value = fbo1.depthTexture;
  u.tDiffuseBlur.value = fbo2.texture;
  u.hasBlur.value = hasBlur;
  u.mixStrength.value = MIX_STRENGTH;
  u.minDepthThreshold.value = MIN_DEPTH_THRESHOLD;
  u.maxDepthThreshold.value = MAX_DEPTH_THRESHOLD;
  u.depthScale.value = DEPTH_SCALE;
  u.depthToBlurRatioBias.value = DEPTH_TO_BLUR_RATIO_BIAS;
  u.distortion.value = DISTORTION;
  u.mixContrast.value = MIX_CONTRAST;

  mesh.material = material;

  const reflectorPlane = new Plane();
  const normal = new Vector3();
  const reflectorWorldPosition = new Vector3();
  const cameraWorldPosition = new Vector3();
  const rotationMatrix = new Matrix4();
  const lookAtPosition = new Vector3(0, 0, -1);
  const clipPlane = new Vector4();
  const view = new Vector3();
  const target = new Vector3();
  const q = new Vector4();
  const virtualCamera = new PerspectiveCamera();

  function updateReflector(): void {
    reflectorWorldPosition.setFromMatrixPosition(mesh.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    rotationMatrix.extractRotation(mesh.matrixWorld);
    normal.set(0, 0, 1);
    normal.applyMatrix4(rotationMatrix);
    reflectorWorldPosition.addScaledVector(normal, REFLECTOR_OFFSET);

    view.subVectors(reflectorWorldPosition, cameraWorldPosition);
    if (view.dot(normal) > 0) return;
    view.reflect(normal).negate();
    view.add(reflectorWorldPosition);

    rotationMatrix.extractRotation(camera.matrixWorld);
    lookAtPosition.set(0, 0, -1);
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);

    target.subVectors(reflectorWorldPosition, lookAtPosition);
    target.reflect(normal).negate();
    target.add(reflectorWorldPosition);

    virtualCamera.position.copy(view);
    virtualCamera.up.set(0, 1, 0);
    virtualCamera.up.applyMatrix4(rotationMatrix);
    virtualCamera.up.reflect(normal);
    virtualCamera.lookAt(target);
    virtualCamera.far = camera.far;
    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
    textureMatrix.multiply(virtualCamera.projectionMatrix);
    textureMatrix.multiply(virtualCamera.matrixWorldInverse);
    textureMatrix.multiply(mesh.matrixWorld);

    reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);
    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);

    const projectionMatrix = virtualCamera.projectionMatrix;
    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]!) / projectionMatrix.elements[0]!;
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]!) / projectionMatrix.elements[5]!;
    q.z = -1.0;
    q.w = (1.0 + projectionMatrix.elements[10]!) / projectionMatrix.elements[14]!;

    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z + 1.0;
    projectionMatrix.elements[14] = clipPlane.w;
  }

  const renderReflection = (gl: WebGLRenderer, sceneRef: Scene, _camera: PerspectiveCamera): void => {
    mesh.visible = false;
    const currentXrEnabled = gl.xr.enabled;
    const currentShadowAutoUpdate = gl.shadowMap.autoUpdate;

    updateReflector();

    gl.xr.enabled = false;
    gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(fbo1);
    gl.state.buffers.depth.setMask(true);
    if (!gl.autoClear) gl.clear();
    gl.render(sceneRef, virtualCamera);
    if (hasBlur) blurPass.render(gl, fbo1, fbo2);
    gl.xr.enabled = currentXrEnabled;
    gl.shadowMap.autoUpdate = currentShadowAutoUpdate;

    mesh.visible = true;
    gl.setRenderTarget(null);
  };

  const dispose = (): void => {
    material.dispose();
    geometry.dispose();
    fbo1.dispose();
    fbo2.dispose();
    blurPass.dispose();
  };

  return { mesh, render: renderReflection, dispose };
}

/** 类型占位，避免未使用导入被裁掉时的类型报错 */
export type MirrorMesh = Mesh<PlaneGeometry, ReflectorMaterial> & Object3D;
