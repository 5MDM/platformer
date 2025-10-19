import { Sprite, TilingSprite } from "pixi.js";
import { MDmatrix } from "../../misc/matrix";
import { degToRad } from "../../misc/util";
import { FgBlock, BgBlock, AnyBlock, BasicBox } from "../blocks/blocks";
import { _MD2engine } from "../engine";
import { EntityOpts, Entity } from "../entities/entity";
import { Player } from "../entities/player";
import { Success } from "../level";
import { BlockCreationOpts, BlockInfo, EntityInfo, LevelJSONoutput, MDgameGridType } from "../types";
import { greedyMesh } from "./greedy-mesh";
import { MD2componentObjType } from "../blocks/components/main";


export interface BlockOpts {
    name: string;
    rotation: number;
    x: number;
    y: number;
    w: number;
    h: number;
    components?: MD2componentObjType;
}

export abstract class _MD2Blockgenerator {
    player: Player;

    private blockDefs: Record<string, BlockInfo> = {};
    engine: _MD2engine;

    private entityDefs: Record<string, EntityInfo> = {};

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

        this.engine.levelManager.recordPlayer(this.player);
    }

    getBlockDef(name: string): BlockInfo | false {
        const blockDef = this.blockDefs[name];
        if (blockDef) return blockDef;
        else {
            this.engine.errorManager.blockNotFound(name);
            return false;
        }
    }

    createSprite(o: BlockCreationOpts, def: BlockInfo): TilingSprite {
        const t = this.engine.dataManager.getTexture(o.name);

        if (def.isOversize) {
            const x = o.x;
            const y = o.y;

            const s = new TilingSprite({
                texture: t,
                position: { x, y },
                roundPixels: true,
                //tileScale: {x: this.engine.blockSize / t.width, y: this.engine.blockSize / t.height},
                pivot: {
                    x: t.width / 2,
                    y: t.height / 2,
                },

                tileRotation: degToRad(o.rotation ?? 0),
            });

            s.clampMargin = 0;

            return s;
        } else {
            const x = o.x + o.w / 2;
            const y = o.y + o.h / 2;

            const s = new TilingSprite({
                texture: t,
                width: o.w + .1,
                height: o.h + .1,
                position: { x, y },
                roundPixels: true,
                tileScale: { x: this.engine.blockSize / t.width, y: this.engine.blockSize / t.height },
                pivot: {
                    x: o.w / 2,
                    y: o.h / 2,
                },

                tileRotation: degToRad(o.rotation ?? 0),
            });

            s.clampMargin = 0;

            return s;
        }
    }

    private createFgBlock(o: BlockOpts, def: BlockInfo, sprite: TilingSprite, record: boolean = true) {
        const components = o.components || def.components;

        if(def.isOversize) {
            const hw = this.engine.divideByBlockSize(sprite.width / 2) * this.engine.blockSize;
            const hh = this.engine.divideByBlockSize(sprite.height / 2) * this.engine.blockSize;
            const w = this.engine.divideByBlockSize(sprite.width) * this.engine.blockSize;
            const h = this.engine.divideByBlockSize(sprite.height) * this.engine.blockSize;

            sprite.x += hw;
            sprite.y += hh;
            o.w = w;
            o.h = h;
        }

        const fgBlock = new FgBlock({
            x: o.x,
            y: o.y,
            w: o.w,
            h: o.h,
            name: def.texture,
            rotation: o.rotation,
            sprite,
            //CL: components,
            id: this.engine.dataManager.getNewId(),
            blockSize: this.engine.blockSize,
            isOversize: def.isOversize,
            defaultComponents: def.components,
            components,
        });

        //fgBlock.sprite.x -= this.engine.blockSize / 2;
        if(record) this.engine.levelManager.recordBlock("fg", fgBlock);

        // if (!components || Object.keys(components).length != 0) {
        //     //this.componentParser.parseComponents(fgBlock);
        // }

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

    createAndReturnBlock(o: BlockOpts, record: boolean = true): AnyBlock | false {
        o.x *= this.engine.blockSize;
        o.y *= this.engine.blockSize;
        o.w *= this.engine.blockSize;
        o.h *= this.engine.blockSize;

        o.rotation ??= 0;

        const info = this.getBlockDef(o.name);
        if(!info) return false;

        const s: TilingSprite = this.createSprite(o, info);

        switch (info.type) {
            default:
            case "fg":
                return this.createFgBlock(o, info, s, record);
            case "bg":
                return this.createBgBlock(o, info, s, false, record);
            case "overlay":
                return this.createBgBlock(o, info, s, true, record);
        }
    }

    generateBlocks(o: BlockOpts): Success {
        const block = this.createAndReturnBlock(o);
        if(!block) return block;

        this.engine.levelManager.groups[block.type].addChild(block.sprite);

        return true;
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

    setBackground(name: string) {
    }

    replaceBlocks(data: LevelJSONoutput[]) {
        for(const i of data) {
            this.generateBlocks({
                name: i.type,
                rotation: i.rotation,
                x: i.x,
                y: i.y,
                w: i.w,
                h: i.h,
                components: i.components,
            });
        }
    }

    generateBlockFromData(o: LevelJSONoutput) {
        this.generateBlocks({
            name: o.type,
            rotation: o.rotation,
            x: o.x,
            y: o.y,
            w: o.w,
            h: o.h,
            components: o.components,
        });

    }

    injectBlocks(grid: Record<MDgameGridType, MDmatrix<AnyBlock>>) {
        const data: LevelJSONoutput[] = greedyMesh(grid);
        
        this.replaceBlocks(data);
    }

    getEntityDefArr(): EntityInfo[] {
        return Object.values(this.entityDefs);
    }

    registerEntity(name: string, info: EntityInfo) {
        this.entityDefs[name] = info;
    }
}
