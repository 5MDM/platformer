import { MD2editor } from "../editor/main";
import { AnyBlock, FgBlock } from "./blocks/blocks";
import { MD2componentModule } from "../misc/components";
import { _MD2engine } from "./engine";
import { Entity } from "./entities/entity";
import { MDgameGridType } from "./types";
import { MDV } from "../misc/vectors/vectors";
import { Sprite, Texture } from "pixi.js";

interface AutomationDataHolder {
    val: unknown;
    type: string;
}

export class MD2devAutomation {
    engine: _MD2engine;
    protected lastData: AutomationDataHolder = {
        val: undefined,
        type: "none",
    };

    editor?: MD2editor;

    isStopped = false;

    protected lastBlock?: AnyBlock;
    protected lastCreatedFgBlock?: FgBlock;

    private setVal(val: unknown, type?: string) {
        this.lastData.val = val;
        this.lastData.type = type || typeof val;
    }

    constructor(engine: _MD2engine, editor?: MD2editor) {
        this.engine = engine;
        this.editor = editor;
    }

    getBlock(x?: number, y?: number, type?: MDgameGridType): this {
        if(this.isStopped) return this;

        x ??= this.lastBlock?.x ?? 0;
        y ??= this.lastBlock?.y ?? 0;
        type ??= this.lastBlock?.type ?? "fg";

        const block = this.engine.levelManager.levelGrids[type].get(x, y);
        this.setVal(block, block?.type);

        if(!block) return this;

        this.lastBlock = block;

        return this;
    }

    stopIfUndefined(): this | void {
        if(this.lastData == undefined) this.isStopped = true;
        return this;
    }

    stop(): this {
        this.isStopped = true;
        return this;
    }

    returnData(): AutomationDataHolder {
        return this.lastData;
    }

    lastComponent?: MD2componentModule<FgBlock>;
    getComponent(name: string): this {
        if(this.isStopped || !(this.lastBlock instanceof FgBlock)) return this;

        this.lastComponent = this.lastBlock.components.components[name];

        return this;
    }

    editComponentAttr(name: string, val: any) {
        if(this.isStopped || !this.lastComponent) return this;
        this.lastComponent.opts[name] = val;

        return this;
    }

    refreshComponents() {
        if(this.isStopped || !(this.lastBlock instanceof FgBlock)) return this;

        this.lastBlock.components.restartComponents();

        return this;
    }

    deleteCurrentLevel(onFinish?: (context: MD2devAutomation) => void) {
        if(this.isStopped) return this;

        this.engine.levelManager.destroyCurrentLevel()
        .then(() => onFinish?.(this));

        return this;
    }

    loadLevel(name: string) {
        if(this.isStopped) return this;

        if(this.engine.levelManager.getLevel(name))
            this.engine.levelManager.loadLevel(name);

        return this;
    }

    logAllBlocksInCurrentLevel() {
        if(this.isStopped) return this;

        console.log(this.engine.levelManager.exportCurrentLevel().blocks);

        return this;
    }

    tp(entity: Entity, x: number | undefined, y: number | undefined) {
        if(x) entity.setX(x);
        if(y) entity.setY(y);
        return this;
    }

    createFgBlockByTexture
    (pos: MDV.V2, texture: Texture, record = true, isOversize = false) {
        const block = new FgBlock({
            name: texture.label || "custom-automation-block",
            isOversize,
            blockSize: this.engine.blockSize,
            id: this.engine.dataManager.getNewId(),
            x: pos.x,
            y: pos.y,
            rotation: 0,
            sprite: new Sprite(texture),
            w: this.engine.blockSize,
            h: this.engine.blockSize,
        });

        if(record) this.engine.levelManager.recordBlock("fg", block);

        this.lastCreatedFgBlock = block;

        return this;
    }

    getLastCreatedFgBlock(f: (block: FgBlock) => void) {
        f(this.lastCreatedFgBlock!);
        return this;
    }
}