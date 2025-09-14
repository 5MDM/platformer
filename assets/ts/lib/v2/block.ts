import { Container, ContainerChild, Sprite } from "pixi.js";
import { radToDeg } from "../misc/util";
import { Entity } from "./entities/entity";
import { LevelJSONoutput, MDgameGridType } from "./types";

export type AnyBlock = FgBlock | BgBlock;

export interface BasicBoxOpts {
    x: number;
    y: number;
    w: number;
    h: number;
    id: number;
}

interface BlockConstructorOpts extends BasicBoxOpts {
    name: string;
    rotation: number;
    //CL?: ComponentList;
    sprite: Container;
    blockSize: number;
    isOversize: boolean;
}

export class BasicBox {
    cx: number;
    cy: number;
    x: number;
    y: number;
    maxX: number;
    maxY: number;
    w: number;
    h: number;
    halfW: number;
    halfH: number;
    readonly id: number;

    container = new Container();

    constructor(o: BasicBoxOpts) {
        this.x = o.x;
        this.y = o.y;
        this.container.x = o.x;
        this.container.y = o.y;
        this.w = o.w;
        this.h = o.h;
        this.maxX = o.x + o.w;
        this.maxY = o.y + o.h;
        this.halfW = o.w / 2;
        this.halfH = o.h / 2;
        this.cx = this.x + this.halfW;
        this.cy = this.y + this.halfH;
        this.id = o.id;
    }

    setX(x: number) {
        this.x = x;
        this.cx = this.x + this.halfW;
        this.maxX = this.x + this.w;
        this.container.x = x;
    }

    setY(y: number) {
        this.y = y;
        this.cy = this.y + this.halfH;
        this.maxY = this.y + this.h;
        this.container.y = y;
    }

    testAABB(o: BasicBox): boolean {
        // console.log(`${this.x} < ${o.maxX} 
        //     ${this.maxX} > ${o.x}
        //     ${this.y} < ${o.maxY}
        //     ${this.maxY} > ${o.y}`);
        return this.x < o.maxX
            && this.maxX > o.x
            && this.y < o.maxY
            && this.maxY > o.y;
    }

    protected iterateBoundsF
    (x: number, y: number, w: number, h: number, f: (x: number, y: number, lx: number, ly: number) => void) {
        for(let fy = y; fy < y + h; fy++) {
            for(let fx = x; fx < x + w; fx++) {
                f(fx, fy, fx - x, fy - y);
            }
        }
    }

    iterateBounds(f: (x: number, y: number, lx: number, ly: number) => void) {
        this.iterateBoundsF(this.x, this.y, this.w, this.h, f);
    }
}

export abstract class Block extends BasicBox {
    readonly type: MDgameGridType = "bg";

    readonly name: string;
    readonly rotation: number; // degrees
    isOverlay: boolean = false;

    readonly container = new Container();
    readonly sprite: Container;

    //CL?: ComponentList;

    isOversize = false;

    readonly blockSize: number;

    isDestroyed = false;

    constructor(o: BlockConstructorOpts) {
        super(o);
        this.rotation = o.rotation;
        this.name = o.name;
        this.sprite = o.sprite;
        this.blockSize = o.blockSize;

        this.container.x -= this.blockSize / 2;

        this.container.addChild(this.sprite);

        //this.CL = o.CL;
        this.isOversize = o.isOversize;
    }

    destroy() {
        if(this.isDestroyed) return;
        this.isDestroyed = true;
        this.sprite.destroy();
    }

    toJSON(): LevelJSONoutput {
        return {
            x: this.x / this.blockSize,
            y: this.y / this.blockSize,
            w: this.w / this.blockSize,
            h: this.h / this.blockSize,
            rotation: this.rotation,
            type: this.name,
        }
    }

    static generateFromType(type: MDgameGridType, opts: BlockConstructorOpts): AnyBlock {
        if(type == "fg") return new FgBlock(opts);
        else if(type == "bg") return new BgBlock(opts);
        else return new BgBlock(opts);
    }

    getWorldGridPos(): [number, number] {
        return [
            Math.round(this.x / this.blockSize),
            Math.round(this.y / this.blockSize),
        ];
    }

    getWorldGridSize(): [number, number] {
        return [
            Math.round(this.w / this.blockSize),
            Math.round(this.h / this.blockSize),
        ];
    }

    iterateWorldBounds(f: (x: number, y: number, lx: number, ly: number) => void) {
        this.iterateBoundsF(...this.getWorldGridPos(), ...this.getWorldGridSize(), f);
    }
}

export class FgBlock extends Block {
    readonly type: MDgameGridType = "fg";

    hasCollisionLeaveEvents: boolean = false;
    hasCollidedRecently: boolean = false;
    events: {
        onCollide: ((col: Entity) => void | true)[];
    } = {
        onCollide: [],
    };
}

interface BgBlockConstructorOpts extends BlockConstructorOpts {
    isOverlay?: boolean;
}

export class BgBlock extends Block {
    readonly type: MDgameGridType = "bg";

    constructor(o: BgBlockConstructorOpts) {
        super(o);
        if(o.isOverlay) this.isOverlay = o.isOverlay;
    }
}