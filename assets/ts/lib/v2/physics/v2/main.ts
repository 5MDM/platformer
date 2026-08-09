import { ControlDump } from "../../../misc/control-dump";
import { Joystick, joystickBitflagCombinations, joystickBitflags } from "../../../misc/joystick";
import { MDmatrix } from "../../../misc/matrix";
import { FgBlock } from "../../blocks/blocks";
import { _MD2engine } from "../../engine";
import { Entity, PlayerControlledEntity } from "../../entities/entity";
import { Projectile } from "../../entities/projectile";
import { findstaticCollisions } from "../collision-f";
import { setupMovementLoop } from "../movement";

export interface _MD2physicsOpts {
    simSpeed: number;
    smoothing: number;
}

type EntityGroupMap = Map<number, Entity> | EntityGroupMap[];

const jbm = joystickBitflagCombinations;
const jb = joystickBitflags;

export class Mphysics {
    engine: _MD2engine;
    blockGrid: MDmatrix<FgBlock> = new MDmatrix(1, 1);

    private dynamicObjs = new Map<number, Entity | Projectile>();
    private playerGroup = new Map<number, PlayerControlledEntity>();

    static expectedFPS = 1000 / 60;

    static isMovementLoopSetup = false;

    static controls = {
        moving: {
            up: false, down: false,
            left: false, right: false,
            isJumping: false,
        }
    };

    gx: number = 0;
    gy: number = 5;
    suspendGy = false;
    smoothing: number;

    simSpeed: number;

    constructor(engine: _MD2engine, o: _MD2physicsOpts) {
        this.engine = engine;
        this.simSpeed = o.simSpeed;
        this.smoothing = o.smoothing;

        this.setupPhysicsLoop();
        this.j = engine.joystick;

        if(!this.P.isMovementLoopSetup) 
            setupMovementLoop();
    }

    setBlockGrid(blockGrid: MDmatrix<FgBlock>) {
        this.blockGrid = blockGrid;
    }

    lastPhysicsUpdate: number = 0;
    physicsDeltaTime: number = 0;
    dt: number = 0;
    isLoopRunning: boolean = false;

    P = Mphysics;
    j: Joystick;

    TDphysicsLoop() {
        const j = this.j;

        statement: if(j.b & jbm.isMoving) {
            // joystick
            const dirX = j.directionX;
            const dirY = j.directionY;

            this.playerGroup.forEach(e => e.move(dirX, dirY));
        } else {
            // keyboard
            const {up, left, right, down} = this.P.controls.moving;

            var dirX = 1;
            var dirY = 1;

            const isUpOrDown = up || down;
            const isLeftOrRight = left || right;
            const isMoving = isUpOrDown || isLeftOrRight;
            if(!isMoving) {
                this.playerGroup.forEach(e => e.onNotMoving());
                break statement;
            }

            if(isUpOrDown && isLeftOrRight) {
                dirX /= Math.SQRT2;
                dirY /= Math.SQRT2;
            }

            if(up) this.playerGroup.forEach(e => e.onUp(dirY));
            if(down) this.playerGroup.forEach(e => e.onDown(dirY));

            if(left) this.playerGroup.forEach(e => e.onLeft(dirX));
            if(right) this.playerGroup.forEach(e => e.onRight(dirX));
        }

        this.findCollisions();
    }

    // iterate dynamic objects
    ido(fn: (e: Entity | Projectile, isEntity: boolean) => void) {
        const doVals = this.dynamicObjs.values();
        for(const e of doVals) {
            if(e.isDestroyed) return;
            fn(e, e instanceof Entity);
        }

        const pgVals = this.playerGroup.values();
        for(const e of pgVals) {
            if(e.isDestroyed) return;
            fn(e, e instanceof Entity);
        }
    }

    private readonly physicsLoop = () => {
        const timeNow = performance.now();
        this.physicsDeltaTime = timeNow - this.lastPhysicsUpdate;
        this.dt = this.physicsDeltaTime / this.P.expectedFPS;
        this.lastPhysicsUpdate = timeNow;

        PlayerControlledEntity.dt = this.physicsDeltaTime;

        if(!this.isLoopRunning) return;

        const j = this.j;

        this.globalPhysicsLoopBefore();

        if(this.engine.CD == "td") this.TDphysicsLoop();
        else this.sideScrollerPhysicsLoop();

        this.globalPhysicsLoopAfter();
    }

    setupPhysicsLoop() {
        this.lastPhysicsUpdate = performance.now();

        setInterval(this.physicsLoop, this.simSpeed);
    }

    globalPhysicsLoopBefore() {
        this.ido((e, isEntity) => {
            e.lastX = e.x;
            e.lastY = e.y;
            if(isEntity) (e as Entity).thisFrame.reset();
        });
    }

    globalPhysicsLoopAfter() {
        this.ido(e => {
            e.tick(this.dt);

            if(e.thisFrame.hitLeft || e.thisFrame.hitRight) e.vx = 0;
            else e.vx = e.x - e.lastX;

            if(e.thisFrame.hitCeiling || e.thisFrame.hitFloor) e.vy = 0;
            else e.vy = e.y - e.lastY;
        });
    }

    applyGravity() {
        if(this.engine.CD == "td") return;
        this.ido(o => {
            if(!o.isAffectedByGravity) return;
            o.applyGravity(this.gx, this.gy);
        });
    }

    protected tryJumping() {
        this.playerGroup.forEach(e => e.onJump(.9));
    }

    sideScrollerPhysicsLoop() {
        const j = this.j;
        var dirX = 1;
        var dirY = 1;

        this.applyGravity();

        if(j.directionX != 0 && j.directionY != 0) {
            const dirX = j.directionX;

            this.playerGroup.forEach(e => e.move(dirX, 0));

            if(j.directionY > .3) this.tryJumping();
        } else {
            const moving = this.P.controls.moving;

            if(moving.isJumping) {
                this.tryJumping();
            } else {
                this.playerGroup.forEach(e => e.jumpBreak());
            }

            if(moving.left) this.playerGroup.forEach(e => e.onLeft(dirX));
            if(moving.right) this.playerGroup.forEach(e => e.onRight(dirX));

            if(moving.up) this.playerGroup.forEach(e => {
                e.lookUp();
            });

            if(moving.down) this.playerGroup.forEach(e => e.lookDown());

            if(!(moving.up
            || moving.down
            || moving.left
            || moving.right
            || moving.isJumping)) 
                this.playerGroup.forEach(e => e.onNotMoving())
        }

        this.findCollisions();
    }

    findCollisions() {
        const recentColClone: Record<number, FgBlock> = {};

        for (const id in this.P.recentCollisions) {
            recentColClone[id] = this.P.recentCollisions[id];
            delete this.P.recentCollisions[id];
        }

        this.ido(moving => {
            moving.fy = Math.min(this.engine.blockSizeHalf, Math.abs(moving.fy)) * Math.sign(moving.fy);
            moving.fx = Math.min(this.engine.blockSizeHalf, Math.abs(moving.fx)) * Math.sign(moving.fx);

            if (moving.fx != 0) moving.setX(moving.x + moving.fx);
            if (moving.fy != 0) moving.setY(moving.y + moving.fy);

            findstaticCollisions(this.blockGrid, moving, this.engine.blockSize, this.engine);

            moving.fx = 0;
            moving.fy = 0;
        });

        for (const id in this.P.recentCollisions)
            delete recentColClone[id];

        for (const id in recentColClone) {
            recentColClone[id].components.onCollisionLeave();
            recentColClone[id].hasCollidedRecently = false;
            delete this.P.recentCollisions[id];
        }
    }

    addEntity(entity: Entity | Projectile) {
        this.dynamicObjs.set(entity.id, entity);
    }

    removeEntity(e: Entity | Projectile) {
        this.dynamicObjs.delete(e.id);
    }

    addPlayer(player: PlayerControlledEntity) {
        this.playerGroup.set(player.id, player);
    }

    static recentCollisions: Record<number, FgBlock> = {};
}

