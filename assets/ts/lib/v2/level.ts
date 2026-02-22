import { Container, Sprite, Texture } from "pixi.js";
import { GMOutput, Keymap } from "../misc/keymap";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock, BgBlock, FgBlock } from "./blocks/blocks";
import { _MD2engine } from "./engine";
import { Entity } from "./entities/entity";
import { Player } from "./entities/player";
import { _md2events, LevelDataV0_0_0, LevelJSONoutput, MDgameGridType, XYandMatrix, XYtuple } from "./types";
import { floorToMultiples } from "../misc/util";
import { MD2doorpointComponent } from "./blocks/components/doorpoint";
import { MDV } from "../misc/vectors/vectors";
import { Projectile } from "./entities/projectile";

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

                if(data.meta) {
                    if(data.meta.dimension
                    && data.meta.dimension != engine.CD
                    ) engine.switchDimensions();
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

    entityRecord: Record<number, Entity> = {};
    projectileRecord: Record<number, Projectile> = {};

    engine: _MD2engine;

    static maxLevelSize = 128;

    levelGrids: Record<MDgameGridType, MDmatrix<AnyBlock>> = {
        overlay: new MDmatrix<BgBlock>(_MD2levelManager.maxLevelSize, _MD2levelManager.maxLevelSize),
        fg: new MDmatrix<FgBlock>(_MD2levelManager.maxLevelSize, _MD2levelManager.maxLevelSize),
        bg: new MDmatrix<BgBlock>(_MD2levelManager.maxLevelSize, _MD2levelManager.maxLevelSize),
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

        this.container.addChild(this.groups.world);
    }

    recordBlock(type: MDgameGridType, o: AnyBlock) {
        const [x, y] = o.getWorldGridPos();
        const [w, h] = o.getWorldGridSize();

        const oldBlock: AnyBlock | undefined = this.levelGrids[type].get(x, y);
        if(oldBlock) this.engine.deletor.deleteBlockByBlockAndWorldPos(oldBlock, x, y);

        o.sprite.x += o.blockSize / 2;
        this.groups[type].addChild(o.container);

        this.levelGrids[type].set(x, y, o);
        this.blockRecord[type][o.id] = o;

        Keymap.IterateGMrect(x, y, w, h, (x, y) =>
            this.levelGrids[type].set(x, y, o)
        );
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

    recordProjectile(p: Projectile) {
        this.projectileRecord[p.id] = p;
        this.groups.fg.addChild(p.container);
        this.engine.physics.addEntity(p);
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

    sampleFgBlocks(bounds: MDV.V4): AnyBlock[] {
        if(!this.levelGrids.fg.containsBound(bounds)) return [];

        const blocks: AnyBlock[] = [];

        bounds.forEachIntPoint(({x, y}) => {
            const block = this.levelGrids.fg.get(x, y);
            if(!block) return;
            blocks.push(block);
        });

        return blocks;
    }

    sampleIndividualFgBlocks(bounds: MDV.V4, minimizeSize = false): XYandMatrix<FgBlock> | false {
        var noResults = false;
        var w = bounds.w;
        var h = bounds.h;

        if(minimizeSize) {
            w = 0;
            h = 0;
            bounds.forEachIntPoint(({x, y}) => {
                const nw = x - bounds.x + 1;
                const nh = y - bounds.y + 1;

                if(nw > w) w = nw;
                if(nh > h) h = nh;
                if(nw == 0 || nh == 0) return noResults = true;
            });
        }

        if(noResults) return false;

        const m = new MDmatrix<FgBlock>(w, h);

        bounds.forEachIntPoint(({x, y}) => {
            const block = this.levelGrids.fg.get(x, y) as FgBlock;
            if(!block) return;

            m.set(x, y, block);
        });
        
        return {
            x: bounds.x,
            y: bounds.y,
            matrix: m,
        };
    }

    getOutsideFacingPoints(bounds: MDV.V4): MDV.V2[] {
        const blocks = this.sampleFgBlocks(bounds);
        if(!blocks) return [];

        const points: MDV.V2[] = [];

        for(const block of blocks) {
            const bounds = MDV.V4.fromBounds(block);
            points.push(...bounds.getOutsideIntPoints(this.engine.blockSize));
        }

        return points;
    }

    registerDoorpoint(dp: MD2doorpointComponent) {
        // why is this just empty
    }
}