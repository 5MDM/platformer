import { clamp } from "../../misc/util";
import { BasicBox, BasicBoxOpts } from "../blocks/blocks";
import { _MD2errorManager } from "../errors";
import { AnimControl, AnimControlOpts } from "./anim";
import { MD2entityComponentManager } from "./components/main";

export interface EntityOpts extends BasicBoxOpts {
    name: string;
    animOpts: AnimControlOpts;
    defaultComponents?: Record<string, Record<string, any>>;
}

export class Entity extends BasicBox {
    canJump = true;
    vx: number = 0;
    vy: number = 0;
    fx = 0;
    fy = 0;

    thisFrame = {
        hitFloor: false,
        hitCeiling: false,
        hitLeft: false,
        hitRight: false,
        reset() {
            this.hitCeiling = false;
            this.hitFloor = false;
            this.hitLeft = false;
            this.hitRight = false;
        }
    };

    isPlayer = false;
    qw: number;

    components: MD2entityComponentManager;

    defaultSpeed: number = 2;
    animController: AnimControl;

    constructor(o: EntityOpts) {
        super(o);
        this.qw = this.halfW / 2;
        this.components = new MD2entityComponentManager(this, o.defaultComponents || {});
        this.animController = new AnimControl(o.animOpts, this.container);
    }

    tick(dt: number) {
        this.components.onTick(dt);
    }

    destroy() {
        this.animController.destroy();
    }

    isStandingOn(o: BasicBox): boolean {
        return o.testAABB({
            x: this.x + this.w / 4,
            y: this.y + this.h / 2,
            maxX: this.maxX - this.w / 2,
            maxY: this.maxY
        });
    }

    resetJump() {
        this.jumpTime = 0;
        this.canJump = true;
    }

    addFx(n: number) {
        this.fx += n;
    }

    addFy(n: number) {
        this.fy += n;
    }

    moveLeft(n: number) {this.addFx(-n)}
    moveRight(n: number) {this.addFx(n)}
    moveDown(n: number) {this.addFy(n)}
    moveUp(n: number) {this.addFy(-n)}

    isJumping = false;
    jumpTime = 0;
    maxJumpTime = 10;

    applyGravity(x: number, y: number) {
        this.setX(this.x - x);
        this.setY(this.y + y);
    }
}

type Dir4 = "up" | "down" | "left" | "right" | "none";

export class PlayerControlledEntity extends Entity {
    static dt: number = 1;

    static setDeltaTime(dt: number) {
        this.dt = Math.max(0.01, dt);
    }

    lastMove: Dir4 = "none";

    move(x: number, y: number) {
        if(x == 0 && y == 0) return this.onNotMoving();

        if(Math.abs(x) > Math.abs(y)) {

            if(y > 0) this.onUp(y);
            else this.onDown(-y);

            if(x < 0) this.onLeft(-x);
            else this.onRight(x);

        } else {
            if(x < 0) this.onLeft(-x);
            else this.onRight(x);

            if(y > 0) this.onUp(y);
            else this.onDown(-y);
        }
    }

    constructor(o: EntityOpts) {
        super(o);
    }

    jumpBreak() {
        this.canJump = false;
    }

    onNotMoving() {
        this.animController.setAction("default");
    }

    onUp(n: number) {
        this.fy -= this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    maxJumpTime: number = 30;

    onJump(power: number) {
        if(!this.canJump) return;

        if(this.jumpTime >= this.maxJumpTime) {
            this.canJump = false;
            this.jumpTime = 0;
            return;
        }

        this.isJumping = true;
        this.jumpTime += 1;

        const tt = 1 - (this.maxJumpTime - this.jumpTime) / this.maxJumpTime;

        const smoothing = (power - .05) * tt;

        const finalPower = clamp(0, power - smoothing, power) * PlayerControlledEntity.dt;

        //console.log(finalPower);

        this.fy -= finalPower;
    }

    onLeft(n: number) {
        this.fx -= this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    onRight(n: number) {
        this.fx += this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    onDown(n: number) {
        this.fy += this.defaultSpeed * PlayerControlledEntity.dt * n;
    }

    destroy(): void {
        super.destroy();
    }
}

