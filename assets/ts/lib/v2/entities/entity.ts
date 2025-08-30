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

type MoveF = () => void;

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

    private static triggerMovement(type: keyof MovementObj) {
        for(const id in globalMovementEvents) {
            globalMovementEvents[id][type]();
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

    static moveUp() {
        PlayerControlledEntity.triggerMovement("up");
    }

    static moveLeft() {
        PlayerControlledEntity.triggerMovement("left");
    }

    static moveRight() {
        PlayerControlledEntity.triggerMovement("right");
    }

    static moveDown() {
        PlayerControlledEntity.triggerMovement("down");
    }

    constructor(o: EntityOpts) {
        super(o);

        this.setupMovement();
    }

    protected setupMovement() {
        globalMovementEvents[this.id] = {
            up: () => this.onUp(),
            left: () => this.onLeft(),
            right: () => this.onRight(),
            down: () => this.onDown(),
            notMoving: () => this.onNotMoving(),
        };
    }

    protected onNotMoving() {
        if(!this.lastAnimation) return;

        this.animations[this.lastAnimation]?.stop();
    }

    protected onUp() {
        this.wasMovingVert = true;
        this.wasMovingSide = false;
        this.lastMove = "up";
        this.vy -= this.defaultSpeed * PlayerControlledEntity.dt;
    }

    protected onLeft() {
        this.wasMovingVert = false;
        this.wasMovingSide = true;
        this.lastMove = "left";
        this.vx -= this.defaultSpeed * PlayerControlledEntity.dt;
    }

    protected onRight() {
        this.wasMovingVert = false;
        this.wasMovingSide = true;
        this.lastMove = "right";
        this.vx += this.defaultSpeed * PlayerControlledEntity.dt;
    }

    protected onDown() {
        this.wasMovingVert = true;
        this.wasMovingSide = false;
        this.lastMove = "down";
        this.vy += this.defaultSpeed * PlayerControlledEntity.dt;
    }

    destroy(): void {
        super.destroy();
        delete globalMovementEvents[this.id];
    }
}