import { Sprite, Texture } from "pixi.js";
import { _MD2engine } from "../../engine";
import { CMM, ContinueCollisionResolution, MD2componentModule } from "../../../misc/components";
import { MD2item } from "../../items/item";
import { FgBlock } from "../blocks";
import { BlockComponentManager } from "./main-manager";

interface DoorOpts {
    sound?: string;
    onOpen: string;
}

export class MD2doorComponent extends MD2componentModule<FgBlock> {
    hasCollided = false;
    opts: DoorOpts;
    closedTexture: Texture;
    openTexture: Texture;
    manager: BlockComponentManager;

    constructor(manager: BlockComponentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.manager = manager;

        this.opts = opts as DoorOpts;
        this.openTexture = BlockComponentManager.md2.dataManager.getTexture(this.opts.onOpen);
        this.closedTexture = this.manager.target.sprite.texture;

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

