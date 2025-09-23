import { DragController } from "./drag";
import { $$, clamp, normalize } from "./util";

interface JoystickOpts {
    target: HTMLDivElement;
    size: number;
    max: number;
    innerColor: string;
    outerColor: string;
}

export class Joystick {  
    parent: HTMLDivElement;
    controller: DragController;  
    orb: HTMLDivElement;
    max: number;
    xdir: "left" | "right" | "none" = "none";
    ydir: "up" | "down" | "none" = "none";
    

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

    private isOOB(xsq: number, ysq: number, maxR: number): boolean {
        return Math.sqrt(xsq + ysq) > maxR;
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

        this.controller.onDrag = function(ddx: number, ddy: number, px, py) {
            if(hasEnded)
                return hasEnded = false;

            var x = clamp(-maxR, px - centerX, maxR);
            var y = clamp(-maxR, py - centerY, maxR);

            const xsq = x**2;
            const ysq = y**2;

            const diff = Math.sqrt(xsq + ysq) - maxR;

            if(diff > 0) {
                x -= diff * Math.sign(x) / Math.SQRT2;
                y -= diff * Math.sign(y) / Math.SQRT2;
            }

            self.orb.style.left = x + "px";
            self.orb.style.top = y + "px";

            checkDir(x, y);

            self.onDrag();
        };

        //this.controller.downElement.addEventListener("pointerup", reset);
        addEventListener("pointerup", reset);
        //this.controller.touchEl.addEventListener("pointerout", reset);

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
            self.onReset();
        }


        function checkDir(x: number, y: number) {
            if(x < -hw) {
                self.xdir = "left";
            } else if(x > hw) {
                self.xdir = "right";
            } else {
                self.xdir = "none";
            }

            if(y < -hh) {
                self.ydir = "up";
            } else if(y > hh) {
                self.ydir = "down";
            } else {
                self.ydir = "none";
            }

            const nx = normalize(-maxR, x, maxR) * 2 - 1;
            const ny = -(normalize(-maxR, y, maxR) * 2 - 1);
            self.directionX = nx;
            self.directionY = ny;
        }
    }

    directionX = 0;
    directionY = 0;

    onMove: () => void = () => undefined;
}