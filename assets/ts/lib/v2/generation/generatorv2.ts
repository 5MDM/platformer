import { Sprite, Texture, TextureSource, TilingSprite, TilingSpriteOptions } from "pixi.js";
import { degToRad, Dict, radToDeg } from "../../misc/util";
import { _MD2engine } from "../engine";
import { Player } from "../entities/player";
import { AnyTileSprites, BlockCreationOpts, BlockInfo, EntityInfo, LevelJSONoutput, MDgameGridType, XYWH } from "../types";
import { MDV } from "../../misc/vectors/vectors";
import { MgeneratorUtils, spriteBitflagCombinations } from "./generatorv2-utils";
import { MD2errors } from "../errors";
import { BlockOpts } from "./generator";
import { AnyBlock, BgBlock, FgBlock } from "../blocks/blocks";
import { Entity, EntityOpts } from "../entities/entity";
import { Projectile, ProjectileOpts } from "../entities/projectile";

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

    u: MgeneratorUtils;

    constructor(engine: _MD2engine) {
        this.engine = engine;

        this.player = new Player({
            x: 0,
            y: 0,
            w: 32,
            h: 64,
            id: this.engine.dataManager.getNewId(),
            view: this.engine.levelManager.groups.view,
            animOpts: {
            },
            name: "player",
        });

        engine.initPromise.then(() => {
            this.player.init();
        });

        this.u = new MgeneratorUtils(this);

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

    createSprite(t: Texture, worldBounds: XYWH, radians: number, isOversize = false): AnyTileSprites {
        return this.u.createTileSpriteFromBoundsAndBitflags(
            t, 
            worldBounds,
            radians, 
            isOversize ? spriteBitflagCombinations.oversizeSprite 
            : spriteBitflagCombinations.standardSprite
        );    
    }

    private modifyBoundsByHitbox(o: XYWH, hitbox: Partial<XYWH>) {
        o.x += hitbox.x ?? 0;
        o.y += hitbox.y ?? 0;
        o.w = hitbox.w ?? o.w;
        o.h = hitbox.h ?? o.h;
    }

    private tempv2 = new MDV.V2(0, 0);

    private createFgBlock(
        o: Omit<BlockOpts, "name">, 
        def: BlockInfo, 
        sprite: TilingSprite, 
        record: boolean = true
    ) {
        const components = o.components || def.components;

        if(def.isOversize) {
            // adds sprite pos by half size
            const halfSize = this.tempv2;
            halfSize.setFromWidthHeight(sprite);
            halfSize.divideS(2);
            halfSize.addToXY(sprite);
        }

        if(def.hitbox) this.modifyBoundsByHitbox(o, def.hitbox);

        const fgBlock = new FgBlock({
            x: o.x,
            y: o.y,
            w: o.w,
            h: o.h,
            name: def.texture,
            rotation: o.rotation,
            sprite,
            id: this.engine.dataManager.getNewId(),
            blockSize: this.engine.blockSize,
            isOversize: def.isOversize,
            defaultComponents: def.components,
            components,
        });

        if(record) this.engine.levelManager.recordBlock("fg", fgBlock);

        return fgBlock;
    }

    private createBgBlock(o: BlockOpts, def: BlockInfo, sprite: TilingSprite, isOverlay: boolean = false, record: boolean = true) {
        const bgBlock = new BgBlock({
            x: o.x,
            y: o.y,
            w: o.w,
            h: o.h,
            name: def.texture,
            rotation: o.rotation,
            sprite,
            id: this.engine.dataManager.getNewId(),
            isOverlay,
            blockSize: this.engine.blockSize,
            isOversize: def.isOversize,
        });
        
        if(record) this.engine.levelManager.recordBlock(def.type || "bg", bgBlock);

        return bgBlock;
    }

    generateBlock(o: BlockOpts, record: boolean = true): AnyBlock | false {
        o.x *= this.engine.blockSize;
        o.y *= this.engine.blockSize;
        o.w *= this.engine.blockSize;
        o.h *= this.engine.blockSize;

        o.rotation ??= 0;

        const info = this.getBlockDef(o.name);
        if(!info) return false;

        const t = this.engine.dataManager.getTexture(o.name);
        const radians = degToRad(o.rotation);
        const s = this.createSprite(t, o, radians, info.isOversize);

        // !info.type is needed for player
        if(info.type == "fg" || !info.type) {
            return this.createFgBlock(o, info, s, record);
        } else {
            // bg and overlay
            return this.createBgBlock(o, info, s, info.type == "overlay", record);
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
                this.generateBlock({
                    name: i.type,
                    rotation: i.rotation,
                    x: i.x,
                    y: i.y,
                    w: i.w,
                    h: i.h,
                    components: i.components,
                });
            } catch(err) {
                throw MD2errors.generatingBlockError(i.type, i.x, i.y);
            }
        }
    }

    generateBlockFromData(o: LevelJSONoutput) {
        this.generateBlock({
            name: o.type,
            rotation: o.rotation,
            x: o.x,
            y: o.y,
            w: o.w,
            h: o.h,
            components: o.components,
        });
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
}