import { Ticker } from "pixi.js";
import { MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";
import { degToRad } from "../../../misc/util";

interface MD2rotatingComponentOpts {
    speed: number;
}

export class MD2rotatingComponent extends MD2componentModule {
    opts: MD2rotatingComponentOpts;
    speedInRad: number;
    
    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as MD2rotatingComponentOpts;

        this.speedInRad = degToRad(this.opts.speed);

        this.startRotation();
    }

    private onTick({deltaTime}: Ticker) {
        this.manager.block.sprite.rotation += this.speedInRad * deltaTime;
    }

    startRotation() {
        Ticker.shared.add(this.onTick, this);
    }
}