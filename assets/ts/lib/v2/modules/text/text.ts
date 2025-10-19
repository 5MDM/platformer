import { Ticker } from "pixi.js";
import { $, clamp, round } from "../../../misc/util";
import { MD2module } from "../main";
import { createMD2t, MD2t, parseMD2t } from "./md2t-parser";

const textC = $("#ui > #md2-text");
const titleC = $("#ui > #md2-text > #title");

export class MD2textModule extends MD2module {
    init(): Promise<void> {
        this.showTitle(createMD2t([
            "The Start"
        ]), 3000);

        return new Promise(f => f());
    }

    showTitle(t: MD2t, duration: number) {
        const p = parseMD2t(t);
        p.style.opacity = "0";
        titleC.appendChild(p);

        const start = performance.now();
        Ticker.shared.add(fadeIn);

        setTimeout(() => {
            Ticker.shared.remove(fadeIn);
            Ticker.shared.add(fadeOut);

            setTimeout(() => {
                Ticker.shared.remove(fadeOut);
                titleC.removeChild(p);
                p.textContent = "";
            }, duration);
        }, duration);

        function fadeIn() {
            const opacity = ((performance.now() - start) / (duration || 1));
            p.style.opacity = round(clamp(0, opacity, 1), 100).toString();
        }

        const end = performance.now() + duration * 2;
        function fadeOut() {
            const opacity = ((end - performance.now()) / (duration || 1));
            p.style.opacity = round(clamp(0, opacity, 1), 100).toString();
        }
    }
}