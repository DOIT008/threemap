import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NoBlending,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three';

/**
 * 镜面反射的降采样模糊（取自 demo 的 BlurPass）。
 * 分四次卷积，按深度把模糊权重拉开 —— 越远的地方反射越散。
 */
class ConvolutionMaterial extends ShaderMaterial {
  kernel: Float32Array;

  constructor(texelSize = new Vector2()) {
    super({
      uniforms: {
        inputBuffer: { value: null },
        depthBuffer: { value: null },
        resolution: { value: new Vector2() },
        texelSize: { value: new Vector2() },
        halfTexelSize: { value: new Vector2() },
        kernel: { value: 0.0 },
        scale: { value: 1.0 },
        cameraNear: { value: 0.0 },
        cameraFar: { value: 1.0 },
        minDepthThreshold: { value: 0.0 },
        maxDepthThreshold: { value: 1.0 },
        depthScale: { value: 0.0 },
        depthToBlurRatioBias: { value: 0.25 },
      },
      fragmentShader: `#include <common>
        #include <dithering_pars_fragment>
        uniform sampler2D inputBuffer;
        uniform sampler2D depthBuffer;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec2 vUv;
        varying vec2 vUv0;
        varying vec2 vUv1;
        varying vec2 vUv2;
        varying vec2 vUv3;

        void main() {
          float depthFactor = 0.0;

          #ifdef USE_DEPTH
            vec4 depth = texture2D(depthBuffer, vUv);
            depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
            depthFactor *= depthScale;
            depthFactor = max(0.0, min(1.0, depthFactor + 0.25));
          #endif

          vec4 sum = texture2D(inputBuffer, mix(vUv0, vUv, depthFactor));
          sum += texture2D(inputBuffer, mix(vUv1, vUv, depthFactor));
          sum += texture2D(inputBuffer, mix(vUv2, vUv, depthFactor));
          sum += texture2D(inputBuffer, mix(vUv3, vUv, depthFactor));
          gl_FragColor = sum * 0.25 ;

          #include <dithering_fragment>
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      vertexShader: `uniform vec2 texelSize;
        uniform vec2 halfTexelSize;
        uniform float kernel;
        uniform float scale;
        varying vec2 vUv;
        varying vec2 vUv0;
        varying vec2 vUv1;
        varying vec2 vUv2;
        varying vec2 vUv3;

        void main() {
          vec2 uv = position.xy * 0.5 + 0.5;
          vUv = uv;

          vec2 dUv = (texelSize * vec2(kernel) + halfTexelSize) * scale;
          vUv0 = vec2(uv.x - dUv.x, uv.y + dUv.y);
          vUv1 = vec2(uv.x + dUv.x, uv.y + dUv.y);
          vUv2 = vec2(uv.x + dUv.x, uv.y - dUv.y);
          vUv3 = vec2(uv.x - dUv.x, uv.y - dUv.y);

          gl_Position = vec4(position.xy, 1.0, 1.0);
        }`,
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
    });
    this.toneMapped = false;
    this.setTexelSize(texelSize.x, texelSize.y);
    this.kernel = new Float32Array([0.0, 1.0, 2.0, 2.0, 3.0]);
  }

  setTexelSize(x: number, y: number): void {
    this.uniforms.texelSize!.value.set(x, y);
    this.uniforms.halfTexelSize!.value.set(x, y).multiplyScalar(0.5);
  }

  setResolution(resolution: Vector2): void {
    this.uniforms.resolution!.value.copy(resolution);
  }
}

export interface BlurPassOptions {
  resolution: number;
  width?: number;
  height?: number;
  minDepthThreshold?: number;
  maxDepthThreshold?: number;
  depthScale?: number;
  depthToBlurRatioBias?: number;
}

export class BlurPass {
  renderToScreen = false;
  renderTargetA: WebGLRenderTarget;
  renderTargetB: WebGLRenderTarget;
  convolutionMaterial: ConvolutionMaterial;
  scene: Scene;
  camera: Camera;
  screen: Mesh;

  constructor({
    resolution,
    width = 500,
    height = 500,
    minDepthThreshold = 0,
    maxDepthThreshold = 1,
    depthScale = 0,
    depthToBlurRatioBias = 0.25,
  }: BlurPassOptions) {
    this.renderTargetA = new WebGLRenderTarget(resolution, resolution, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
      type: HalfFloatType,
    });
    this.renderTargetB = this.renderTargetA.clone();
    this.convolutionMaterial = new ConvolutionMaterial();
    this.convolutionMaterial.setTexelSize(1.0 / width, 1.0 / height);
    this.convolutionMaterial.setResolution(new Vector2(width, height));
    this.scene = new Scene();
    this.camera = new Camera();
    this.convolutionMaterial.uniforms.minDepthThreshold!.value = minDepthThreshold;
    this.convolutionMaterial.uniforms.maxDepthThreshold!.value = maxDepthThreshold;
    this.convolutionMaterial.uniforms.depthScale!.value = depthScale;
    this.convolutionMaterial.uniforms.depthToBlurRatioBias!.value = depthToBlurRatioBias;
    this.convolutionMaterial.defines = { USE_DEPTH: depthScale > 0 };

    const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    this.screen = new Mesh(geometry, this.convolutionMaterial);
    this.screen.frustumCulled = false;
    this.scene.add(this.screen);
  }

  render(renderer: any, inputBuffer: WebGLRenderTarget, outputBuffer: WebGLRenderTarget): void {
    const { scene, camera, renderTargetA, renderTargetB, convolutionMaterial } = this;
    const uniforms = convolutionMaterial.uniforms;
    uniforms.depthBuffer!.value = inputBuffer.depthTexture;
    const kernel = convolutionMaterial.kernel;
    let lastRT: WebGLRenderTarget = inputBuffer;
    let destRT: WebGLRenderTarget;
    let i = 0;

    const len = kernel.length - 1;
    for (i = 0; i < len; i++) {
      destRT = (i & 1) === 0 ? renderTargetA : renderTargetB;
      uniforms.kernel!.value = kernel[i];
      uniforms.inputBuffer!.value = lastRT.texture;
      renderer.setRenderTarget(destRT);
      renderer.render(scene, camera);
      lastRT = destRT;
    }
    uniforms.kernel!.value = kernel[i];
    uniforms.inputBuffer!.value = lastRT.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
    renderer.render(scene, camera);
  }

  dispose(): void {
    this.renderTargetA.dispose();
    this.renderTargetB.dispose();
    this.convolutionMaterial.dispose();
    this.screen.geometry.dispose();
  }
}
