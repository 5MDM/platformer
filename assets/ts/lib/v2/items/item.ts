import { Sprite, Texture } from "pixi.js";

interface MD2itemOpts {
    name: string;
    texture: Texture;
    amount?: number;
}

export class MD2item {
    name: string;
    texture: Texture;

    amount = 1;

    constructor(o: MD2itemOpts) {
        this.name = o.name;
        if(o.amount) this.amount = o.amount;
        this.texture = o.texture;
    }
}