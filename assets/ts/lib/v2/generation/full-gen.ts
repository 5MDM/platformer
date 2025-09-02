import { Sprite, Texture } from "pixi.js";
import { _MD2Blockgenerator } from "./generator";

export class _MD2fullGen extends _MD2Blockgenerator {
    createEntitySprite(name: string): Sprite {
        const s = new Sprite({
            texture: this.engine.dataManager.getTexture(name),
        });

        return s;
    }
}