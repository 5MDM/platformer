import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { Entity } from "../entities/entity";
import { MDgameGridType, LevelJSONoutput, AnySprite } from "../types";
import { BlockComponentManager } from "./components/main-manager";

export type AnyBlock = FgBlock | BgBlock;

export interface XYWH {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface BasicBoxOpts extends XYWH {
    id: number;
}

interface BlockConstructorOpts extends BasicBoxOpts {
    name: string;
    rotation: number;
    //CL?: ComponentList;
    sprite: AnySprite;
    blockSize: number;
    isOversize: boolean;
}

interface FGblockConstructorOpts extends BlockConstructorOpts {
    components?: Record<string, Record<string, any>>;
    defaultComponents?: Record<string, Record<string, any>>;
}

export class BasicBox implements XYWH {
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

    lastX: number;
    lastY: number;

    container = new Container();

    constructor(o: BasicBoxOpts) {
        this.x = o.x;
        this.y = o.y;
        this.lastX = o.x;
        this.lastY = o.y;
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

    testAABB(o: BasicBox | {x: number, y: number, maxX: number, maxY: number}): boolean {
        // console.log(`${this.x} < ${o.maxX} 
        //     ${this.maxX} > ${o.x}
        //     ${this.y} < ${o.maxY}
        //     ${this.maxY} > ${o.y}`);
        return this.x < o.maxX
            && this.maxX > o.x
            && this.y < o.maxY
            && this.maxY > o.y;
    }

    protected iterateBoundsF(x: number, y: number, w: number, h: number, f: (x: number, y: number, lx: number, ly: number) => void) {
        for (let fy = y; fy < y + h; fy++) {
            for (let fx = x; fx < x + w; fx++) {
                f(fx, fy, fx - x, fy - y);
            }
        }
    }

    iterateBounds(f: (x: number, y: number, lx: number, ly: number) => void) {
        this.iterateBoundsF(this.x, this.y, this.w, this.h, f);
    }

    destroy() {
        this.container.destroy();
    }

    setLeft(n: number) {
        this.setX(this.x - n);
    }

    setRight(n: number) {
        this.setX(this.x + n);
    }

    setUp(n: number) {
        this.setY(this.y - n);
    }

    setDown(n: number) {
        this.setY(this.y + n);
    }

    setMove(x: number, y: number) {
        this.setRight(x);
        this.setUp(y);
    }
}

export abstract class Block extends BasicBox {
    readonly type: MDgameGridType = "bg";

    readonly name: string;
    readonly rotation: number; // degrees
    isOverlay: boolean = false;

    light: number = 0;

    readonly container = new Container();
    readonly sprite: AnySprite;

    static defaultLight = 4;

    isOversize = false;

    readonly blockSize: number;

    isDestroyed = false;

    updateLight(n: number) {
        if (n < 0 || 16 < n) return;

        this.light = n;
    }

    constructor(o: BlockConstructorOpts) {
        super(o);
        this.rotation = o.rotation;
        this.name = o.name;
        this.sprite = o.sprite;
        this.blockSize = o.blockSize;

        this.container.x -= this.blockSize / 2;

        this.container.addChild(this.sprite);

        this.isOversize = o.isOversize;

        this.updateLight(Block.defaultLight);
    }

    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.sprite.destroy();
        this.container.destroy({children: true});
    }

    toJSON(): LevelJSONoutput {
        return {
            x: this.x / this.blockSize,
            y: this.y / this.blockSize,
            w: this.w / this.blockSize,
            h: this.h / this.blockSize,
            rotation: this.rotation,
            type: this.name,
        };
    }

    static generateFromType(type: MDgameGridType, opts: BlockConstructorOpts): AnyBlock {
        if(type == "fg") {
            return new FgBlock(opts);
        }
        else if (type == "bg") return new BgBlock(opts);
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

    components: BlockComponentManager;

    constructor(o: FGblockConstructorOpts) {
        super(o);
        this.components = BlockComponentManager.fromObj(this, o.defaultComponents, o.components);
    }

    toJSON(): LevelJSONoutput {
        var isDefault = true;
        for(const name in this.components.components) {
            const opts = this.components.components[name].opts;

            for(const key in opts)
                if(opts[key] != this.components.defaultComponents[key]) isDefault = false;
        }

        if(this.components && !isDefault) {
            return {
                x: this.x / this.blockSize,
                y: this.y / this.blockSize,
                w: this.w / this.blockSize,
                h: this.h / this.blockSize,
                rotation: this.rotation,
                type: this.name,
                components: this.components.toJSON(),
            }
        } else return {
            x: this.x / this.blockSize,
            y: this.y / this.blockSize,
            w: this.w / this.blockSize,
            h: this.h / this.blockSize,
            rotation: this.rotation,
            type: this.name,
        };
    }
}

interface BgBlockConstructorOpts extends BlockConstructorOpts {
    isOverlay?: boolean;
}

export class BgBlock extends Block {
    readonly type: MDgameGridType = "bg";

    constructor(o: BgBlockConstructorOpts) {
        super(o);
        if (o.isOverlay) this.isOverlay = o.isOverlay;
    }
}
