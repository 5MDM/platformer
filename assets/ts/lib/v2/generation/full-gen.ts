import { Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2Blockgenerator } from "./generator";
import { _MD2engine } from "../engine";
import { Entity, EntityOpts, MovingDynamicObj, MovingDynamicObjOpts } from "../entities/entity";
import { Projectile, ProjectileOpts } from "../entities/projectile";

export class _MD2fullGen extends _MD2Blockgenerator {
    bgSprite = new TilingSprite({
        texture: Texture.EMPTY,
        width: innerWidth,
        height: innerHeight,
        zIndex: -1,
    });

    constructor(md2: _MD2engine) {
        super(md2);

        this.engine.levelManager.groups.world.addChild(this.bgSprite);
    }

    createEntitySprite(name: string): Sprite {
        const s = new Sprite({
            texture: this.engine.dataManager.getTexture(name),
        });

        return s;
    }
    
    returnEntity(opts: Partial<EntityOpts> = {}, record = true): Entity {
        const e = new Entity({
            x: opts.x ?? 0,
            y: opts.y ?? 0,
            w: opts.w ?? 0,
            h: opts.h ?? 0,
            name: opts.name ?? "blank",
            id: this.engine.dataManager.getNewId(),
            animOpts: {}
        });  

        this.engine.initPromise.then(() => {
            e.init();
        });

        if(record) this.engine.levelManager.recordEntity(e);

        return e;
    }

    returnProjectile(opts: Partial<ProjectileOpts>, record = true): Projectile {
        const p = new Projectile({
            x: opts.x ?? 0,
            y: opts.y ?? 0,
            w: opts.w ?? 0,
            h: opts.h ?? 0,
            name: opts.name ?? "blank",
            id: this.engine.dataManager.getNewId(),
            texture: opts.texture || Texture.WHITE
        });

        if(opts.w) p.sprite.scaleX = (opts.w) / p.sprite.texture.width;
        if(opts.h) p.sprite.scaleY = (opts.h) / p.sprite.texture.height;

        p.setX(opts.x ?? 0);
        p.setY(opts.y ?? 0);

        if(record) this.engine.levelManager.recordProjectile(p);

        return p;
    }

    setBackground(name: string) {
        const t = this.engine.dataManager.getTexture(name);
        if(t == Texture.WHITE) {
            alert(`"${name}" is an invalid texture for the background`);
            return;
        }

        this.bgSprite.texture = t;
    }
}