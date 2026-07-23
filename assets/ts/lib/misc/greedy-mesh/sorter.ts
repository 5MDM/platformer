import { BgBlock } from "../../v2/blocks/blocks";
import { Success } from "../../v2/level";
import { Stop, XYWH, XYWHR } from "../../v2/types";
import { MDmatrix } from "../matrix";
import { MDV } from "../vectors/vectors";
import { greedyMeshStrings } from "./greedy-mesh";

export type NameAndDegreeRecord<T> = Record<string, Record<number, T>>;

export class SimpleNameAndRotationGreedyMeshFilter {
    readonly size: MDV.V2;
    record: NameAndDegreeRecord<MDmatrix<true>> = {};

    constructor(size: MDV.V2) {
        this.size = size;
    }

    private checkAndAddName(name: string) {
        if(!this.record[name]) 
            this.record[name] = {};
    }

    private checkNameAndAddDegrees(name: string, degrees: number) {
        const o = this.record[name];
        if(!o[degrees]) o[degrees] = new MDmatrix<true>(this.size.x, this.size.y);
    }

    add(name: string, degrees: number, pos: MDV.V2) {
        this.checkAndAddName(name);
        this.checkNameAndAddDegrees(name, degrees);

        this.record[name][degrees].set(pos.x, pos.y, true);
    }

    clear() {
        this.record = {};
    }
}

export class NameAndRotationStringGreedyMeshMap {
    readonly size: MDV.V2;
    readonly map: MDmatrix<string>;
    readonly delimeter = ",";

    constructor(size: MDV.V2) {
        this.size = size;
        this.map = new MDmatrix<string>(size.x, size.y);
    }

    private delimeterList(...args: string[]): string {
        return args.join(this.delimeter);
    }

    /**
     * @returns a string that is the name with the rotation.  
     * Return examples: "cool-block,90" or "spike-block,270"
     */
    createNameHash(name: string, rotation: number): string {
        return this.delimeterList(name, rotation.toString());
    }

    extractHash(str: string): [string, number] {
        const [name, rotation] = str.split(this.delimeter);
        return [name, Number(rotation)];
    }

    /**
     * @description sets the has at the position if it's not out of bounds
     */
    add(hash: string, pos: MDV.V2): Success {
        if(this.map.isOOB(pos.x, pos.y)) return false;
        this.map.set(pos.x, pos.y, hash);

        return true;
    }

    greedyMesh(): Record<string, XYWHR[]> {
        const o = greedyMeshStrings(this.map);
        const output: Record<string, XYWHR[]> = {};

        for(const hash in o) {
            const [name, rotation] = this.extractHash(hash);
            const arr: XYWH[] = o[hash];

            for(const bounds of arr) {
                if(!output[name]) output[name] = [];

                output[name].push({
                    ...bounds,
                    rotation,
                });
            }
        }

        return output;
    }

    static iterateRecord(r: Record<string, XYWHR[]>, f: (name: string, bounds: XYWHR) => Stop | void) {
        for(const name in r) {
            const arr = r[name];

            for(const bounds of arr) {
                if(f(name, bounds)) return;
            }
        }
    }

    clear() {
        this.map.clear();
    }
}