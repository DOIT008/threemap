import { MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three';

/**
 * 地面镜面材质（取自 demo 的 ReflectorMaterial）。
 *
 * 做法：先用一面「虚拟相机」把场景渲染到离屏纹理，再把这个纹理按屏幕投影贴回地面平面。
 * 支持按深度做模糊（远处更糊），地面反射才不会糊成一整块。
 */
export interface ReflectionUniforms {
  tDepth: { value: any };
  distortionMap: { value: any };
  tDiffuse: { value: any };
  tDiffuseBlur: { value: any };
  textureMatrix: { value: any };
  hasBlur: { value: boolean };
  mirror: { value: number };
  mixBlur: { value: number };
  mixStrength: { value: number };
  minDepthThreshold: { value: number };
  maxDepthThreshold: { value: number };
  depthScale: { value: number };
  depthToBlurRatioBias: { value: number };
  distortion: { value: number };
  mixContrast: { value: number };
  /** 倒影浓度：1 = 最实，0 = 完全隐藏（不透明模式的底板不受影响） */
  reflectionOpacity: { value: number };
}

export class ReflectorMaterial extends MeshStandardMaterial {
  reflection: ReflectionUniforms;

  constructor(parameters = {}) {
    super(parameters);
    this.reflection = {
      tDepth: { value: null },
      distortionMap: { value: null },
      tDiffuse: { value: null },
      tDiffuseBlur: { value: null },
      textureMatrix: { value: null },
      hasBlur: { value: false },
      mirror: { value: 0 },
      mixBlur: { value: 0 },
      mixStrength: { value: 1 },
      minDepthThreshold: { value: 0.9 },
      maxDepthThreshold: { value: 1 },
      depthScale: { value: 0 },
      depthToBlurRatioBias: { value: 0.25 },
      distortion: { value: 1 },
      mixContrast: { value: 1 },
      reflectionOpacity: { value: 1 },
    };
  }

  onBeforeCompile(shader: WebGLProgramParametersWithUniforms): void {
    if (!shader.defines?.USE_UV) {
      shader.defines!.USE_UV = '';
    }
    const u = this.reflection;
    shader.uniforms.hasBlur = u.hasBlur;
    shader.uniforms.tDiffuse = u.tDiffuse;
    shader.uniforms.tDepth = u.tDepth;
    shader.uniforms.distortionMap = u.distortionMap;
    shader.uniforms.tDiffuseBlur = u.tDiffuseBlur;
    shader.uniforms.textureMatrix = u.textureMatrix;
    shader.uniforms.mirror = u.mirror;
    shader.uniforms.mixBlur = u.mixBlur;
    shader.uniforms.mixStrength = u.mixStrength;
    shader.uniforms.minDepthThreshold = u.minDepthThreshold;
    shader.uniforms.maxDepthThreshold = u.maxDepthThreshold;
    shader.uniforms.depthScale = u.depthScale;
    shader.uniforms.depthToBlurRatioBias = u.depthToBlurRatioBias;
    shader.uniforms.distortion = u.distortion;
    shader.uniforms.mixContrast = u.mixContrast;
    shader.uniforms.reflectionOpacity = u.reflectionOpacity;

    shader.vertexShader = `
      uniform mat4 textureMatrix;
      varying vec4 my_vUv;
    ${shader.vertexShader}`;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      my_vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`,
    );

    shader.fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDiffuseBlur;
      uniform sampler2D tDepth;
      uniform sampler2D distortionMap;
      uniform float distortion;
      uniform bool hasBlur;
      uniform float mixBlur;
      uniform float mirror;
      uniform float mixStrength;
      uniform float minDepthThreshold;
      uniform float maxDepthThreshold;
      uniform float mixContrast;
      uniform float depthScale;
      uniform float depthToBlurRatioBias;
      uniform float reflectionOpacity;
      varying vec4 my_vUv;
    ${shader.fragmentShader}`;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>

      float distortionFactor = 0.0;
      #ifdef USE_DISTORTION
        distortionFactor = texture2D(distortionMap, vUv).r * distortion;
      #endif

      vec4 new_vUv = my_vUv;
      new_vUv.x += distortionFactor;
      new_vUv.y += distortionFactor;

      vec4 base = texture2DProj(tDiffuse, new_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);

      vec4 merge = base;

      #ifdef USE_NORMALMAP
        vec2 normal_uv = vec2(0.0);
        vec4 normalColor = texture2D(normalMap, vUv * normalScale);
        vec3 my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b, normalColor.g * 2.0 - 1.0 ) );
        vec3 coord = new_vUv.xyz / new_vUv.w;
        normal_uv = coord.xy + coord.z * my_normal.xz * 0.05;
        vec4 base_normal = texture2D(tDiffuse, normal_uv);
        vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);
        merge = base_normal;
        blur = blur_normal;
      #endif

      float depthFactor = 0.0001;
      float blurFactor = 0.0;

      #ifdef USE_DEPTH
        vec4 depth = texture2DProj(tDepth, new_vUv);
        depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0 - (depth.r * depth.a));
        depthFactor *= depthScale;
        depthFactor = max(0.0001, min(1.0, depthFactor));

        #ifdef USE_BLUR
          blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
          merge = merge * min(1.0, depthFactor + 0.5);
        #else
          merge = merge * depthFactor;
        #endif
      #endif

      float reflectorRoughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif

      #ifdef USE_BLUR
        blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
        merge = mix(merge, blur, blurFactor);
      #endif

      vec4 newMerge = vec4(0.0, 0.0, 0.0, 1.0);
      newMerge.r = (merge.r - 0.5) * mixContrast + 0.5;
      newMerge.g = (merge.g - 0.5) * mixContrast + 0.5;
      newMerge.b = (merge.b - 0.5) * mixContrast + 0.5;

      diffuseColor.rgb =
        diffuseColor.rgb * (1.0 - min(1.0, mirror)) +
        diffuseColor.rgb * newMerge.rgb * mixStrength * reflectionOpacity;

      #ifdef USE_ALPHA_BY_REFLECTION
        // 反射纹理是渲进 RT 的，而 RT 的 outputColorSpace 是 LinearSRGB（只有画布才走 sRGB）；
        // 地图用的又是原生 ShaderMaterial，写进去的就是设计色值本身（相当于 sRGB 编码）。
        // 所以这里先解码回线性，再由 colorspace_fragment 重新编码：
        // 倒影的颜色才能和真实侧墙逐像素对上，不会整体发白。
        vec3 reflectColor = sRGBTransferEOTF(vec4(merge.rgb, 1.0)).rgb;

        // 虚拟相机视锥之外没有真实像素，texture2DProj 会沿边缘 clamp，
        // 不掐掉就会沿视锥边界拖出一整片直边灰雾（看着像另外贴了一块板）
        vec2 projUv = new_vUv.xy / max(new_vUv.w, 0.0001);
        float inView = smoothstep(
          0.0,
          0.05,
          min(min(projUv.x, 1.0 - projUv.x), min(projUv.y, 1.0 - projUv.y))
        );
        // 平面边缘再径向淡出：倒影往外自然溶解，不和背景留一条硬边
        float edgeFade = 1.0 - smoothstep(0.30, 0.50, length(vUv - 0.5));
        // 倒影的 alpha 直接取反射纹理的 alpha：那里存的就是「这块像素上几何体自己的透明度」。
        // 侧墙调多透，倒影就跟着多透，两边才像同一面镜子里的同一堵墙。
        // 之前按亮度猜，深色倒影像素会被判成半透明，所以 opacity = 1 也“能穿透”。
        float coverage = smoothstep(0.02, 0.35, merge.a);
        diffuseColor.a = inView * edgeFade * reflectionOpacity * coverage;
      #endif
      `,
    );

    // 透明模式下的倒影不再吃光照：底板色（#010a1c）乘上场景两盏强光只会得到一块
    // 发灰的「地板」，既不通透，也和贴着光的本体对不上。直接输出反射颜色。
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#ifdef USE_ALPHA_BY_REFLECTION
        outgoingLight = reflectColor * mixStrength;
      #endif
      #include <opaque_fragment>`,
    );
  }
}
