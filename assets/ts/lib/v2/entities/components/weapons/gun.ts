import { Particle, Sprite, Texture } from "pixi.js";
import { MD2entityComponentManager } from "../main";
import { WeaponsComponent } from "../weapons";
import { XYWH } from "../../../types";
import { Entity } from "../../entity";
import { createMD2t } from "../../../modules/text/md2t-parser";
import { MDV } from "../../../../misc/vectors";
import { Projectile } from "../../projectile";
import { FgBlock } from "../../../blocks/blocks";
import { audio } from "../../../../../game/audio";

interface WeaponGunOpts {
    texture: string;
    bounds: XYWH;
    direction?: MDV.V2;
    bulletSpeed?: number;
}

export class WeaponGun extends WeaponsComponent {
    declare opts: Required<WeaponGunOpts>;

    constructor(manager: MD2entityComponentManager, opts: WeaponGunOpts) {
        opts.bulletSpeed ??= 1;
        opts.direction ??= new MDV.V2(0, 0);

        super(manager, opts);
    }

    async registerAttacks(): Promise<void> {
        this.onAtkEvent("main", this.mainAtk.bind(this));
    }

    async init(): Promise<void> {
        this.texture = MD2entityComponentManager.md2.dataManager.getTexture(this.opts.texture);
        super.init();
    }

    texture: Texture = Texture.WHITE;

    onBulletExplode(e: Projectile, block: FgBlock, pos: MDV.V4) {
        const md2 = MD2entityComponentManager.md2;

        md2.deletor.deleteBlockByBlockAndWorldPos(block, pos.x, pos.y);

        this.mapObj.delete(e);
    }

    createBullet(): Projectile {
        const e = this.createProjectile("bullet", this.texture, {
            w: this.opts.bounds.w,
            h: this.opts.bounds.h,
            x: this.manager.target.x + this.opts.bounds.x,
            y: this.manager.target.y + this.opts.bounds.y,
        });

        e.sprite.anchorY = 0;

        e.events.once("hit", (b, pos: MDV.V4) => this.onBulletExplode(e, b, pos));

        this.recordProjectile(e);

        return e;
    }

    mainAtk(...args) {
        if(!this.isInitialized) return;
        const e = this.createBullet();

        this.mapObj.set(e);

        audio.playAudio("gunshot");

        const moveTo = this.opts.direction || new MDV.V2(10, 10);

        this.moveEntitiesTo(this.mapObj.map, moveTo, 1_000)
        .then(() => {
            MD2entityComponentManager.md2.modules.text.showTitle(
                createMD2t([
                    "Bullet Exploded"
                ]), 300
            );

            this.mapObj.deleteAll();
        });
    }
}