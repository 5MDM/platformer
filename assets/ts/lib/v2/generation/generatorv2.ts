import { Sprite, Texture, TilingSpriteOptions } from "pixi.js";
import { _MD2engine } from "../engine";
import { Player } from "../entities/player";
import { BlockInfo, EntityInfo, LevelJSONoutput } from "../types";
import { MgeneratorSpriteUtils } from "./sprite-utils";
import { MD2errors } from "../errors";
import { Entity, EntityOpts } from "../entities/entity";
import { Projectile, ProjectileOpts } from "../entities/projectile";
import { MgeneratorBlockUtils } from "./block-utils";
import { BlockOpts } from "./generator";

export type MgeneratorCreateTileSpriteFromBoundsOpts = 
Omit<TilingSpriteOptions, "position" | "width" 
| "height" | "roundPixels" | "texture" | "tileRotation"
| "x" | "y" | "width" | "height">;

export class Mgenerator {
    player: Player;

    /** keys are texture paths */
    blockDefs: Record<string, BlockInfo> = {};
    engine: _MD2engine;

    entityDefs: Record<string, EntityInfo> = {};

    su: MgeneratorSpriteUtils;
    bu: MgeneratorBlockUtils;

    constructor(engine: _MD2engine) {
        this.engine = engine;

        this.player = new Player({
            x: 0,
            y: 0,
            w: 32,
            h: 64,
            id: this.engine.dataManager.getNewId(),
            view: this.engine.levelManager.groups.view,
            animOpts: {},
            name: "player",
        });

        engine.initPromise.then(() => {
            this.player.init();
        });

        this.su = new MgeneratorSpriteUtils(this);
        this.bu = new MgeneratorBlockUtils(this);

        this.engine.levelManager.recordPlayer(this.player);
    }

    getBlockDef(path: string): BlockInfo | false {
        const name = path;

        const blockDef = this.blockDefs[name];
        if (blockDef) return blockDef;
        else {
            this.engine.errorManager.blockNotFound(name);
            return false;
        }
    }

    registerBlock(name: string, block: BlockInfo) {
        this.blockDefs[name] = block;
    }

    createEntity(o: EntityOpts) {
        const entity = new Entity(o);

        this.engine.levelManager.recordEntity(entity);
    }

    getBlockDefArr(): BlockInfo[] {
        return Object.values(this.blockDefs);
    }

    replaceBlocks(data: LevelJSONoutput[]) {
        for(const i of data) {
            try {
                this.generateBlockFromData(i);
            } catch(err) {
                throw MD2errors.generatingBlockError(i.type, i.x, i.y);
            }
        }
    }

    private tempBlockOptsObj: BlockOpts = {
        x: 0, y: 0, w: 0, h: 0,
        name: "blank.png",
        rotation: 0,
        components: null!,
    };

    generateBlockFromData(o: LevelJSONoutput) {
        const ob = this.tempBlockOptsObj;
        ob.x = o.x;
        ob.y = o.y;
        ob.w = o.w;
        ob.h = o.h;
        ob.name = o.type;
        ob.components = o.components;

        this.bu.generateBlock(ob);
    }

    getEntityDefArr(): EntityInfo[] {
        return Object.values(this.entityDefs);
    }

    registerEntity(name: string, info: EntityInfo) {
        this.entityDefs[name] = info;
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

    private tempProjObj: ProjectileOpts = {
        x: 0, y: 0, w: 0, h: 0,
        name: "blank.png",
        id: 0,
        texture: null!,
    };

    returnProjectile(opts: Partial<ProjectileOpts>, record = true): Projectile {
        const o = this.tempProjObj;
        o.x = opts.x ?? 0;
        o.y = opts.y ?? 0;
        o.w = opts.w ?? 0;
        o.h = opts.h ?? 0;
        o.name = opts.name ?? "blank";
        o.id = this.engine.dataManager.getNewId();
        o.texture = opts.texture || Texture.WHITE;

        const p = new Projectile(o);

        if(opts.w) p.sprite.scaleX = opts.w / p.sprite.texture.width;
        if(opts.h) p.sprite.scaleY = opts.h / p.sprite.texture.height;

        p.setX(o.x);
        p.setY(o.y);

        if(record) this.engine.levelManager.recordProjectile(p);

        return p;
    }
}