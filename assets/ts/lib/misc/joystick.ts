import { DragController } from "./drag";
import { $$ } from "./util";

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

    private init() {
        var hasEnded = false;
        const self = this;
        const og = this.orb.getBoundingClientRect();
        const maxR = (self.max / 2)**2;
        const hw = og.width / 3;
        const hh = og.height / 3;
        var x = 0;
        var y = 0;

        this.controller.onDrag = function(cx: number, cy: number) {
            if(hasEnded) {
                return hasEnded = false;
            }
            x -= cx;
            y -= cy;

            const xsq = x**2;
            const ysq = y**2;

            if(xsq > maxR) {
                x += cx;
            }

            if(ysq > maxR) {
                y += cy;
            }

            self.orb.style.left = x + "px";
            self.orb.style.top = y + "px";

            checkDir(x, y);

            self.onDrag();
        };

        this.controller.downElement.addEventListener("pointerup", reset);
        //this.controller.touchEl.addEventListener("pointerout", reset);

        function reset() {
            hasEnded = true;
            self.xdir = "none";
            self.ydir = "none";
            x = 0;
            y = 0;
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

            //console.log(x, og.width)
        }
    }

    onMove: () => void = () => undefined;
}