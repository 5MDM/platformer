import { AnimatedSprite, Sprite } from "pixi.js";
import { BasicBox, BasicBoxOpts } from "../block";
import { Success } from "../level";
import { _MD2errorManager } from "../errors";

export interface EntityOpts extends BasicBoxOpts {
    
}

export class Entity extends BasicBox {
    vx: number = 0;
    vy: number = 0;
    isPlayer = false;

    defaultSpeed: number = 2;

    animations: Record<string, AnimatedSprite> = {};
    sprites: Record<string, Sprite> = {};

    currentStance: string = "default";

    lastAnimation?: string;
    lastSprite?: string;

    constructor(o: EntityOpts) {
        super(o);
    }

    setAnimation(name: string, s: AnimatedSprite) {
        s.visible = false;
        this.animations[name] = s;
        this.container.addChild(s);
    }

    setSprite(name: string, s: Sprite) {
        s.visible = false;
        this.sprites[name] = s;
        this.container.addChild(s);
    }

    changeStance(name: string, speed: number = .08): Success {
        const animation = this.animations[name];
        const sprite = this.sprites[name];
        if(animation) this.playAnimation(name, speed);
        else if(sprite) this.playSprite(name);
        else {
            _MD2errorManager.entityStanceNotFound(name);
            return false;
        }

        return true;
    }

    private beforeImageChange(name: string) {
        if (this.currentStance == name) return;
        this.currentStance = name;

        if(this.lastAnimation) {
            this.animations[this.lastAnimation].visible = false;
            this.animations[this.lastAnimation].stop();
            this.lastAnimation = undefined;
        }
        if (this.lastSprite) {
            this.sprites[this.lastSprite].visible = false;
            this.lastSprite = undefined;
        }
    }

    private playAnimation(name: string, speed: number) {
        const animation = this.animations[name];
        animation.animationSpeed = speed;
        this.beforeImageChange(name);

        this.lastAnimation = name;
        animation.visible = true;
        animation.play();
    }

    private playSprite(name: string) {
        this.beforeImageChange(name);

        this.lastSprite = name;
        this.sprites[name].visible = true;
    }

    destroy() {
        for(const name in this.animations) {
            this.animations[name].destroy();
            delete this.animations[name];
        }

        for(const name in this.sprites) {
            this.animations[name].destroy();
            delete this.animations[name];
        }

        this.lastSprite = undefined;
        this.lastAnimation = undefined;
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
        if(!this.lastAnimation) return;

        this.animations[this.lastAnimation]?.stop();
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