import { _MD2engine } from "../../engine";
import { createMD2t } from "../../modules/text/md2t-parser";
import { ContinueCollisionResolution, MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";

interface CollectComponentOpts {
    item: string;
}

export class MD2collectComponent extends MD2componentModule {
    constructor(manager: MD2componentManager, opts: CollectComponentOpts) {
        super(manager, opts);

        this.opts = opts as CollectComponentOpts;
    }

    onCollide(md2: _MD2engine): ContinueCollisionResolution {
        //md2.modules.gui.parts.inventory.addItem(this.opts.item);
        md2.dataManager.addItem(this.opts.item);
        
        md2.deletor.deleteBlockEntirely(this.manager.block);
        this.manager.block.destroy();

        md2.modules.text.showTitle(createMD2t([
            {
                text: "Collected: ",
            },
            {
                text: this.opts.item,
                color: "red"
            }
        ]), 2000);

        return true;
    }
}