import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";
const mapTheme: ThreeMapTheme= {
  config: {
    autoScale: true,
      disableRotate: false,
        disableZoom: false,
          autoScaleFactor: 1,
            scale: 100,
              depth: 53
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
    show: false,
      color: [
        "#020B1F",
        "#00D2FF"
      ]
  },
  wall: {
    show: false,
      height: 40,
        color: "#4DEBFF"
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
        mode: "range",
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
              min: 0,
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
      topColor: "rgba(12, 44, 172, 1)",
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
    color: "#ff7ab4"
  },
  outLineStyle: {
    show: true,
      color: "rgba(46, 205, 35, 1)"
  },
  label: {
    show: false,
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
        tintColor: "#ffffff",
          tintStrength: 0,
            normalMap: true,
              edgeGlow: true,
                reliefStrength: 0.85,
                  glowLevel: 1,
                    centerDark: 0.34,
                      mapTex: null
  },
  side: {
    bottomColor: "#520a48",
      topColor: "#148554",
        stripeColor: "#d8f0ff",
          stripeScale: 3.2,
            stripeStrength: 0.82,
              tintColor: "#ffffff",
                tintStrength: 0
  },
  scene: {
    groundRing: true,
      beams: true,
        cones: true,
          trail: true,
            trailSpeed: 10,
              trailLength: 0.3,
                trailBrightness: 1,
                  intro: true
  },
  seriesName: "map",
    series: [
      {
        type: "cylinder",
        seriesName: "cylinder-1",
        mode: "tower",
        towerColor: "#FFF",
        color: [
          "#003e62",
          "#00E6E6"
        ],
        size: 25,
        maxHeight: 100,
        minHeight: 10,
        separate: 100,
        offset: [
          0,
          0
        ],
        label: {
          show: true,
          name: "{b}",
          isFormatter: false,
          formatter: null,
          formatterHtml: "",
          className: "",
          offset: [
            0,
            1
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
        data: []
      }
    ]
}

export default mapTheme;
