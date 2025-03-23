import { blockSize } from "../main";
import { MovingObjs, NotDynamicObj, PWD, PWS } from "./pw-objects";
import { $, MDmatrix } from "./util";

const colEl = $("#ui > #studio .bottom #col");

interface PWopts {
    gx: number;
    gy: number;
    simSpeed: number;
}

export var playerCollisionAmnt = 0;

export class PW {
    static PartitionSize: number = 8;
    readonly simSpeed: number;
    private dynamicObjs: PWD[] = [];
    private NDOs: NotDynamicObj[] = [];
    staticGrid: MDmatrix<NotDynamicObj> = new MDmatrix<NotDynamicObj>(512, 512);

    gx: number;
    gy: number;

    constructor(opts: PWopts) {
        this.gx = opts.gx;
        this.gy = opts.gy;
        this.simSpeed = opts.simSpeed;
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

    private separate(moving: PWD, obj: NotDynamicObj) {
        const dx = moving.cx - obj.cx;
        const dy = moving.cy - obj.cy;

        const calcX = Math.abs(dx - moving.vx);
        const calcY = Math.abs(dy - moving.vy);

        if(calcX == calcY) return;
        
        if(calcX > calcY) {
            if(Math.abs(dy) == obj.halfH + moving.halfH) return;
            if(dx < 0) {
                moving.setX(obj.x - moving.w);
            } else {
                moving.setX(obj.maxX);
            }
        } else {
            if(Math.abs(dx) == obj.halfW + moving.halfW) return;
            if(dy < 0) {
                moving.setY(obj.y - moving.h);
            } else {
                moving.setY(obj.maxY);
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
                collisionAmnt++;
                this.separate(moving, col);
            }

        return collisionAmnt;
    }

    private findCollisions() {
        for(const moving of this.dynamicObjs) {
            this.updateObj(moving);
            
            const playerCollisionAmnt = this.findStaticCollisions(moving);

            /*for(const obj of this.NDOs) {
                const isColliding = moving.testAABB(obj);
                if(!isColliding) continue;
               
                playerCollisionAmnt++;
                this.seperate(moving, obj);
            }*/

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

    addStatic(obj: PWS) {
        this.NDOs.push(obj);
        this.staticGrid.set(Math.floor(obj.x / blockSize), Math.floor(obj.y / blockSize), obj);
    }
}