import { ContinueCollisionResolution, MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";

interface MD2doorpointOpts {
    toLevel: string;
}

export class MD2doorpointComponent extends MD2componentModule {
    opts: MD2doorpointOpts;

    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2doorpointOpts;
    }

    onCollide(): ContinueCollisionResolution {
        MD2componentManager.md2.levelManager.destroyCurrentLevel()
        .then(() => {
            MD2componentManager.md2.levelManager.loadLevel(this.opts.toLevel);
        });

        return true;
    }
}