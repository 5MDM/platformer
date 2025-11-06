import { _MD2engine } from "../../engine";
import { FgBlock } from "../blocks";
import { MD2collectComponent } from "./collect";
import { MD2doorComponent } from "./door";
import { MD2doorpointComponent } from "./doorpoint";
import { MD2glowComponent } from "./glow";
import { ContinueCollisionResolution, MD2componentModule } from "./main";
import { MD2rotatingComponent } from "./rotating";

export class MD2componentManager {
    block: FgBlock;
    enableCollisionLeave() {
        this.block.hasCollisionLeaveEvents = true;
    }

    constructor(fgBlock: FgBlock, defaultComponent: Record<string, Record<string, any>> = {}) {
        this.block = fgBlock;
        this.defaultComponents = defaultComponent;
    }

    static componentList: Record<string, typeof MD2componentModule> = {
        door: MD2doorComponent,
        doorpoint: MD2doorpointComponent,
        rotating: MD2rotatingComponent,
        glow: MD2glowComponent,
        collect: MD2collectComponent,
    };

    static md2: _MD2engine;

    static setEngine(md2: _MD2engine) {
        MD2componentManager.md2 = md2;
    }

    static fromObj(
        block: FgBlock,
        def?: Record<string, Record<string, any>>, 
        o?: Record<string, Record<string, any>>
    ): MD2componentManager {
        const compiledList: Record<string, MD2componentModule> = {};
        const manager = new MD2componentManager(block, def);

        for(const name in o) {
            if(!MD2componentManager.componentList[name]) continue;

            compiledList[name] = new (MD2componentManager.componentList[name])(manager, o[name]);
            compiledList[name].init();
        }

        manager.setComponents(compiledList);

        return manager;
    }

    components: Record<string, MD2componentModule> = {};
    readonly defaultComponents: Record<string, Record<string, any>>;

    setComponents(o?: Record<string, MD2componentModule>) {
        if(!o) return;
        this.components = o;
    }

    protected collisionArr: MD2componentModule[] = [];

    onCollision(md2: _MD2engine): ContinueCollisionResolution {
        var CCR = true;

        for(const name in this.components) 
            if(!this.components[name].onCollide(md2)) CCR = false;

        return CCR;
    }

    onCollisionLeave() {
        for(const name in this.components) 
            this.components[name].onCollisionLeave();
    }

    restartComponents() {
        for(const name in this.components) {
            this.components[name] = new (MD2componentManager.componentList[name])(this, this.components[name].opts);
            this.components[name].init();
        }
    }

    toJSON(): Record<string, Record<string, any>> {
        const o: Record<string, Record<string, any>> = {};

        for(const name in this.components) {
            o[name] = this.components[name].opts;
        }

        return o;
    }
}
