import { BlockCreationOpts, LevelJSONoutput, MDshell } from "../md-framework/shell";
import { BlockDefinition } from "./unit";

export interface BackgroundOpts {
    name: string;
}

export interface LevelData {
    version: [number, number, number];
    blocks: LevelJSONoutput[];
    background?: BackgroundOpts;
}

export class MDlevelGenerator {
    private blockDefs: Record<string, BlockDefinition> = {};

    private generatorF: (o: BlockCreationOpts) => void;

    backgroundF: (o: BackgroundOpts) => void;

    shell: MDshell;

    constructor
    (shell: MDshell, generatorF: (o: BlockCreationOpts) => void, backgroundF: (o: BackgroundOpts) => void) {
        this.generatorF = generatorF;
        this.backgroundF = backgroundF;
        this.shell = shell;
    }

    setBlockDef(name: string, block: BlockDefinition) {
        this.blockDefs[name] = block;
    }

    getBlockDef(name: string): BlockDefinition | never {
        const o: BlockDefinition | undefined = this.blockDefs[name];
        
        if(!o) throw MDshell.Err(`Definition for block "${name}" not found`);

        return o;
    }

    generateBlock(o: BlockCreationOpts) {
        this.generatorF(o);
    }

    getLevelData(): LevelData {
        const arr: LevelJSONoutput[] = [];
        
        this.shell.game.iterateFGblocks(block => arr.push(block.toJSON()));

        this.shell.game.iterateBGblocks(block => arr.push(block.toJSON()));

        this.shell.game.iterateOverlayblocks(block => arr.push(block.toJSON()));

        const output: LevelData = {
            version: [0, 0, 0],
            blocks: arr,
        };

        if(this.shell.backgroundTextureName) output.background = {name: this.shell.backgroundTextureName};

        return output;
    }

    generateLevelFromData(data: LevelData) {
        for(const block of data.blocks) {
            this.generateBlock({
                name: block.type,
                rotation: block.rotation,
                x: block.x,
                y: block.y,
                w: block.w,
                h: block.h,
                components: block.components,
            });
        }

        if(data.background) this.backgroundF(data.background);
    }
}