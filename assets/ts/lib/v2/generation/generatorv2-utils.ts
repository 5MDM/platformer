import { Texture, TilingSprite } from "pixi.js";
import { _MD2engine } from "../engine";
import type { Mgenerator, MgeneratorCreateTileSpriteFromBoundsOpts } from "./generatorv2";
import { MDV } from "../../misc/vectors/vectors";
import { BlockInfo, XYWH } from "../types";
import { AnyBlock, BgBlock, BgBlockConstructorOpts, FgBlock, FGblockConstructorOpts } from "../blocks/blocks";
import { degToRad } from "../../misc/util";

export class MgeneratorUtils {
    g: Mgenerator;
    md2: _MD2engine;
    bz: number;
    constructor(g: Mgenerator) {
        this.g = g;
        this.md2 = g.md2;
        this.bz = this.md2.blockSize;
    }

    getPivotFromWH({w, h}: {w: number, h: number}): MDV.XY {
        return {x: w / 2, y: h / 2};
    }

    getPivotFromTexture(t: Texture): MDV.XY {
        return {x: t.width / 2, y: t.height / 2};
    }

    getTileScaleFromTexture(t: Texture): MDV.XY {
        return {x: this.bz / t.width, y: this.bz / t.height};
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
        opts?: MgeneratorCreateTileSpriteFromBoundsOpts
    ): TilingSprite {
        // TODO: clamp margin = 0
        return new TilingSprite({
            position: {x: worldBounds.x, y: worldBounds.y},
            width: worldBounds.w,
            height: worldBounds.h,
            roundPixels: true,
            texture: t,
            tileRotation: radians,
            ...opts
        });
    }

    createFgBlock
    (opts: Omit<FGblockConstructorOpts, "id" | "blockSize">): FgBlock {
        return new FgBlock({
            id: this.md2.dataManager.getNewId(),
            blockSize: this.bz,
            ...opts
        });
    }

    /**
     * 
     * @param worldBounds - non-destructive
     */
    createFgBlockFromBlockInfo(
        worldBounds: XYWH, 
        info: BlockInfo, 
        texture: Texture,
        deg = 0, 
        spriteOpts?: MgeneratorCreateTileSpriteFromBoundsOpts,
        components?: Record<string, Record<string, any>>
    ): FgBlock {
        return this.createFgBlock({
            ...worldBounds,
            name: info.name,
            // block constructor opts rotation must be in degrees
            rotation: deg,
            sprite: this.createTileSpriteFromBounds(texture, worldBounds, deg, spriteOpts),
            isOversize: info.isOversize,
            defaultComponents: info.components,
            components,
        });
    }

    createBgBlock(opts: Omit<BgBlockConstructorOpts, "id" | "blockSize">): BgBlock {
        return new BgBlock({
            id: this.md2.dataManager.getNewId(),
            blockSize: this.bz,
            ...opts
        });
    }

    createBgBlockFromBlockInfo(
        worldBounds: XYWH, 
        info: BlockInfo,
        texture: Texture,
        deg = 0,
        isOverlay = false,
        spriteOpts?: MgeneratorCreateTileSpriteFromBoundsOpts,
    ): BgBlock {
        return this.createBgBlock({
            ...worldBounds,
            rotation: deg,
            sprite: this.createTileSpriteFromBounds(texture, worldBounds, degToRad(deg), spriteOpts),
            name: info.name,
            isOversize: info.isOversize,
            isOverlay,
        });
    }

    /**
     * 
     * ## warning
     * Extra caution needed when using in internal generator functions. 
     * Oversize sprites may break
     */
    createBlockFromInfo(
        info: BlockInfo, 
        worldBounds: XYWH, 
        texture: Texture,
        deg = 0, 
        spriteOpts?: MgeneratorCreateTileSpriteFromBoundsOpts,
        components?: Record<string, Record<string, any>>,
    ): AnyBlock {        
        if(info.type == "fg") {
            return this.createFgBlockFromBlockInfo
            (worldBounds, info, texture, deg, spriteOpts, components);
        } else {
            return this.createBgBlockFromBlockInfo(
                worldBounds, info, texture, deg,
                info.type == "overlay",
                spriteOpts,
            );
        }
    }
} 