import { startGame } from "./game/main";
import { c } from "./canvas";
import { app, md2 } from "./constants";
import { initLevels } from "./game/levels";

// using await breaks production build
// 129fff

app.init({
    background: "#000",
    resizeTo: window,
    antialias: false,
    autoDensity: true,
    height: innerWidth,
    width: innerWidth,
    powerPreference: "high-performance",
    resolution: devicePixelRatio,
    canvas: c,
    roundPixels: true,
}).then(async () => {

    initLevels(md2);

    addEventListener("orientationchange", () => {
        app.renderer.resize(innerWidth, innerHeight, devicePixelRatio);
    });

    await md2.init();

    startGame(md2);
});