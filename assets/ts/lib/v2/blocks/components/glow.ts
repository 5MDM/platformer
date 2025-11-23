import { Particle, Sprite, Texture } from "pixi.js";
import { MD2componentModule } from "../../../misc/components";
import { FgBlock } from "../blocks";
import { BlockComponentManager } from "./main-manager";

interface MD2glowComponentOpts {
    texture: {
        type: "particle" | "texture";
        name: string;
    };
    scale?: number;
}

export class MD2glowComponent extends MD2componentModule<FgBlock> {
    opts: MD2glowComponentOpts;
    glowSprite: Sprite;
    
    constructor(manager: BlockComponentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2glowComponentOpts;
        this.opts.scale ??= 1;

        const t: Texture = (this.opts.texture.type == "particle") ? 
        BlockComponentManager.md2.modules.env.getParticle(this.opts.texture.name)
        : BlockComponentManager.md2.dataManager.getTexture(this.opts.texture.name);

        const {x, y, w, h, sprite} = this.manager.target;

        const width = w * this.opts.scale;
        const height = h * this.opts.scale;

        this.glowSprite = new Sprite({
            texture: t,
            width,
            height,
            position: {
                x: x + sprite.width,
                y: y + sprite.height / 2,
            },
            anchor: .5,
            zIndex: -1,
            alpha: 0.8,
        });
        
        this.manager.target.container.addChild(this.glowSprite);
        
        //this.manager.block.container.mask = this.glowSprite;
    }

}