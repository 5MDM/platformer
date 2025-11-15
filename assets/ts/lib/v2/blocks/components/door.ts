import { Sprite, Texture } from "pixi.js";
import { _MD2engine } from "../../engine";
import { ContinueCollisionResolution, MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";
import { MD2item } from "../../items/item";

interface DoorOpts {
    sound?: string;
    onOpen: string;
}

export class MD2doorComponent extends MD2componentModule {
    hasCollided = false;
    opts: DoorOpts;
    closedTexture = this.manager.block.sprite.texture;
    openTexture: Texture;

    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as DoorOpts;
        this.openTexture = MD2componentManager.md2.dataManager.getTexture(this.opts.onOpen);

        this.manager.enableCollisionLeave();
    }

    onCollide(md2: _MD2engine): ContinueCollisionResolution {
        if(this.hasCollided) return false;
        this.hasCollided = true;
        this.manager.block.sprite.texture = this.openTexture;
        //md2.audio.playAudio(this.opts.sound);

        return false;
    }

    onCollisionLeave() {
        this.manager.block.sprite.texture = this.closedTexture;
        //md2.audio.playAudio(this.opts.sound);
        this.hasCollided = false;
    }
}

