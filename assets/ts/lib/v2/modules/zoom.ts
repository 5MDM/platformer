import { round } from "../../misc/util";
import { Player } from "../entities/player";
import { MD2module } from "./main";

export class MD2zoomModule extends MD2module {
    lastZoomLevel: number = 1;
    zoomLevel: number = this.getZoomOfScreen();
    zoomOffsetX: number = 0;
    zoomOffsetY: number = 0;
    lastW = innerWidth;
    lastH = innerHeight;

    getZoomOfScreen(): number {
        return Math.min(1.5, round(innerWidth / 500, 5));
    }

    async init() {
        this.setZoom();

        addEventListener("resize", () => {
            if(this.zoomLevel != 1)
                this.md2.levelManager.container.x += this.zoomOffsetX / this.zoomLevel;

            this.zoomLevel = this.getZoomOfScreen();
            this.setZoom();

            const player = this.md2.generator.player;
            player.respondToResize();
        });
    }

    fixToZoom(x: number, y: number): [number, number] {
        return [
            (x + this.zoomOffsetX) / this.zoomLevel,
            (y + this.zoomOffsetY) / this.zoomLevel,
        ];
    }

    setZoom(n: number = this.zoomLevel) {
        const co = this.md2.levelManager.container;
        const diff = this.lastZoomLevel - this.zoomLevel;

        const nx = (innerWidth / 2) * diff;
        const ny = (innerHeight / 2) * diff;

        co.x += nx + diff * this.md2.generator.player.halfW;
        co.scale.x = n;

        this.zoomOffsetX = -co.x;

        co.y += ny + diff * this.md2.generator.player.halfH;
        co.scale.y = n;

        this.zoomOffsetY = -co.y;

        this.lastZoomLevel = n;
    }

    zoomOut(p: number) {
        if(p <= 0) return;
        this.zoomLevel *= p / 100;
        this.setZoom();
    }

    zoomIn(p: number) {
        if(p <= 0) return;
        this.zoomLevel /= p / 100;
        this.setZoom();
    }
}