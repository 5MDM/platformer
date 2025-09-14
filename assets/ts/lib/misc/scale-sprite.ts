import { Texture, TilingSprite } from "pixi.js";
import { _MD2engine } from "../v2/engine";
import { XYWH } from "../v2/types";

export class MDscalableSprite {
    sprite: TilingSprite = new TilingSprite({
        texture: Texture.EMPTY,
        x: 0,
        y: 0,
    });

    engine: _MD2engine;

    constructor(engine: _MD2engine) {
        this.engine = engine;
    }

    setTextureByName(name: string) {
        const t = this.engine.dataManager.getTexture(name);

        this.sprite.texture = t;
        this.sprite.anchor.set(t.width / 2, t.height / 2);
    }

    private hasOffsettedX = false;

    private offsetX() {
        if(this.hasOffsettedX) return;
        this.sprite.x += this.engine.blockSize;
        this.hasOffsettedX = true;
    }

    private unOffsetX() {
        if(!this.hasOffsettedX) return;
        this.sprite.x -= this.engine.blockSize;
        this.hasOffsettedX = false;
    }

    private hasOffsettedY = false;

    private offsetY() {
        if(this.hasOffsettedY) return;
        this.sprite.y += this.engine.blockSize;
        this.hasOffsettedY = true;
    }

    private unOffsetY() {
        if(!this.hasOffsettedY) return;
        this.sprite.y -= this.engine.blockSize;
        this.hasOffsettedY = false;
    }

    setPos(x: number, y: number) {
        this.sprite.position.set(this.engine.mulByBlockSize(x), this.engine.mulByBlockSize(y));
        this.hasOffsettedX = false;
        this.hasOffsettedY = false;
    }

    setSize(w: number, h: number) {
        if(w >= 0) {
            w += 1;
            this.unOffsetX();
        }

        if(h >= 0) {
            h += 1;
            this.unOffsetY();
        }

        if(w < 0) w -= 1; 
        if(h < 0) h -= 1; 

        if(h < 0) this.offsetY();
        if(w < 0) this.offsetX();

        this.sprite.width = w * this.engine.blockSize;
        this.sprite.height = h * this.engine.blockSize;
    }

    getSize(): [number, number, number, number] {
        var {x, y, width, height} = this.sprite;

        if(width < 0) {
            x += width;
            width *= - 1;
        }

        if(height < 0) {
            y += height;
            height *= -1;
        }

        const size: [number, number, number, number] = [
            this.engine.divideByBlockSize(x),
            this.engine.divideByBlockSize(y),
            this.engine.divideByBlockSize(width),
            this.engine.divideByBlockSize(height),
        ];

        return size;
    }
}