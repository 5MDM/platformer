import { TilingSprite } from "pixi.js";
import { MDV } from "../../misc/vectors/vectors";
import { AnyBlock, BgBlock, BgBlockConstructorOpts, FgBlock, FGblockConstructorOpts } from "../blocks/blocks";
import { BlockInfo, XYWH } from "../types";
import type { Mgenerator } from "./generatorv2";
import { BlockOpts } from "./generator";
import { _MD2engine } from "../engine";
import { degToRad } from "../../misc/util";

export class MgeneratorBlockUtils {
    g: Mgenerator;
    md2: _MD2engine;
    bz: number;

    constructor(g: Mgenerator) {
        this.g = g;
        this.md2 = g.engine;
        this.bz = this.md2.blockSize;

        this.tempBgBlockObj.blockSize = this.bz;
        this.tempFgBlockObj.blockSize = this.bz;
    }

    private tempv2 = new MDV.V2(0, 0);

    private tempFgBlockObj: FGblockConstructorOpts = {
        x: 0, y: 0, w: 32, h: 32,
        name: "unknown.png",
        rotation: 0,
        id: 0,
        isOversize: false,
        sprite: null! as TilingSprite,
        components: undefined,
        defaultComponents: undefined,
        blockSize: 32,
    };

    private tempBgBlockObj: BgBlockConstructorOpts = {
        x: 0, y: 0, w: 32, h: 32,
        name: "unknown.png",
        rotation: 0,
        id: 0,
        isOverlay: false,
        isOversize: false,
        sprite: null! as TilingSprite,
        blockSize: 32,
    };

    private modifyFgBlockBoundsByHitbox(hitbox: Partial<XYWH>) {
        const o = this.tempFgBlockObj;
        o.x += hitbox.x ?? 0;
        o.y += hitbox.y ?? 0;
        o.w = hitbox.w ?? o.w;
        o.h = hitbox.h ?? o.h;
    }

    createFgBlock(
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

        const ob = this.tempFgBlockObj;
        ob.x = o.x;
        ob.y = o.y;
        ob.w = o.w;
        ob.h = o.h;
        ob.name = def.texture;
        ob.rotation = o.rotation;
        ob.id = this.g.engine.dataManager.getNewId();
        ob.isOversize = def.isOversize;
        ob.sprite = sprite;
        ob.defaultComponents = def.components;
        ob.components = components;

        if(def.hitbox) this.modifyFgBlockBoundsByHitbox(def.hitbox);

        const fgBlock = new FgBlock(ob);

        if(record) this.md2.levelManager.recordBlock("fg", fgBlock);

        return fgBlock;
    }

    createBgBlock(
        o: BlockOpts, 
        def: BlockInfo, 
        sprite: TilingSprite, 
        isOverlay: boolean = false, 
        record: boolean = true
    ) {
        const bo = this.tempBgBlockObj;
        bo.x = o.x;
        bo.y = o.y;
        bo.w = o.w;
        bo.h = o.h;
        bo.name = def.texture;
        bo.rotation = o.rotation;
        bo.id = this.md2.dataManager.getNewId();
        bo.isOverlay = isOverlay;
        bo.isOversize = def.isOversize;
        bo.sprite = sprite;
        
        const bgBlock = new BgBlock(bo);
        
        if(record) this.md2.levelManager.recordBlock(def.type || "bg", bgBlock);

        return bgBlock;
    }

    generateBlock(o: BlockOpts, record: boolean = true): AnyBlock | false {
        const bz = this.bz;
        o.x *= bz;
        o.y *= bz;
        o.w *= bz;
        o.h *= bz;

        o.rotation ??= 0;

        const info = this.g.getBlockDef(o.name);
        if(!info) return false;

        const t = this.md2.dataManager.getTexture(o.name);
        const radians = degToRad(o.rotation);
        const s = this.g.su
        .createStandardSprite(t, o, radians, info.isOversize);

        // (!info.type) is needed for player
        if(info.type == "fg" || !info.type) {
            return this.createFgBlock(o, info, s, record);
        } else {
            // bg and overlay
            return this.createBgBlock(o, info, s, info.type == "overlay", record);
        }
    }

}