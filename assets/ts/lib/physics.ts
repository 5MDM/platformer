import { NotDynamicObj, PWB, PWD, PWS } from "./pw-objects";
import { $, clamp, lerp, MDmatrix, resizeDebounce, round } from "./util";

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

interface XY {
    x: number;
    y: number;
}

interface TweenFrame {
    pwd: PWD;
    to: XY;
    currentTime: number;
}

export class PW {
    blockSize: number;
    blockSizeHalf: number;
    size: number;

    private lastPhysicsUpdate: number = 0;
    private physicsDeltaTime: number = 0;
    private lastAnimUpdate: number = 0;

    readonly simSpeed: number;
    private dynamicObjs: PWD[] = [];
    staticGrid: MDmatrix<NotDynamicObj>;

    gx: number;
    gy: number;

    private isLoopRunning = false;

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

        this.setupAnimationLoop();
        this.setupPhysicsLoop();
    }

    private tweenList: TweenFrame[] = [];

    setupAnimationLoop() {
        const self = this;

        function animLoop() {
            const timeNow = performance.now();
            const deltaTime = timeNow - self.lastAnimUpdate;

            if(!self.isLoopRunning) return requestAnimationFrame(animLoop);

            const lerpTime = clamp(0, deltaTime / self.physicsDeltaTime, 1);

            // console.log(round(lerpTime, 10))

            for(const tweenFrameNumber in self.tweenList) self.parseTween(lerpTime, parseInt(tweenFrameNumber));

            self.lastAnimUpdate = timeNow;

            requestAnimationFrame(animLoop);
        }

        requestAnimationFrame(animLoop);
    }

    private parseTween(lerpTime: number, n: number) {
        const o = this.tweenList[n];

        o.pwd.lerpPos(o.to, lerpTime);

        o.currentTime += lerpTime;
        if(o.currentTime >= 1)
             this.tweenList.splice(n, 1);
    }

    onPhysicsTick: ((deltaTime: number) => void) = (deltaTime: number) => undefined;

    setupPhysicsLoop() {
        const self = this;

        this.lastPhysicsUpdate = performance.now();

        function physicsLoop() {
            if(!self.isLoopRunning) return;

            const timeNow = performance.now();
            self.physicsDeltaTime = timeNow - self.lastPhysicsUpdate;
            self.lastPhysicsUpdate = timeNow;

            self.onPhysicsTick(self.physicsDeltaTime);

            self.findCollisions();
        }

        setInterval(physicsLoop, this.simSpeed);
    }

    
    private updateObj(obj: PWD) {
        //obj.vx += this.gx;
        //obj.vy += this.gy;

        obj.addX(obj.vx);
        obj.addY(obj.vy);
    }

    private separate(moving: PWD, obj: NotDynamicObj) {
        const dx =  moving.cx - obj.cx;
        const dy = moving.cy - obj.cy;

        const calcX = Math.abs(dx) - moving.halfW - obj.halfW;
        const calcY = Math.abs(dy) - moving.halfH - obj.halfH;
        
        if(Math.floor(calcX - calcY) == 0) return {x: moving.x, y: moving.y};
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

    private findStaticCollisions(moving: PWD): void {
        if(this.endForNow) return;

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
                    for(const f of col.onCollide) {
                        if(f(col)) continue loop;
                    }
                    
                    const resolution = this.separate(moving, col);
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
    }

    private findCollisions() {
        for(const moving of this.dynamicObjs) {
            moving.vy = Math.min(this.blockSizeHalf, Math.abs(moving.vy)) * Math.sign(moving.vy);
            moving.vx = Math.min(this.blockSizeHalf, Math.abs(moving.vx)) * Math.sign(moving.vx);
            
            this.updateObj(moving);

            this.findStaticCollisions(moving);
            
            this.tweenList.push({
                to: {x: moving.x, y: moving.y},
                pwd: moving,
                currentTime: 0,
            });
            
            //if(moving.sprite) moving.updateSprite();

            moving.vx = 0;
            moving.vy = 0;
        }
    }

    // called manually
    startClock() {
        this.isLoopRunning = true;
    }

    stopClock() {
        this.isLoopRunning = false;
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

            for(const id in this.recentCollisions) {
                delete this.recentCollisions[id];
            }
        });
    }
}