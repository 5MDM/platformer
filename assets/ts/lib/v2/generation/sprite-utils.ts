import { SpriteOptions, Texture, TilingSprite, TilingSpriteOptions } from "pixi.js";
import { _MD2engine } from "../engine";
import type { Mgenerator } from "./generatorv2";
import { AnyTileSprites, BlockInfo, XYWH } from "../types";
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

export class MgeneratorSpriteUtils {
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

    private spriteTempObj = {
        position: {x: 0, y: 0},
        tileScale: {x: 1, y: 1},
        pivot: {x: 0, y: 0},
        width: 0,
        height: 0,
        tileRotation: 0,
        roundPixels: false,
        texture: null! as (null | Texture), 
    };

    /**
     * 
     * @param worldBounds - non-destructive
     */
    createTileSpriteFromBounds(
        t: Texture, 
        worldBounds: XYWH, 
        radians = 0, 
    ): TilingSprite {
        const o = this.spriteTempObj as 
        typeof this.spriteTempObj & TilingSpriteOptions;

        o.position.x = worldBounds.x;
        o.position.y = worldBounds.y;
        o.tileScale.x = 1;
        o.tileScale.y = 1;
        o.pivot.x = 0;
        o.pivot.y = 0;
        o.width = worldBounds.w+1;
        o.height = worldBounds.h+1;
        o.tileRotation = radians;
        o.roundPixels = true;
        o.texture = t;

        return new TilingSprite(o);
    }

    /**
     * 
     * @param worldBounds - non-destructive
     */
    createTileSpriteFromBoundsAndBitflags(
        t: Texture, 
        worldBounds: XYWH, 
        radians = 0, 
        bi: number,
    ) {
        const o = this.spriteTempObj as 
        typeof this.spriteTempObj & TilingSpriteOptions;

        if(bi & spriteBitflags.addPosByHalfSize) {
            o.position.x = worldBounds.x + worldBounds.w / 2;
            o.position.y = worldBounds.y + worldBounds.h / 2;
        } else {
            o.position.x = worldBounds.x;
            o.position.y = worldBounds.y;
        }

        if(bi & spriteBitflags.getTileScaleFromTexture) {
            o.tileScale.x = this.bz / t.width;
            o.tileScale.y = this.bz / t.height;
        } else {
            o.tileScale.x = 1;
            o.tileScale.y = 1;
        }

        if(bi & spriteBitflags.getPivotFromWH) {
            o.pivot.x = worldBounds.w / 2;
            o.pivot.y = worldBounds.h / 2;
        } else if(bi & spriteBitflags.getPivotFromTexture) {
            o.pivot.x = t.width / 2;
            o.pivot.y = t.height / 2;
        } else {
            o.pivot.x = 0;
            o.pivot.y = 0;
        }

        o.width = worldBounds.w+1;
        o.height = worldBounds.h+1;
        o.tileRotation = radians;
        o.roundPixels = !!(bi & spriteBitflags.roundPixels);
        o.texture = t;

        const s = new TilingSprite(o);

        if(bi & spriteBitflags.setClampMarginTo0) 
            s.clampMargin = 0;

        return s;
    }

    createStandardSprite(
        t: Texture, 
        worldBounds: XYWH, 
        radians: number, 
        isOversize = false
    ): AnyTileSprites {
        return this
        .createTileSpriteFromBoundsAndBitflags(
            t, 
            worldBounds,
            radians, 
            isOversize ? spriteBitflagCombinations.oversizeSprite 
            : spriteBitflagCombinations.standardSprite
        );    
    }
} 