import { CMM } from "../../../misc/components";
import { FgBlock } from "../blocks";
import { MD2collectComponent } from "./collect";
import { MD2doorComponent } from "./door";
import { MD2doorpointComponent } from "./doorpoint";
import { MD2gateComponent } from "./gate";
import { MD2glowComponent } from "./glow";
import { MD2componentModule } from "../../../misc/components";
import { MD2rotatingComponent } from "./rotating";

export class BlockComponentManager extends CMM<FgBlock, MD2componentModule<FgBlock>> {
    block: FgBlock;
    enableCollisionLeave() {
        this.block.hasCollisionLeaveEvents = true;
    }

    disableCollisionLeave() {
        this.block.hasCollisionLeaveEvents = false;
    }

    constructor(fgBlock: FgBlock, defaultComponents: Record<string, Record<string, any>> = {}) {
        super({
            target: fgBlock,
            defaultComponents,
        });
        this.block = fgBlock;
    }

    static componentList: Record<string, typeof MD2componentModule<FgBlock>> = {
        door: MD2doorComponent,
        doorpoint: MD2doorpointComponent,
        rotating: MD2rotatingComponent,
        glow: MD2glowComponent,
        collect: MD2collectComponent,
        gate: MD2gateComponent,
    };

    static fromObj(
        block: FgBlock,
        def?: Record<string, Record<string, any>>, 
        o?: Record<string, Record<string, any>>
    ): BlockComponentManager {
        const compiledList: Record<string, MD2componentModule<FgBlock>> = {};
        const manager = new BlockComponentManager(block, def);

        for(const name in o) {
            if(!BlockComponentManager.componentList[name]) continue;

            compiledList[name] = new (BlockComponentManager.componentList[name])(manager, o[name]);
            compiledList[name].init();
        }

        manager.setComponents(compiledList);

        return manager;
    }

    restartComponents() {
        for(const name in this.components) {
            this.components[name] = new (BlockComponentManager.componentList[name])(this, this.components[name].opts);
            this.components[name].init();
        }
    }
}
