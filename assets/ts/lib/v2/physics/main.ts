import { Joystick } from "../../misc/joystick";
import { MDmatrix } from "../../misc/matrix";
import { FgBlock } from "../blocks/blocks";
import { _MD2engine } from "../engine";
import { Entity, PlayerControlledEntity } from "../entities/entity";
import { findstaticCollisions } from "./collision-f";
import { setupMovementLoop } from "./movement";


export interface _MD2physicsOpts {
    simSpeed: number;
    smoothing: number;
}

type EntityGroupMap = Map<number, Entity> | EntityGroupMap[];

export class _MD2physics {
    engine: _MD2engine;
    matrix: MDmatrix<FgBlock> = new MDmatrix(1, 1);

    private dynamicObjs = new Map<number, Entity>();
    private entityGroups: EntityGroupMap[] = [];
    private playerGroup = new Map<number, PlayerControlledEntity>();

    static expectedFPS = 1000 / 60;

    static isMovementLoopSetup = false;
    static isMovingUp = false;
    static isMovingDown = false;
    static isMovingLeft = false;
    static isMovingRight = false;

    gx: number = 0;
    gy: number = 6;
    suspendGy = false;
    smoothing: number;

    simSpeed: number;

    constructor(engine: _MD2engine, o: _MD2physicsOpts) {
        this.engine = engine;
        this.simSpeed = o.simSpeed;
        this.smoothing = o.smoothing;

        this.setupAnimationLoop();
        this.setupPhysicsLoop();

        if (!_MD2physics.isMovementLoopSetup) setupMovementLoop(this.engine.joystick);
    }

    setMatrix(matrix: MDmatrix<FgBlock>) {
        this.matrix = matrix;
    }

    lastPhysicsUpdate: number = 0;
    physicsDeltaTime: number = 0;
    dt: number = 0;
    isLoopRunning: boolean = false;

    TDphysicsLoop(j: Joystick) {
        var dirX = 1;
        var dirY = 1;

        if(j.directionX != 0 && j.directionY != 0) {
            const dirX = j.directionX;
            const dirY = j.directionY;

            this.playerGroup.forEach(e => e.move(dirX, dirY));
        } else {
            if ((_MD2physics.isMovingUp || _MD2physics.isMovingDown)
                && (_MD2physics.isMovingLeft || _MD2physics.isMovingRight)) {
                dirX /= Math.SQRT2;
                dirY /= Math.SQRT2;
            }

            if (_MD2physics.isMovingUp) this.playerGroup.forEach(e => e.onUp(dirY));
            if (_MD2physics.isMovingDown) this.playerGroup.forEach(e => e.onDown(dirY));

            if (_MD2physics.isMovingLeft) this.playerGroup.forEach(e => e.onLeft(dirX));

            if (_MD2physics.isMovingRight) this.playerGroup.forEach(e => e.onRight(dirX));

            if (!(_MD2physics.isMovingUp
                || _MD2physics.isMovingDown
                || _MD2physics.isMovingLeft
                || _MD2physics.isMovingRight
            )) this.playerGroup.forEach(e => e.onNotMoving());
        }

        this.findCollisions();
    }

    private entityGroupMapRecursiveIteration(fn: (e: Entity) => void, m: EntityGroupMap) {
        m.forEach(e => {
            if(e instanceof Map) return this.entityGroupMapRecursiveIteration(fn, e)
            else return fn.call(this, e);
        });
    }

    // iterate dynamic objects
    ido(fn: (e: Entity) => void) {
        const self = this;
        this.dynamicObjs.forEach(e => fn.call(self, e));
        this.playerGroup.forEach(e => fn.call(self, e));

        this.entityGroupMapRecursiveIteration(fn, this.entityGroups);
    }

    setupPhysicsLoop() {
        const self = this;
        this.lastPhysicsUpdate = performance.now();

        function physicsLoop() {
            const timeNow = performance.now();
            self.physicsDeltaTime = timeNow - self.lastPhysicsUpdate;
            self.dt = self.physicsDeltaTime / _MD2physics.expectedFPS;
            self.lastPhysicsUpdate = timeNow;

            PlayerControlledEntity.dt = self.physicsDeltaTime;

            if (!self.isLoopRunning) return;

            const j = self.engine.joystick;

            self.globalPhysicsLoopBefore();

            if(self.engine.CD == "td") self.TDphysicsLoop(j);
            else self.sideScrollerPhysicsLoop(j);

            self.globalPhysicsLoopAfter();
        }

        setInterval(physicsLoop, this.simSpeed);
    }

    globalPhysicsLoopBefore() {
        this.ido(e => {
            e.lastX = e.x;
            e.lastY = e.y;
            e.thisFrame.reset();
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
            if(this.gy != 0) {o.setY(o.y + this.gy);}
            if(this.gx != 0) {o.setX(o.x - this.gx);}
        });
    }

    protected tryJumping() {
        this.playerGroup.forEach(e => e.onJump(32));
    }

    sideScrollerPhysicsLoop(j: Joystick) {
        var dirX = 1;
        var dirY = 1;

        this.applyGravity();

        if(j.directionX != 0 && j.directionY != 0) {
            const dirX = j.directionX;

            this.playerGroup.forEach(e => e.move(dirX, 0));

            if(j.directionY > .3) this.tryJumping();
        } else {
            const p = _MD2physics;

            if(p.isMovingUp) this.tryJumping();
            else this.playerGroup.forEach(e => e.jumpBreak());

            if(p.isMovingLeft) this.playerGroup.forEach(e => e.onLeft(dirX));
            if(p.isMovingRight) this.playerGroup.forEach(e => e.onRight(dirX));

            if(!(p.isMovingUp
                || p.isMovingDown
                || p.isMovingLeft
                || p.isMovingRight
            )) this.playerGroup.forEach(e => e.onNotMoving())
        }

        this.findCollisions();
    }

    findCollisions() {
        const recentColClone: Record<number, FgBlock> = {};

        for (const id in _MD2physics.recentCollisions) {
            recentColClone[id] = _MD2physics.recentCollisions[id];
            delete _MD2physics.recentCollisions[id];
        }

        this.ido(moving => {
            moving.fy = Math.min(this.engine.blockSizeHalf, Math.abs(moving.fy)) * Math.sign(moving.fy);
            moving.fx = Math.min(this.engine.blockSizeHalf, Math.abs(moving.fx)) * Math.sign(moving.fx);

            if (moving.fx != 0) moving.setX(moving.x + moving.fx);
            if (moving.fy != 0) moving.setY(moving.y + moving.fy);

            findstaticCollisions(this.matrix, moving, this.engine.blockSize, this.engine);

            moving.fx = 0;
            moving.fy = 0;
        });

        for (const id in _MD2physics.recentCollisions)
            delete recentColClone[id];

        for (const id in recentColClone) {
            recentColClone[id].components.onCollisionLeave();
            recentColClone[id].hasCollidedRecently = false;
            delete _MD2physics.recentCollisions[id];
        }
    }

    addEntity(entity: Entity) {
        this.dynamicObjs.set(entity.id, entity);
    }

    addEntityGroup(map: EntityGroupMap) {
        this.entityGroups.push(map);
    }

    addPlayer(player: PlayerControlledEntity) {
        this.playerGroup.set(player.id, player);
    }

    setupAnimationLoop() {}

    static recentCollisions: Record<number, FgBlock> = {};
}

