import { EventEmitter } from "pixi.js";
import { DragController } from "./drag";
import { $$, normalize } from "./util";

interface JoystickOpts {
    target: HTMLDivElement;
    size: number;
    max: number;
    innerColor: string;
    outerColor: string;
}

export type JostickXmovement = "left" | "right";
export type JoystickYmovement = "up" | "down";
export type Joystick4Movement = JostickXmovement | JoystickYmovement;
export type JoystickEvents = Joystick4Movement | "drag" | "reset" | "none";

export const joystickBitflags = {
    // isAtRest: 0,
    isLeft: 1 << 0,
    isRight: 1 << 1,
    isUp: 1 << 2,
    isDown: 1 << 3,
} as const;
const jb = joystickBitflags;

export const joystickBitflagCombinations = {
    isMoving: jb.isLeft | jb.isRight | jb.isUp | jb.isDown,
    isMovingHoriz: jb.isLeft | jb.isRight,
    isMovingVert: jb.isUp | jb.isDown,
} as const;
const jbm = joystickBitflagCombinations;

export class Joystick {  
    parent: HTMLDivElement;
    dc: DragController;  
    orb: HTMLDivElement;
    max: number;
    xdir: JostickXmovement | "none" = "none";
    ydir: JoystickYmovement | "none" = "none";

    constructor(opts: JoystickOpts) {
        this.max = opts.max;

        this.parent = $$("div", {
            style: {
                position: "relative",
                display: "flex",
                "background-color": opts.outerColor,
                width: opts.max + "px",
                height: opts.max + "px",
                "border-radius": opts.max + "px",
                "align-items": "center",
            }
        });

        this.orb = $$("div", {
            style: {
                "background-color": opts.innerColor,
                width: opts.size + "px",
                height: opts.size + "px",
                "border-radius": "20px",
                margin: "auto",
                position: "relative"
            }
        }) as HTMLDivElement;

        this.parent.appendChild(this.orb);
        opts.target.appendChild(this.parent);

        this.dc = new DragController({
            touchEl: document.documentElement,
            customDownElement: this.orb,
            isMultitouch: false,
        });

        this.init();
    }

    b: number = 0;

    private checkDir(x: number, y: number) {
        const maxR = (this.max / 2);
        
        if(x < -this.hw) {
            // left
            this.b &= ~jb.isRight;
            this.b |= jb.isLeft;

            this.xdir = "left";
            this.events.emit("left");
        } else if(x > this.hw) {
            // right
            this.b &= ~jb.isLeft;
            this.b |= jb.isRight;

            this.events.emit("right");
            this.xdir = "right";
        } else {
            this.b &= ~(jb.isLeft | jb.isRight);
            this.xdir = "none";
        }

        if(y < -this.hh) {
            // up
            this.b &= ~jb.isDown;
            this.b |= jb.isUp;

            this.ydir = "up";
            this.events.emit("up");
        } else if(y > this.hh) {
            // down
            this.b &= ~jb.isUp;
            this.b |= jb.isDown;

            this.events.emit("down");
            this.ydir = "down";
        } else {
            this.b &= ~(jb.isDown | jb.isUp);
            this.ydir = "none";
        }

        if(this.xdir == "none" && this.ydir == "none") 
            this.events.emit("none");

        const nx = normalize(-maxR, x, maxR) * 2 - 1;
        const ny = -(normalize(-maxR, y, maxR) * 2 - 1);
        this.directionX = nx;
        this.directionY = ny;
    }
    
    private setX(x: number) {
        this.orb.style.left = x + "px";
    }

    private setY(y: number) {
        this.orb.style.top = y + "px";
    }

    private set(x: number, y: number) {
        this.setX(x);
        this.setY(y);
    }

    og!: DOMRect;
    maxR: number = 0; // max radius
    hw: number = 0;
    hh: number = 0;
    centerX: number = 0;
    centerY: number = 0;
    x = 0;
    y = 0;

    private reset() {
        this.xdir = "none";
        this.ydir = "none";
        this.x = 0;
        this.y = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.set(0, 0);
        this.b &= ~jbm.isMoving;

        this.events.emit("reset");
    }

    private init() {
        const self = this;
        this.og = this.orb.getBoundingClientRect();
        const og = this.og;

        this.maxR = (self.max / 2);
        this.hw = og.width / 3;
        this.hh = og.height / 3;
        this.centerX = og.x + og.width / 2;
        this.centerY = og.y + og.height / 2;

        this.dc.onDrag = this.onDrag.bind(this);

        addEventListener("pointerup", this.reset.bind(this));
    }

    private onDrag(ddx: number, ddy: number, px: number, py: number): void {
        var x = px - this.centerX;
        var y = py - this.centerY;
        const xsq = x**2;
        const ysq = y**2;

        const r = Math.sqrt(xsq + ysq);
        const maxR = (this.max / 2);
        const d = r - maxR; // distance

        if(d > 0) {
            const θ = Math.asin(y / r) ?? 0;

            const sdx = d * Math.cos(θ);
            x -= sdx * Math.sign(x);

            const sdy = d * Math.sin(θ);
            y -= sdy;
        }

        this.set(x, y);
        this.checkDir(x, y);
        this.events.emit("drag");
    }

    directionX = 0;
    directionY = 0;

    events = new EventEmitter<JoystickEvents>();
}
