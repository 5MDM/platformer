import { AnyBlock } from "../blocks/blocks";
import { _MD2engine } from "../engine";
import { Success } from "../level";
import { LevelJSONoutput, MDgameGridType } from "../types";
import { greedyMeshGridFromBlockDeletion } from "./greedy-mesh";

interface DeletionObj {
    arr: LevelJSONoutput[];
    block: AnyBlock;
    dx: number;
    dy: number;
}

export class _MD2deletor {
    engine: _MD2engine;

    constructor(engine: _MD2engine) {
        this.engine = engine;
    }

    /**
     * 
     * @param type 
     * @param dx 
     * Takes the x-coordinate of the world position to delete
     * @param dy 
     * Takes the y-coordinate of the world position to delete
     * 
     * @description
     * Deletes a block or a part of it by taking a world position and the block type.
     * 
     * (A world position is the block's position divided by the block size)
     */
    deleteBlockByWorldPos(type: MDgameGridType, dx: number, dy: number): Success {
        const block = this.engine.levelManager.levelGrids[type].get(dx, dy);
        if(!block) return false;

        return this.deleteBlockByBlockAndWorldPos(block, dx, dy);
    }

    deleteBlockByBlockAndWorldPos(block: AnyBlock, dx: number, dy: number): Success {
        const [x, y] = block.getWorldGridPos();
        const [w, h] = block.getWorldGridSize();

        const output = greedyMeshGridFromBlockDeletion(block, dx, dy);

        const obj: DeletionObj = {
            arr: output,
            dx,
            dy,
            block,
        };

        switch(output.length) {
            case 0:
                this.deleteBlockEntirely(block);
                break;
            case 1:
                this.splitBlock(obj);
                break;
            default:
                this.splitBlock(obj);
                break;
        }

        return true;
    }

    private splitBlock(o: DeletionObj) {
        this.deleteBlockEntirely(o.block);
        
        for(const data of o.arr) {
            this.engine.generator.generateBlockFromData(data);
        }
    }

    deleteBlockEntirely(block: AnyBlock) {
        block.iterateWorldBounds((x, y) => {
            this.engine.levelManager.levelGrids[block.type].delete(x, y);
        });

        delete this.engine.levelManager.blockRecord[block.type][block.id];

        block.destroy();
    }
}