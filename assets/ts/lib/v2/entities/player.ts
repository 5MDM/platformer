import { Container } from "pixi.js";
import { EntityOpts, PlayerControlledEntity } from "./entity";

interface PlayerOpts extends EntityOpts {
    view: Container;
}

export class Player extends PlayerControlledEntity {
    static HIW = innerWidth / 2;
    static HIH = innerHeight / 2;
    view: Container;

    defaultSpeed: number = .3;
    isPlayer = true;

    constructor(o: PlayerOpts) {
        super(o);
        this.view = o.view;

        this.respondToResize();
    }

    respondToResize() {
        const chw = innerWidth / 2;
        const chh = innerHeight / 2;

        if(chw == Player.HIW
        && chh == Player.HIH
        ) {
            this.view.position.set(Player.HIW, Player.HIH);
            this.container.position.set(Player.HIW, Player.HIH);
            return;
        }

        this.view.x -= (Player.HIW - chw);
        this.view.y -= (Player.HIH - chh);

        this.container.x -= (Player.HIW - chw);
        this.container.y -= (Player.HIH - chh);
        
        Player.HIW = chw;
        Player.HIH = chh;
    }

    override setX(x: number) {
        this.lastX = this.x;
        this.x = x;
        this.cx = this.x + this.halfW;
        this.maxX = this.x + this.w;
        this.view.x = Player.HIW - x;
    }

    override setY(y: number) {
        this.lastY = this.y;
        this.y = y;
        this.cy = this.y + this.halfH;
        this.maxY = this.y + this.h;
        this.view.y = Player.HIH-y;
    }

    override onUp(n: number) {
        super.onUp(n);
        this.animController.setBasicAction("td-walk-u", true);
    }

    override onLeft(n: number) {
        super.onLeft(n);
        this.animController.setBasicAction("td-walk-l", true);
    }

    override onRight(n: number) {
        super.onRight(n);
        this.animController.setBasicAction("td-walk-r", true);
    }

    override onDown(n: number) {
        super.onDown(n);
        this.animController.setBasicAction("td-walk-d", true);
    }

    override onNotMoving(): void {
        switch(this.lastMove) {
            case "up":
                this.animController.setBasicAction("td-stand-u");
                break;
            default:
                this.animController.setBasicAction("td-stand-d");
                break;
        }
    }
}