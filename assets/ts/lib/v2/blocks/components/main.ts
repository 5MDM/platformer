import { NOOP } from "../../../misc/util";
import { _MD2engine } from "../../engine";
import { MD2componentManager } from "./main-manager";

export type ContinueCollisionResolution = boolean;

export type MD2componentObjType = Record<string, Record<string, any>>;

export class MD2componentModule {
    protected manager: MD2componentManager;

    opts: Record<string, any>;
    
    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        this.manager = manager;
        this.opts = opts;
    }

    onCollide(): ContinueCollisionResolution {
        return true;
    }

    init() {}

    onCollisionLeave() {}
}