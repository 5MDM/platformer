import { Ticker } from "pixi.js";
import { MD2componentModule } from "../../../misc/components";
import { degToRad } from "../../../misc/util";
import { FgBlock } from "../blocks";
import { BlockComponentManager } from "./main-manager";

interface MD2rotatingComponentOpts {
    speed: number;
}

export class MD2rotatingComponent extends MD2componentModule<FgBlock> {
    opts: MD2rotatingComponentOpts;
    speedInRad: number;
    
    constructor(manager: BlockComponentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2rotatingComponentOpts;

        this.speedInRad = degToRad(this.opts.speed);

        this.startRotation();
    }

    private tick({deltaTime}: Ticker) {
        this.manager.target.sprite.rotation += this.speedInRad * deltaTime;
    }

    startRotation() {
        Ticker.shared.add(this.tick, this);
    }
}