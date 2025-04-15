//import { blockSize } from "../main";
import { Container } from "pixi.js";
import { blockSizeHalf } from "../mods";
import { MovingObjs, NotDynamicObj, PWD, PWS } from "./pw-objects";
import { $, MDmatrix, resizeDebounce } from "./util";

export const blockSize = 64;
const colEl = $("#ui > #studio .bottom #col");

interface PWopts {
    world: Container;
    gx: number;
    gy: number;
    simSpeed: number;
}

export var playerCollisionAmnt = 0;

const resizeFuncs: ((x: number, y: number) => void)[] = [];
var lastW = innerWidth;
var lastH = innerHeight;
addEventListener("resize", resizeDebounce(() => {
    const changeX = (innerWidth - lastW)/2;
    const changeY = (innerHeight - lastH)/2;

    lastW = innerWidth;
    lastH = innerHeight;

    for(const f of resizeFuncs) f(changeX, changeY);
}, 200));

export class PW {
    static PartitionSize: number = 8;
    readonly simSpeed: number;
    private dynamicObjs: PWD[] = [];
    private NDOs: NotDynamicObj[] = [];
    staticGrid: MDmatrix<NotDynamicObj> = new MDmatrix<NotDynamicObj>(512, 512);

    gx: number;
    gy: number;

    static OnResizeChange(f: (x: number, y: number) => void) {
        resizeFuncs.push(f);
    }

    constructor(opts: PWopts) {
        this.gx = opts.gx;
        this.gy = opts.gy;
        this.simSpeed = opts.simSpeed;

        PW.OnResizeChange((x, y) => {
            opts.world.x += x;
            opts.world.y += y;
        });
    }

    private tick() {
        this.findCollisions();
    }

    private updateObj(obj: PWD) {
        obj.vx += this.gx;
        obj.vy += this.gy;

        obj.addX(obj.vx);
        obj.addY(obj.vy);
    }

    private separateX(moving: PWD, obj: NotDynamicObj) {
        const dx =  moving.cx - obj.cx;

        const calcX = Math.abs(dx - moving.vx);
        
        if(calcX > 0) {
            if(dx < 0) {
                moving.setX(obj.x - moving.w);
            } else {
                moving.setX(obj.maxX);
            }
        }
    }

    private separate(moving: PWD, obj: NotDynamicObj) {
        const dx =  moving.cx - obj.cx;
        const dy = moving.cy - obj.cy;

        const calcX = Math.abs(dx) - moving.halfW - obj.halfW;
        const calcY = Math.abs(dy) - moving.halfH - obj.halfH;
        
        if(Math.floor(calcX - calcY) == 0) return;
        if(calcX < calcY) {
            if(dy < 0) {
                moving.setY(obj.y - moving.h);
            } else {
                moving.setY(obj.maxY);
            }
        } else {
            if(dx < 0) {
                moving.setX(obj.x - moving.w);
            } else {
                moving.setX(obj.maxX);
            }
        }
    }

    private findStaticCollisions(moving: PWD): number {
        var collisionAmnt = 0;
        const x = Math.floor(moving.x / blockSize);
        const maxX = Math.floor(moving.maxX / blockSize);
        const y = Math.floor(moving.y / blockSize);
        const maxY = Math.floor(moving.maxY / blockSize);
        
        const topLeft = this.staticGrid.get(x, y);
        const topRight = this.staticGrid.get(maxX, y);
        const bottomLeft = this.staticGrid.get(x, maxY);
        const bottomRight = this.staticGrid.get(maxX, maxY);

        const collision = [topLeft, topRight, bottomRight, bottomLeft];
        for(const col of collision) 
            if(col) {
                if(col.testAABB(moving)) {
                    collisionAmnt++;
                    this.separate(moving, col);
                }
            }

        return collisionAmnt;
    }

    private findCollisions() {
        for(const moving of this.dynamicObjs) {
            moving.vy = Math.min(blockSizeHalf, moving.vy);
            moving.vx = Math.min(blockSizeHalf, moving.vx);

            this.updateObj(moving);
            
            const playerCollisionAmnt = this.findStaticCollisions(moving);

            if(moving.isPlayer) colEl.textContent = playerCollisionAmnt.toString();

            if(moving.sprite) moving.updateSprite();
            moving.vx = 0;
            moving.vy = 0;
        }
    }

    startClock() {
        const self = this;
        function loop() {
            self.tick();
        }

        setInterval(loop, this.simSpeed);
    }

    addDynamic(obj: PWD) {
        this.dynamicObjs.push(obj);
    }

    addStatic(x: number, y: number, obj: PWS) {
        this.NDOs.push(obj);
        this.staticGrid.set(x, y, obj);
    }
}