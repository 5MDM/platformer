import { Container, Sprite, Texture } from "pixi.js";
import { GMOutput, Keymap } from "../misc/keymap";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock, BgBlock, FgBlock } from "./blocks/blocks";
import { _MD2engine } from "./engine";
import { Entity } from "./entities/entity";
import { Player } from "./entities/player";
import { _md2events, LevelDataV0_0_0, LevelJSONoutput, MDgameGridType, XYtuple } from "./types";
import { floorToMultiples } from "../misc/util";
import { MD2doorpointComponent } from "./blocks/components/doorpoint";

export type Success = boolean; 

const versionParser: 
Record<number, Record<number, Record<number, (engine: _MD2engine, data: LevelDataV0_0_0) => Success>>> = {
    0: {
        0: {
            0(engine, data) {
                for(const block of data.blocks) {
                    if(block.type == "@") {
                        _MD2levelManager.spawnX = block.x;
                        _MD2levelManager.spawnY = block.y;

                        continue;
                    }

                    engine.generator.generateBlocks({
                        name: block.type,
                        rotation: block.rotation,
                        x: block.x,
                        y: block.y,
                        w: block.w,
                        h: block.h,
                        components: block.components,
                    });
                }

                //if(data.background) engine.generator.setBackground(data.background.name);

                return true;
            }
        },
    },
};

export class _MD2levelManager {
    static spawnX = 0;
    static spawnY = 0;

    private levels: Record<string, LevelDataV0_0_0> = {};
    blockRecord: Record<MDgameGridType, Record<number, AnyBlock>> = {
        fg: {},
        bg: {},
        overlay: {},
    };

    doorpointMap: Record<string, XYtuple> = {};

    private entityRecord: Record<number, Entity> = {};

    engine: _MD2engine;

    levelGrids: Record<MDgameGridType, MDmatrix<AnyBlock>> = {
        overlay: new MDmatrix<BgBlock>(128, 128),
        fg: new MDmatrix<FgBlock>(128, 128),
        bg: new MDmatrix<BgBlock>(128, 128),
    };

    container: Container = new Container();

    readonly groups = {
        bg: new Container(),
        entity: new Container(),
        fg: new Container(),
        overlay: new Container(),
        static: new Container(),
        view: new Container(),
        world: new Container(),
    };

    readonly masks = {
        static: new Container(),
    };

    constructor(engine: _MD2engine) {
        this.engine = engine;

        this.groups.static.addChild(this.groups.bg);
        this.groups.static.addChild(this.groups.entity);
        this.groups.static.addChild(this.groups.fg);
        this.groups.static.addChild(this.groups.overlay);
        this.groups.view.addChild(this.groups.static);
        this.groups.world.addChild(this.groups.view);

        //this.groups.static.mask = this.masks.static;
        
        this.container.addChild(this.groups.world);
        //this.groups.world.addChild(this.darkness);
    }

    recordBlock(type: MDgameGridType, o: AnyBlock) {
        const [x, y] = o.getWorldGridPos();
        const [w, h] = o.getWorldGridSize();

        const oldBlock: AnyBlock | undefined = this.levelGrids[type].get(x, y);
        if(oldBlock) this.engine.deletor.deleteBlockByBlockAndWorldPos(oldBlock, x, y);

        this.levelGrids[type].set(x, y, o);
        this.blockRecord[type][o.id] = o;

        Keymap.IterateGMrect(x, y, w, h, (x, y) =>
            this.levelGrids[type].set(x, y, o)
        );

        this.groups[type].addChild(o.container);
    }

    recordEntity(entity: Entity) {
        this.entityRecord[entity.id] = entity;
        this.engine.physics.addEntity(entity);

        this.groups.entity.addChild(entity.container);
    }

    recordPlayer(player: Player) {
        // TODO: potentially remove entity record since it's a duplicate
        this.entityRecord[player.id] = player;
        this.engine.physics.addPlayer(player);

        this.groups.world.addChild(player.container);
    }

    setLevel(name: string, data: LevelDataV0_0_0): Success {
        if(!data) return false;
        if(!(data instanceof Object)) return false;

        this.levels[name] = data;

        return true;
    }

    getLevel(name: string): LevelDataV0_0_0 | false {
        const level = this.levels[name];
        if(level) return level;
        else {
            this.engine.errorManager.levelNotFound(name);
            return false;
        }
    }

    loadLevel(name: string): Success {
        const level = this.getLevel(name);
        if(!level) return false;

        this.generateLevel(level);

        return true;
    }

    private generateLevel(level: LevelDataV0_0_0) {
        versionParser[0][0][0](this.engine, level);
        
        this.engine.generator.player.setX(_MD2levelManager.spawnX * this.engine.blockSize);
        this.engine.generator.player.setY(_MD2levelManager.spawnY * this.engine.blockSize);
    }

    iterateFGblocks(f: (block: FgBlock, id: string) => void) {
        for(const id in this.blockRecord.fg)
            f(this.blockRecord.fg[id] as FgBlock, id);
    }

    iterateBGblocks(f: (block: BgBlock, id: string) => void) {
        for(const id in this.blockRecord.bg)
            f(this.blockRecord.bg[id], id);
    }    

    iterateOverlayblocks(f: (block: BgBlock, id: string) => void) {
        for(const id in this.blockRecord.overlay)
            f(this.blockRecord.overlay[id], id);
    }

    exportCurrentLevel(): LevelDataV0_0_0 {
        const arr: LevelJSONoutput[] = [];
        
        this.iterateFGblocks(block => arr.push(block.toJSON()));

        this.iterateBGblocks(block => arr.push(block.toJSON()));

        this.iterateOverlayblocks(block => arr.push(block.toJSON()));

        const output: LevelDataV0_0_0 = {
            version: [0, 0, 0],
            blocks: arr,
        };

        //if(this.shell.backgroundTextureName) output.background = {name: this.shell.backgroundTextureName};

        return output;
    }

    async destroyBlockType(type: MDgameGridType) {
        await this.levelGrids[type].clear();

        for(const id in this.blockRecord[type]) {
            this.blockRecord[type][id].destroy();
            delete this.blockRecord[type][id];
        }
    }

    private destroyEntities() {
        for(const id in this.entityRecord) {
            const entity = this.entityRecord[id];
            if(!entity.isPlayer) entity.destroy();

            delete this.entityRecord[id];
        }
    }

    async destroyCurrentLevel() {
        this.engine.events.emit(_md2events.levelDeleteB);

        await this.destroyBlockType("fg");
        await this.destroyBlockType("bg");
        await this.destroyBlockType("overlay");

        this.destroyEntities();

        this.engine.events.emit(_md2events.levelDeleteA);
    }

    loadLevelFromJSONstring(str: string) {
        var json: LevelDataV0_0_0;

        try {
            json = JSON.parse(str);
        } catch(err) {
            alert(err);
            return;
        }

        this.setLevel("custom_level", json);
        this.destroyCurrentLevel()
        .then(() => this.loadLevel("custom_level"));
    }

    async activateDoorpoint(dp: MD2doorpointComponent) {
        await this.destroyCurrentLevel();

        const {player} = this.engine.generator;
        const {x, y} = player;

        const bx = floorToMultiples(x, this.engine.blockSize);
        const by = floorToMultiples(y, this.engine.blockSize);

        this.doorpointMap[dp.opts.id] = [bx, by];

        this.loadLevel(dp.opts.toLevel);

        if(dp.opts.linkId) 
            if(this.doorpointMap[dp.opts.linkId]) {
                const [x, y] = this.doorpointMap[dp.opts.linkId];
                player.setX(x);
                player.setY(y);
            }
    }

    registerDoorpoint(dp: MD2doorpointComponent) {

    }
}