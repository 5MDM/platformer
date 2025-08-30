import { GMOutput, Keymap } from "../misc/keymap";
import { PWS } from "../physics/objects";
import { MDmatrix } from "../misc/matrix";
import { LevelJSONoutput, MDshell } from "../md-framework/shell";
import { Sprite, TilingSprite } from "pixi.js";
import { MDgameGridType } from "./game";
import { radToDeg } from "../misc/util";
import { ComponentList, ComponentName, ComponentValue } from "./block-components/parser";

interface BgUnitObj {
    shell: MDshell;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    name: string;
    isOverlay?: boolean;
    id: number;
}

interface FgUnitObj extends BgUnitObj {
    components?: ComponentList;
    pws: PWS;
}

export type Block = FgBlock | BgBlock;

export interface BlockDefinition {
    name: string; // this is the texture
    type: MDgameGridType;
    displayName: string;
    components?: ComponentList;
}

export class BgBlock implements BlockDefinition {
    shell: MDshell;
    x: number;
    y: number;
    w: number;
    h: number;
    id: number;
    rotation: number;
    name: string;
    sprite?: Sprite | TilingSprite;

    isOverlay = false;
    type: MDgameGridType = "bg";
    displayName = "idk";

    constructor(o: BgUnitObj) {
        this.shell = o.shell;
        this.x = o.x;
        this.y = o.y;
        this.w = o.w;
        this.h = o.h;
        this.rotation = o.rotation;
        this.name = o.name;
        this.id = o.id;
        if(o.isOverlay) {
            this.isOverlay = o.isOverlay;
            this.type = "overlay";
        }
    }

    toJSON(): LevelJSONoutput {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            rotation: radToDeg(this.rotation),
            type: this.name,
        }
    }

    destroy() {
        delete this.shell.game.blocks[this.type][this.id];

        this.name = "";
        this.sprite?.destroy();
    }

    isInBounds(x: number, y: number): boolean {
        return x < this.x + this.w
        && x >= this.x
        && y < this.y + this.h
        && y >= this.y;
    }

    deletePart(x: number, y: number): void {
        if(!this.isInBounds(x, y)) return;

        const matrix = MDmatrix.GenerateFromBounds<true>(this.w, this.h, true);
        matrix.delete(x - this.x, y - this.y);

        if(matrix.checkIfEMpty()) {
            this.destroy();
            this.shell.game.grids[this.type].delete(x, y);
            delete this.shell.game.blocks[this.type][this.id];
        } else {
            const output: GMOutput[] = Keymap.GMBool(matrix.matrix, this.name);
            this.shell.game.grids[this.type].delete(x, y);
            //console.log("split into " + output.length + " parts");
            // x: 0, w: 5
            // x: 1. w: 4

            for(const i of output) {
                i.x += this.x;
                i.y += this.y;
            }

            if(output.length == 1) this.shrink(output[0]);
            else this.split(x, y, output);
        }
    }

    protected shrink(o: GMOutput) {
        if(this.sprite) {
            this.sprite.x += (o.x - this.x) * this.shell.blockSize;
            this.sprite.y += (o.y - this.y) * this.shell.blockSize;
            this.sprite.width = o.w * this.shell.blockSize;
            this.sprite.height = o.h * this.shell.blockSize;
        }

        this.x = o.x;
        this.y = o.y;
        this.w = o.w;
        this.h = o.h;
    }

    protected split(x: number, y: number, arr: GMOutput[]) {
        //this.destroy();
        //const grid = this.shell.game.grids[this.type] as MDmatrix<BgBlock>;

        for(const {x, y, w, h} of arr) {
            this.shell.createBlock({
                x,
                y,
                w,
                h,
                rotation: this.rotation,
                name: this.name,
            });
        }

        this.destroy();
    }
}

export class FgBlock extends BgBlock {
    components?: ComponentList;
    hasCustomComponents = false;
    isOverlay = false;
    pws: PWS;
    type: MDgameGridType = "fg";

    constructor(o: FgUnitObj) {
        super(o);
        this.components = o.components;

        this.pws = o.pws;
        this.sprite = o.pws.sprite;
    }

    destroy() {
        super.destroy();
        this.pws.destroy();
        delete this.components;
    }

    deletePart(x: number, y: number): void {
        if(!this.isInBounds(x, y)) return;

        const matrix = MDmatrix.GenerateFromBounds<true>(this.w, this.h, true);
        matrix.delete(x - this.x, y - this.y);

        this.shell.pw.removeStatic(x, y);

        if(matrix.checkIfEMpty()) {
            this.destroy();
            this.shell.game.grids[this.type].delete(x, y);
            delete this.shell.game.blocks[this.type][this.id];
        } else {
            const output: GMOutput[] = Keymap.GMBool(matrix.matrix, this.name);
            this.shell.game.grids[this.type].delete(x, y);

            for(const i of output) {
                i.x += this.x;
                i.y += this.y;
            }

            if(output.length == 1) {
                this.shrink(output[0]);
            }
            else this.split(x, y, output);
        }
    }

    protected shrink(o: GMOutput): void {
        if(!this.sprite) this.sprite = this.pws.sprite;
        this.pws.setX(o.x * this.shell.blockSize);
        this.pws.setY(o.y * this.shell.blockSize);
        this.pws.setW(o.w * this.shell.blockSize);
        this.pws.setH(o.h * this.shell.blockSize);
        super.shrink(o);
    }

    protected split(x: number, y: number, arr: GMOutput[]) {
        for(const {x, y, w, h} of arr) {
            this.shell.createBlock({
                x,
                y,
                w,
                h,
                rotation: this.rotation,
                name: this.name,
            });
        }

        this.destroy();
    }

    addComponents(o: ComponentList) {
        this.hasCustomComponents = true;
        for(const name in o) {
            this.setComponent(name as ComponentName, o[name as ComponentName] as ComponentValue);
        }
    }

    setComponent(name: ComponentName, val: ComponentValue) {
        this.hasCustomComponents = true;
        if(!this.components) this.components = {};
        this.components[name] = val;
    }

    toJSON(): LevelJSONoutput {
        const o = super.toJSON();
        if(this.components) o.components = this.components;

        return o;
    }

    updateComponents(componentParser: () => void) {
        this.pws.hasCollisionLeaveEvents = false;
        this.pws.onCollisionLeave = [];
        this.pws.onCollide = [];

        if(!this.components) return;

        componentParser();
    }
}