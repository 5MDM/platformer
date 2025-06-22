import { NotDynamicObj, PWD, PWS } from "./pw-objects";
import { $, MDmatrix, resizeDebounce } from "./util";

interface PWopts {
    gx: number;
    gy: number;
    simSpeed: number;
    blockSize: number;
    maxLevelSize: number;
}

export var playerCollisionAmnt = 0;

const resizeFuncs: ((x: number, y: number) => void)[] = [];
var lastW = innerWidth;
var lastH = innerHeight;

function resizeF() {
    const changeX = (innerWidth - lastW)/2;
    const changeY = (innerHeight - lastH)/2;

    lastW = innerWidth;
    lastH = innerHeight;

    for(const f of resizeFuncs) f(changeX, changeY);
}

addEventListener("resize", resizeDebounce(() => {
    resizeF();
}, 200));

addEventListener("orientationchange", () => setTimeout(() => resizeF(), 100));

export class PW {
    blockSize: number;
    blockSizeHalf: number;
    size: number;

    clockLoopId: number = NaN;
    readonly simSpeed: number;
    private dynamicObjs: PWD[] = [];
    staticGrid: MDmatrix<NotDynamicObj>;

    gx: number;
    gy: number;

    static OnResizeChange(f: (x: number, y: number) => void) {
        resizeFuncs.push(f);
    }

    constructor(opts: PWopts) {
        this.staticGrid = new MDmatrix<NotDynamicObj>(opts.maxLevelSize, opts.maxLevelSize);
        this.gx = opts.gx;
        this.gy = opts.gy;
        this.simSpeed = opts.simSpeed;
        this.blockSize = opts.blockSize;
        this.blockSizeHalf = opts.blockSize / 2;
        this.size = opts.maxLevelSize;
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

    private recentCollisions: Record<number, PWS> = {}
    private endForNow = false;

    private findStaticCollisions(moving: PWD): number {
        if(this.endForNow) return 0;

        var collisionAmnt = 0;
        const x = Math.floor(moving.x / this.blockSize);
        const maxX = Math.floor(moving.maxX / this.blockSize);
        const y = Math.floor(moving.y / this.blockSize);
        const maxY = Math.floor(moving.maxY / this.blockSize);
        
        if(this.endForNow) this.staticGrid.clear();
        const topLeft = this.staticGrid.get(x, y);
        const topRight = this.staticGrid.get(maxX, y);
        const bottomLeft = this.staticGrid.get(x, maxY);
        const bottomRight = this.staticGrid.get(maxX, maxY);

        const collision = [topLeft, topRight, bottomRight, bottomLeft];
        for(const id in this.recentCollisions) {
            this.recentCollisions[id].hasCollidedRecently = false;
        }

        loop: for(const col of collision) {
            if(col) {
                if(col.hasCollisionLeaveEvents) {
                    col.hasCollidedRecently = true;
                    this.recentCollisions[col.id] = col;
                }
                
                if(col.testAABB(moving)) {
                    collisionAmnt++;
                    for(const f of col.onCollide) {
                        if(f(col)) continue loop;
                    }
                    
                    this.separate(moving, col);
                }
            }
        }
        
        for(const id in this.recentCollisions) {
            const block = this.recentCollisions[id];
            if(!block.hasCollidedRecently) {

                if(!block.testSmallAABB(moving)) {
                for(const f of block.onCollisionLeave) f(block);
                    delete this.recentCollisions[id];
                }
            }
        }

        return collisionAmnt;
    }

    private findCollisions() {
        for(const moving of this.dynamicObjs) {
            moving.vy = Math.min(this.blockSizeHalf, moving.vy);
            moving.vx = Math.min(this.blockSizeHalf, moving.vx);

            this.updateObj(moving);
            
            const playerCollisionAmnt = this.findStaticCollisions(moving);

            //if(moving.isPlayer) colEl.textContent = playerCollisionAmnt.toString();
            
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

        this.clockLoopId = setInterval(loop, this.simSpeed);
    }

    stopClock() {
        clearInterval(this.clockLoopId);
    }

    addDynamic(obj: PWD) {
        this.dynamicObjs.push(obj);
    }

    addStatic(x: number, y: number, obj: PWS) {
        this.staticGrid.set(x, y, obj);
    }

    clear() {
        this.endForNow = true;

        this.staticGrid.clear()
        .then(() => {
            this.endForNow = false;

            for(const id in this.recentCollisions)
                delete this.recentCollisions[id];
        });
    }
}