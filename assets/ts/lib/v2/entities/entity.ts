import { AnimatedSprite, Sprite } from "pixi.js";
import { BasicBox, BasicBoxOpts } from "../blocks/blocks";
import { Success } from "../level";
import { _MD2errorManager } from "../errors";
import { AnimControl, AnimControlOpts } from "./anim";

export interface EntityOpts extends BasicBoxOpts {
    name: string;
    animOpts: AnimControlOpts;
}

export class Entity extends BasicBox {
    vx: number = 0;
    vy: number = 0;
    isPlayer = false;

    defaultSpeed: number = 2;
    animController: AnimControl;

    constructor(o: EntityOpts) {
        super(o);
        this.animController = new AnimControl(o.animOpts, this.container);
    }

    destroy() {
        this.animController.destroy();
    }
}

type MoveF = (n: number) => void;

interface MovementObj {
    up: MoveF;
    left: MoveF;
    right: MoveF;
    down: MoveF;
    notMoving: MoveF;
}

type Dir4 = "up" | "down" | "left" | "right" | "none";

const globalMovementEvents: Record<number, MovementObj> = {};

export class PlayerControlledEntity extends Entity {
    static dt: number = 1;

    private static triggerMovement(type: keyof MovementObj, n: number = 1) {
        for(const id in globalMovementEvents) {
            globalMovementEvents[id][type](Math.abs(n));
        }
    }

    wasMovingSide = false;
    wasMovingVert = false;
    lastMove: Dir4 = "none";

    static setDeltaTime(dt: number) {
        this.dt = Math.max(0.01, dt);
    }

    static notMoving() {
        PlayerControlledEntity.triggerMovement("notMoving");
    }

    static moveUp(n: number) {
        PlayerControlledEntity.triggerMovement("up", n);
    }

    static moveLeft(n: number) {
        PlayerControlledEntity.triggerMovement("left", n);
    }

    static moveRight(n: number) {
        PlayerControlledEntity.triggerMovement("right", n);
    }

    static moveDown(n: number) {
        PlayerControlledEntity.triggerMovement("down", n);
    }

    static move(x: number, y: number) {
        if(x == 0 && y == 0) return PlayerControlledEntity.notMoving();

        if(Math.abs(x) > Math.abs(y)) {
            if(y > 0) PlayerControlledEntity.triggerMovement("up", y);
            else PlayerControlledEntity.triggerMovement("down", y);

            if(x < 0) PlayerControlledEntity.triggerMovement("left", x);
            else PlayerControlledEntity.triggerMovement("right", x);
        } else {
            if(x < 0) PlayerControlledEntity.triggerMovement("left", x);
            else PlayerControlledEntity.triggerMovement("right", x);

            if(y > 0) PlayerControlledEntity.triggerMovement("up", y);
            else PlayerControlledEntity.triggerMovement("down", y);
        }
    }

    constructor(o: EntityOpts) {
        super(o);

        this.setupMovement();
    }

    protected setupMovement() {
        globalMovementEvents[this.id] = {
            up: n => this.onUp(n),
            left: n => this.onLeft(n),
            right: n => this.onRight(n),
            down: n => this.onDown(n),
            notMoving: n => this.onNotMoving(),
        };
    }

    protected onNotMoving() {
        this.animController.setAction("default");
    }

    protected onUp(n: number) {
        this.wasMovingVert = true;
        this.wasMovingSide = false;
        this.lastMove = "up";
        this.vy -= this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    protected onLeft(n: number) {
        this.wasMovingVert = false;
        this.wasMovingSide = true;
        this.lastMove = "left";
        this.vx -= this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    protected onRight(n: number) {
        this.wasMovingVert = false;
        this.wasMovingSide = true;
        this.lastMove = "right";
        this.vx += this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    protected onDown(n: number) {
        this.wasMovingVert = true;
        this.wasMovingSide = false;
        this.lastMove = "down";
        this.vy += this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    destroy(): void {
        super.destroy();
        delete globalMovementEvents[this.id];
    }
}