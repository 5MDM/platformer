import { MDshell } from "./shell";
import { BlockDefinition } from "./unit";

export class MDlevelGenerator<T extends Object> {
    private blockDefs: Record<string, BlockDefinition> = {};

    private generatorF: (o: T) => void;

    constructor(generatorF: (o: T) => void) {
        this.generatorF = generatorF;
    }

    setBlockDef(name: string, block: BlockDefinition) {
        this.blockDefs[name] = block;
    }

    getBlockDef(name: string): BlockDefinition | never {
        const o: BlockDefinition | undefined = this.blockDefs[name];
        
        if(!o) throw MDshell.Err(`Definition for block "${name}" not found`);

        return o;
    }

    generateBlock(o: T) {
        this.generatorF(o);
    }
}