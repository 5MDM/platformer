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

        Player.HIW = innerWidth / 2;
        Player.HIH = innerHeight / 2;
        this.view.position.set(Player.HIW, Player.HIH);
        this.container.position.set(Player.HIW, Player.HIH);
    }

    override setX(x: number) {
        this.x = x;
        this.cx = this.x + this.halfW;
        this.maxX = this.x + this.w;
        this.view.x = Player.HIW-x;
    }

    override setY(y: number) {
        this.y = y;
        this.cy = this.y + this.halfH;
        this.maxY = this.y + this.h;
        this.view.y = Player.HIH-y;
    }

    protected override onUp() {
        super.onUp();
        this.changeStance("walk-ud-up");
    }

    protected override onLeft() {
        super.onLeft();
        this.changeStance("walk-l");
    }

    protected override onRight() {
        super.onRight();
        this.changeStance("walk-r");
    }

    protected override onDown() {
        super.onDown();
        this.changeStance("walk-ud-down");
    }

    protected override onNotMoving(): void {
        switch(this.lastMove) {
            case "up":
                this.changeStance("stand-ud-up");
                break;
            default:
                this.changeStance("stand-ud-down");
                break;
        }
    }
}