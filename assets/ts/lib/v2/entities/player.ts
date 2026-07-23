import { Container, Texture } from "pixi.js";
import { EntityOpts, PlayerControlledEntity } from "./entity";
import { Gun4dir } from "./components/weapons/gun4dir";

interface PlayerOpts extends EntityOpts {
    view: Container;
}

export class Player extends PlayerControlledEntity {
    static HIW = innerWidth / 2;
    static HIH = innerHeight / 2;
    view: Container;

    defaultSpeed: number = .3;
    isPlayer = true;
    gun: Gun4dir;

    constructor(o: PlayerOpts) {
        super(o);
        this.view = o.view;

        const gun = new Gun4dir(
            this.components,
            {
                texture: "doorpoint.png",
                bounds: {
                    x: 0,
                    y: 10,
                    w: 32,
                    h: 32,
                },
                bulletSpeed: 8,
            }
        );

        this.gun = gun;

        this.components.setComponents({
            gun,
        });

        addEventListener("keydown", e => {
            if(e.key != "Shift"
            || e.location != 2) return;

            gun.fireMain();
        }, {passive: true});

        gun.setDirection("right");

        this.respondToResize();
    }

    tick(dt: number): void {
        this.gun.opts.bulletSpeed = Math.abs(this.fx) + 8;


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
        // this.gun.setDirection("up");
    }

    override lookUp(): void {
        this.gun.setDirection("up");
    }

    override lookDown() {
        this.gun.setDirection("down");
    }

    override onLeft(n: number) {
        super.onLeft(n);
        this.animController.setBasicAction("td-walk-l", true);
        this.gun.setDirection("left");
    }

    override onRight(n: number) {
        super.onRight(n);
        this.animController.setBasicAction("td-walk-r", true);
        this.gun.setDirection("right");
    }

    override onDown(n: number) {
        super.onDown(n);
        this.animController.setBasicAction("td-walk-d", true);
        this.gun.setDirection("down");
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