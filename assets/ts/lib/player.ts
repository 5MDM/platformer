import { Texture } from "pixi.js";
import { PWD } from "./pw-objects";
import { wc } from "../game/main";
import { PW } from "./physics";

export class Player extends PWD {
    halfWS: number;
    halfHS: number;
    isPlayer = true;

    constructor(w: number, h: number) {
        const halfWS = Math.floor(innerWidth/2 - w/2);
        const halfHS = Math.floor(innerHeight/2 - h/2);
        super(halfWS, halfHS, w, h);

        this.halfWS = halfWS;
        this.halfHS = halfHS;
        this.container.x = this.halfWS;
        this.container.y = this.halfHS;

        PW.OnResizeChange((x, y) => {
            this.container.x += x;
            this.container.y += y;
            this.halfWS += x;
            this.halfHS += y;
        });
    }

    addX(x: number): void {
        wc.x -= x;
        this.x += x;
        this.maxX += x;
        this.cx += x;
    }

    setX(x: number) {
        this.x = x;
        this.maxX = x + this.w;
        this.cx = x + this.halfW;
        wc.x = this.halfWS - x;
    }

    teleport(x: number, y: number) {
        this.setX(x);
        this.setY(y);
    }

    addY(y: number) {
        wc.y -= y;
        this.y += y;
        this.maxY += y;
        this.cy += y;
    }

    setY(y: number): void {
        this.y = y;
        this.maxY = y + this.h;
        this.cy = y + this.halfH;
        wc.y = this.halfHS - y;
    }

    updateSprite(): void {}
}

