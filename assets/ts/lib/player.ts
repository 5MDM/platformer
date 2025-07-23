import { Container } from "pixi.js";
import { PWD } from "./physics/objects";
import { PW } from "./physics/physics";

export class Player extends PWD {
    halfWS: number;
    halfHS: number;
    isPlayer = true;
    wc: Container;

    constructor(wc: Container, w: number, h: number) {
        const halfWS = Math.floor(innerWidth/2 - w/2);
        const halfHS = Math.floor(innerHeight/2 - h/2);
        super(halfWS, halfHS, w, h);

        this.wc = wc;

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
        //this.wc.x -= x;
        this.x += x;
        this.maxX += x;
        this.cx += x;
    }

    setX(x: number) {
        this.x = x;
        this.maxX = x + this.w;
        this.cx = x + this.halfW;
        //this.wc.x = this.halfWS - x;
    }

    teleport(x: number, y: number) {
        this.setX(x);
        this.setY(y);

        this.updateSprite();
    }

    tweenMatches(): boolean {
        if(Math.round(this.halfHS - this.y) == Math.round(this.wc.y)
        && Math.round(this.halfWS - this.x) == Math.round(this.wc.x)) return true;

        return false;
    }

    addY(y: number) {
        this.y += y;
        this.maxY += y;
        this.cy += y;
    }

    setY(y: number): void {
        this.y = y;
        this.maxY = y + this.h;
        this.cy = y + this.halfH;
    }

    updateSprite(): void {
        this.wc.x = this.halfWS - this.x;
        this.wc.y = this.halfHS - this.y;
    } 

    setSpriteX(n: number) {
        this.wc.x = this.halfWS - n;
    }

    setSpriteY(n: number) {
        this.wc.y = this.halfHS - n;
    }

    protected lerpX(x: number): void {
        this.wc.x -= x;
    }

    protected lerpY(y: number): void {
        //const val = time * (this.halfHS - this.y + y - this.wc.y);
        this.wc.y -= y;
    }
}

