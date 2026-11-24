import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

/**
 * 由控制面板导出的地图主题。
 * 用法：<ThreeMap :option="mapTheme" :panel="false" />
 */
const mapTheme: ThreeMapTheme = {
  config: {
    autoScale: true,
    disableRotate: false,
    disableZoom: false,
    autoScaleFactor: 1,
    scale: 100,
    depth: 36
  },
  background: {
    show: false,
    color: "#041533"
  },
  autoRotate: {
    autoRotate: false,
    autoRotateSpeed: 2
  },
  camera: {
    x: -0.8,
    y: 10.2,
    z: 5.3
  },
  grid: {
    show: false,
    color: "#2BD9FF",
    opacity: 0.2
  },
  foundation: {
    show: false,
    size: 800,
    speed: 0.5,
    image: "default",
    isRotate: true,
    static: false
  },
  tooltip: {
    show: true,
    content: "",
    styleType: "0",
    isFormatter: false,
    formatterHtml: "",
    itemStyle: {
      backgroundColor: "rgba(8, 20, 45, 0.82)",
      borderColor: "rgba(72, 204, 255, 0.45)",
      borderWidth: 0,
      padding: [
        10,
        10,
        10,
        10
      ],
      color: "#DFF6FF",
      fontSize: 14,
      minWidth: 80,
      width: "max-content",
      borderRadius: 5,
      borderStyle: "solid"
    }
  },
  mirror: {
    show: true,
    color: [
      "#020B1F",
      "#00D2FF"
    ]
  },
  wall: {
    show: false,
    height: 6,
    color: "rgba(77, 178, 255, 1)"
  },
  texture: {
    show: true,
    autoRepeat: false,
    repeat: {
      x: 0.0927,
      y: 0.124
    },
    offset: {
      x: 0.5918,
      y: 0.324
    },
    image: "default"
  },
  map: "410100",
  mapName: "郑州",
  glow: {
    show: false,
    threshold: 0,
    strength: 1,
    radius: 0
  },
  itemStyle: {
    range: {
      show: false,
      mode: "separate",
      rules: [
        {
          value: 0,
          color: "#27F4FF",
          label: ">=0"
        }
      ],
      color: [
        "#18D7FF",
        "#2665FF"
      ],
      min: 6,
      max: 1000,
      visualMap: {
        show: false,
        left: "2%",
        top: "2%",
        maxText: "高",
        minText: "低",
        textStyle: {
          fontSize: 12,
          color: "#FFF",
          fontStyle: "normal",
          fontWeight: "normal",
          fontFamily: "Microsoft Yahei",
          textDecoration: "",
          textShadow: ""
        }
      }
    },
    topColor: "rgba(42, 233, 255, 0.95)",
    sideColor: "rgba(59, 132, 255, 0.92)",
    uColor: "rgba(19, 48, 128, 1)"
  },
  emphasis: {
    show: true,
    topColor: "rgba(0, 179, 255, 1)",
    textStyle: {
      fontSize: 15,
      color: "#FFFFFF",
      fontStyle: "normal",
      fontWeight: "bold",
      fontFamily: "Microsoft Yahei",
      textDecoration: "",
      textShadow: "0 0 8px rgba(150, 220, 255, 1), 0 0 18px rgba(80, 170, 255, 0.85)"
    }
  },
  lineStyle: {
    color: "#85c4ff"
  },
  outLineStyle: {
    show: true,
    color: "rgba(165, 240, 254, 1)"
  },
  label: {
    show: true,
    name: "{b}",
    isFormatter: false,
    formatter: null,
    formatterHtml: "",
    className: "",
    offset: [
      0,
      0
    ],
    itemStyle: {
      padding: [
        0,
        0,
        0,
        0
      ],
      backgroundColor: "rgba(50,50,50,0)",
      borderRadius: 5,
      borderColor: "rgba(255,255,255,0)",
      borderWidth: 0,
      textStyle: {
        fontSize: 13,
        color: "#d7ebff",
        fontStyle: "normal",
        fontWeight: "normal",
        fontFamily: "Microsoft Yahei",
        textDecoration: "",
        textShadow: "0 0 6px rgba(120, 190, 255, 0.9), 0 0 14px rgba(60, 130, 230, 0.6)",
        letterSpacing: "1px"
      }
    }
  },
  surface: {
    mapMode: "image",
    mapColor: "#0d2340",
    tintColor: "#0040ff",
    tintStrength: 0.5,
    normalMap: true,
    edgeGlow: true,
    reliefStrength: 0.35,
    glowLevel: 0.9,
    centerDark: 0.56,
    mapTex: null
  },
  side: {
    bottomColor: "#1a47ff",
    topColor: "#3898ff",
    stripeColor: "#57cdff",
    stripeScale: 4.8,
    stripeStrength: 0.82,
    tintColor: "#70e7ff",
    tintStrength: 0
  },
  scene: {
    groundRing: true,
    beams: true,
    cones: false,
    trail: true,
    trailSpeed: 10,
    trailLength: 0.98,
    trailBrightness: 2.6,
    intro: true
  },
  seriesName: "map",
  series: []
};

export default mapTheme;
