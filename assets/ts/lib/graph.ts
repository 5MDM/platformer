import { Application, Container, Graphics } from "pixi.js";

export class Graph {
    x: number;
    y: number;
    w: number;
    h: number;
    xs: number;
    c: Container;
    cx: number;
    g = new Graphics({
        roundPixels: true,
    });

    constructor(x: number, y: number, w: number, h: number, xs: number, c: Container) {
        this.x = x - w/2;
        this.cx = this.x;
        this.y = y + h;
        this.w = w;
        this.h = h;
        this.xs = xs;
        this.c = c;
        this.g.moveTo(this.cx, this.y);
        this.c.addChild(this.g);
    }

    plot(y: number) {
        y = this.y - y;
        this.cx += this.xs;
        if(this.cx > this.x + this.w) {
            this.g.clear();
            this.cx = this.x;
            this.g.moveTo(this.cx, y);
        }

        this.g.lineTo(this.cx, y);
        this.g.moveTo(this.cx, y);
        this.g.stroke({color: 0xfff000});
    }
}