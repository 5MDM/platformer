import { SpriteOptions, Texture, TilingSprite, TilingSpriteOptions } from "pixi.js";
import { _MD2engine } from "../engine";
import type { Mgenerator, MgeneratorCreateTileSpriteFromBoundsOpts } from "./generatorv2";
import { MDV } from "../../misc/vectors/vectors";
import { BlockInfo, XYWH } from "../types";
import { AnyBlock, BgBlock, BgBlockConstructorOpts, FgBlock, FGblockConstructorOpts } from "../blocks/blocks";
import { degToRad } from "../../misc/util";
import { Projectile } from "../entities/projectile";
import { MD2errors } from "../errors";

/** Some options are mutually exclusive */
export const spriteBitflags = {
    none: 0,
    getPivotFromWH: 1 << 0,
    getTileScaleFromTexture: 1 << 1,
    setClampMarginTo0: 1 << 2,
    addPosByHalfSize: 1 << 3,
    roundPixels: 1 << 4,
    getPivotFromTexture: 1 << 5,
} as const;

export const spriteBitflagCombinations = {
    standardSprite: spriteBitflags.getPivotFromWH 
    | spriteBitflags.getTileScaleFromTexture
    | spriteBitflags.setClampMarginTo0
    | spriteBitflags.addPosByHalfSize
    | spriteBitflags.roundPixels,

    oversizeSprite: spriteBitflags.getPivotFromWH 
    | spriteBitflags.getPivotFromTexture
    | spriteBitflags.setClampMarginTo0
    | spriteBitflags.roundPixels,
} as const;

export class MgeneratorUtils {
    g: Mgenerator;
    md2: _MD2engine;
    bz: number;
    constructor(g: Mgenerator) {
        this.g = g;
        this.md2 = g.engine;
        this.bz = this.md2.blockSize;
    }

    getBlockDef(tPath: string): BlockInfo | never {
        const i = this.g.blockDefs[tPath];
        if(!i) throw MD2errors.notFound("texture path", tPath);

        return i;
    }


    doesTexturePathExist(tPath: string): boolean {
        const foundInfo = this.g.blockDefs[tPath];
        if(!foundInfo) {
            this.md2.errorManager.blockNotFound(tPath);
            return false;
        } else return true;
    }

    /**
     * 
     * @param worldBounds - non-destructive
     */
    createTileSpriteFromBounds(
        t: Texture, 
        worldBounds: XYWH, 
        radians = 0, 
    ): TilingSprite {
        // TODO: clamp margin = 0
        return new TilingSprite({
            position: {x: worldBounds.x, y: worldBounds.y},
            width: worldBounds.w+1,
            height: worldBounds.h+1,
            roundPixels: true,
            texture: t,
            tileRotation: radians,
        });
    }

    /**
     * 
     * @param worldBounds - non-destructive
     */
    createTileSpriteFromBoundsWithOpts(
        t: Texture, 
        worldBounds: XYWH, 
        radians = 0, 
        opts?: MgeneratorCreateTileSpriteFromBoundsOpts
    ): TilingSprite {
        // TODO: clamp margin = 0
        return new TilingSprite({
            position: {x: worldBounds.x, y: worldBounds.y},
            width: worldBounds.w+1,
            height: worldBounds.h+1,
            roundPixels: true,
            texture: t,
            tileRotation: radians,
            ...opts
        });
    }

    /**
     * 
     * @param worldBounds - non-destructive
     * @param opts - this will override the bitflag properties
     */
    createTileSpriteFromBoundsAndBitflags(
        t: Texture, 
        worldBounds: XYWH, 
        radians = 0, 
        bi: number,
        opts?: MgeneratorCreateTileSpriteFromBoundsOpts
        & keyof typeof TilingSprite
    ) {
        /** null values cannot be null at the end */
        const os = {
            width: 0,
            height: 0,
            roundPixels: false,
            texture: null! as (null | Texture),
            tileRotation: 0,
            pivot: {x: 0, y: 0},
            tileScale: {x: 1, y: 1},
            position: {x: 0, y: 0},
        };

        const o = os as typeof os & TilingSpriteOptions;

        o.width = worldBounds.w+1;
        o.height = worldBounds.h+1;
        o.texture = t;
        o.tileRotation = radians;

        if(bi & spriteBitflags.getPivotFromWH) {
            o.pivot.x = worldBounds.w / 2;
            o.pivot.y = worldBounds.h / 2;
        } else if(bi & spriteBitflags.getPivotFromTexture) {
            o.pivot.x = t.width / 2;
            o.pivot.y = t.height / 2;
        }

        if(bi & spriteBitflags.getTileScaleFromTexture) {
            o.tileScale.x = this.bz / t.width;
            o.tileScale.y = this.bz / t.height;
        }

        o.roundPixels = !!(bi & spriteBitflags.roundPixels);

        if(bi & spriteBitflags.addPosByHalfSize) {
            o.position.x = worldBounds.x + worldBounds.w / 2;
            o.position.y = worldBounds.y + worldBounds.h / 2;
        } else {
            o.position.x = worldBounds.x;
            o.position.y = worldBounds.y;
        }

        const s = new TilingSprite(o);

        if(opts) {
            const keys = Object.keys(opts) as (keyof typeof opts)[];
            for(let i = 0; i < keys.length; i++) {
                const key = keys[i];
                s[key] = opts[key];
            }
        }

        if(bi & spriteBitflags.setClampMarginTo0) 
            s.clampMargin = 0;

        return s;
    }
} 