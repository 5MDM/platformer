import { ContinueCollisionResolution, MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";

interface MD2doorpointOpts {
    toLevel: string;
    id: string;
    linkId: string;
}

export class MD2doorpointComponent extends MD2componentModule {
    opts: MD2doorpointOpts;

    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2doorpointOpts;

        MD2componentManager.md2.levelManager.registerDoorpoint(this);
    }

    onCollide(): ContinueCollisionResolution {
        MD2componentManager.md2.levelManager.destroyCurrentLevel()
        .then(() => {
            MD2componentManager.md2.levelManager.activateDoorpoint(this);
        });

        return true;
    }
}