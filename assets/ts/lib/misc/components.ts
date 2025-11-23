import { Ticker } from "pixi.js";
import { _MD2engine } from "../v2/engine";

interface CMMopts<T> {
    target: T;
    defaultComponents: Record<string, Record<string, any>>;
}

export class CMM<T, ModuleType extends MD2componentModule<T>> {
    target: T;
    readonly defaultComponents: Record<string, Record<string, any>> = {};

    components: Record<string, ModuleType> = {};

    constructor(o: CMMopts<T>) {
        this.target = o.target;
        this.defaultComponents = o.defaultComponents;
    }

    static md2: _MD2engine;

    static setEngine(md2: _MD2engine) {
        CMM.md2 = md2;
    }

    setComponents(o?: Record<string, ModuleType>) {
        if (!o) return;
        this.components = o;
    }

    protected collisionArr: MD2componentModule<ModuleType>[] = [];

    onCollision(md2: _MD2engine): ContinueCollisionResolution {
        var CCR = true;

        for (const name in this.components)
            if (!this.components[name].onCollide(md2)) CCR = false;

        return CCR;
    }

    onCollisionLeave() {
        for (const name in this.components)
            this.components[name].onCollisionLeave();
    }

    toJSON(): Record<string, Record<string, any>> {
        const o: Record<string, Record<string, any>> = {};

        for (const name in this.components) {
            o[name] = this.components[name].opts;
        }

        return o;
    }

    onTick(dt: number) {
        for(const name in this.components) {
            const c = this.components[name];
            c.onTick(dt);
        }
    }
}

export type ContinueCollisionResolution = boolean;

export type MD2componentObjType = Record<string, Record<string, any>>;

export class MD2componentModule<T> {
    protected manager: CMM<T, MD2componentModule<T>>;

    opts: Record<string, any>;

    constructor(manager: CMM<T, MD2componentModule<T>>, opts: Record<string, any>) {
        this.manager = manager;
        this.opts = opts;
    }

    onCollide(engine: _MD2engine): ContinueCollisionResolution {
        return true;
    }

    init() {}

    onCollisionLeave() {}

    onTick(dt: number) {}
}

