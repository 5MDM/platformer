import { ContinueCollisionResolution, MD2componentModule } from "../../../misc/components";
import { FgBlock } from "../blocks";
import { BlockComponentManager } from "./main-manager";

interface MD2doorpointOpts {
    toLevel: string;
    id: string;
    linkId: string;
}

export class MD2doorpointComponent extends MD2componentModule<FgBlock> {
    opts: MD2doorpointOpts;

    constructor(manager: BlockComponentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2doorpointOpts;

        BlockComponentManager.md2.levelManager.registerDoorpoint(this);
    }

    onCollide(): ContinueCollisionResolution {
        BlockComponentManager.md2.levelManager.destroyCurrentLevel()
        .then(() => {
            BlockComponentManager.md2.levelManager.activateDoorpoint(this);
        });

        return true;
    }
}