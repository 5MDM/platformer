import { Particle, Sprite, Texture } from "pixi.js";
import { MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";

interface MD2glowComponentOpts {
    texture: {
        type: "particle" | "texture";
        name: string;
    };
    scale?: number;
}

export class MD2glowComponent extends MD2componentModule {
    opts: MD2glowComponentOpts;
    glowSprite: Sprite;
    
    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2glowComponentOpts;
        this.opts.scale ??= 1;

        const t: Texture = (this.opts.texture.type == "particle") ? 
        MD2componentManager.md2.modules.env.getParticle(this.opts.texture.name)
        : MD2componentManager.md2.dataManager.getTexture(this.opts.texture.name);

        const {x, y, w, h, sprite} = this.manager.block;

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
        
        this.manager.block.container.addChild(this.glowSprite);
        
        //this.manager.block.container.mask = this.glowSprite;
    }

}