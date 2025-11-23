import { EventEmitter } from "pixi.js";
import { DragController } from "./drag";
import { $$, clamp, normalize, radToDeg } from "./util";

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

export class Joystick {  
    parent: HTMLDivElement;
    controller: DragController;  
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

        this.controller = new DragController({
            touchEl: document.documentElement,
            customDownElement: this.orb,
            isMultitouch: false,
        });

        this.init();
    }

    onDrag: () => void = () => undefined;
    onReset: () => void = () => undefined;

    private setX(x: number) {
        this.orb.style.left = x + "px";
    }

    private setY(y: number) {
        this.orb.style.top = y + "px";
    }

    private init() {
        var hasEnded = false;
        const self = this;
        const og = this.orb.getBoundingClientRect();
        const maxR = (self.max / 2);
        const hw = og.width / 3;
        const hh = og.height / 3;
        const centerX = og.x + og.width / 2;
        const centerY = og.y + og.height / 2;

        var x = 0;
        var y = 0;

        function drag(x: number, y: number) {
            const xsq = x**2;
            const ysq = y**2;

            const r = Math.sqrt(xsq + ysq);
            const d = r - maxR;

            if(d > 0) {
                const θ = Math.asin(y / r) ?? 0;

                const sdx = d * Math.cos(θ);
                x -= sdx * Math.sign(x);

                const sdy = d * Math.sin(θ);
                y -= sdy;
            }

            self.setX(x);
            self.setY(y);

            checkDir(x, y);
        }

        this.controller.onDrag = function(ddx: number, ddy: number, px, py) {
            if(hasEnded)
                return hasEnded = false;

            self.onDrag();

            self.events.emit("drag");

            return drag(px - centerX, py - centerY);
        };

        addEventListener("pointerup", reset);

        function reset() {
            hasEnded = true;
            self.xdir = "none";
            self.ydir = "none";
            x = 0;
            y = 0;
            self.directionX = 0;
            self.directionY = 0;
            self.orb.style.left = x + "px";
            self.orb.style.top = y + "px";
            self.events.emit("reset");
            self.onReset();
        }


        function checkDir(x: number, y: number) {
            if(x < -hw) {
                self.xdir = "left";
                self.events.emit("left");
            } else if(x > hw) {
                self.events.emit("right");
                self.xdir = "right";
            } else {
                self.xdir = "none";
            }

            if(y < -hh) {
                self.ydir = "up";
                self.events.emit("up");
            } else if(y > hh) {
                self.events.emit("down");
                self.ydir = "down";
            } else {
                self.ydir = "none";
            }

            if(self.xdir == "none" && self.ydir == "none") self.events.emit("none");

            const nx = normalize(-maxR, x, maxR) * 2 - 1;
            const ny = -(normalize(-maxR, y, maxR) * 2 - 1);
            self.directionX = nx;
            self.directionY = ny;
        }
    }

    directionX = 0;
    directionY = 0;

    events = new EventEmitter<JoystickEvents>();

    onMove: () => void = () => undefined;
}