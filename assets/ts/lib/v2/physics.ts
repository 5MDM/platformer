import { MDmatrix } from "../misc/matrix";
import { AnyBlock, FgBlock } from "./blocks/blocks";
import { _MD2engine } from "./engine";
import { Entity, PlayerControlledEntity } from "./entities/entity";

export interface _MD2physicsOpts {
    simSpeed: number;
    smoothing: number;
}

export class _MD2physics {
    engine: _MD2engine;
    matrix: MDmatrix<FgBlock> = new MDmatrix(1, 1);

    private dynamicObjs: Entity[] = [];

    private static isMovementLoopSetup = false;
    static isMovingUp = false;
    static isMovingDown = false;
    static isMovingLeft = false;
    static isMovingRight = false;

    gx: number = 0;
    gy: number = 0;
    smoothing: number;

    simSpeed: number;

    constructor(engine: _MD2engine, o: _MD2physicsOpts) {
        this.engine = engine;
        this.simSpeed = o.simSpeed;
        this.smoothing = o.smoothing;

        this.setupAnimationLoop();
        this.setupPhysicsLoop();

        if(!_MD2physics.isMovementLoopSetup) this.setupMovementLoop();
    }

    setupMovementLoop() {
        _MD2physics.isMovementLoopSetup = true;

        const j = this.engine.joystick;
        j.onDrag = () => {
            if(j.xdir == "left") _MD2physics.isMovingLeft = true;
            else if(j.xdir == "right") _MD2physics.isMovingRight = true;
            else {
                _MD2physics.isMovingLeft = false;
                _MD2physics.isMovingRight = false;
            }

            if(j.ydir == "down") _MD2physics.isMovingDown = true;
            else if(j.ydir == "up") _MD2physics.isMovingUp = true;
            else {
                _MD2physics.isMovingUp = false;
                _MD2physics.isMovingDown = false;
            }
        };

        j.onReset = () => {
            _MD2physics.isMovingDown = false;
            _MD2physics.isMovingUp = false;
            _MD2physics.isMovingLeft = false;
            _MD2physics.isMovingRight = false;
        };

        addEventListener("keydown", ({key}) => {
            switch(key) {
                case "w":
                    _MD2physics.isMovingUp = true;
                    break;
                case "a":
                    _MD2physics.isMovingLeft = true;
                    break;
                case "s":
                    _MD2physics.isMovingDown = true;
                    break;
                case "d":
                    _MD2physics.isMovingRight = true;
                    break;
            }
        });

        addEventListener("keyup", ({key}) => {
            switch(key) {
                case "w":
                    _MD2physics.isMovingUp = false;
                    break;
                case "a":
                    _MD2physics.isMovingLeft = false;
                    break;
                case "s":
                    _MD2physics.isMovingDown = false;
                    break;
                case "d":
                    _MD2physics.isMovingRight = false;
                    break;
            }
        });
    }

    setMatrix(matrix: MDmatrix<FgBlock>) {
        this.matrix = matrix;
    }

    lastPhysicsUpdate: number = 0;
    physicsDeltaTime: number = 0;
    isLoopRunning: boolean = false;

    setupPhysicsLoop() {
        const self = this;
        this.lastPhysicsUpdate = performance.now();

        function physicsLoop() {
            const timeNow = performance.now();
            self.physicsDeltaTime = timeNow - self.lastPhysicsUpdate;
            self.lastPhysicsUpdate = timeNow;

            PlayerControlledEntity.dt = self.physicsDeltaTime;

            if(!self.isLoopRunning) return;

            const j = self.engine.joystick;
            var dirX = 1;
            var dirY = 1;

            if(j.directionX != 0 && j.directionY != 0) {
                const dirX = j.directionX;
                const dirY = j.directionY;

               PlayerControlledEntity.move(dirX, dirY);
            } else {
                if((_MD2physics.isMovingUp || _MD2physics.isMovingDown)
                && (_MD2physics.isMovingLeft || _MD2physics.isMovingRight)) {
                    dirX /= Math.SQRT2;
                    dirY /= Math.SQRT2;
                }

                if(_MD2physics.isMovingUp) PlayerControlledEntity.moveUp(dirY);
                if(_MD2physics.isMovingDown) PlayerControlledEntity.moveDown(dirY);

                if(_MD2physics.isMovingLeft) PlayerControlledEntity.moveLeft(dirX);
                if(_MD2physics.isMovingRight) PlayerControlledEntity.moveRight(dirX);
                
                if(!(_MD2physics.isMovingUp
                || _MD2physics.isMovingDown
                || _MD2physics.isMovingLeft
                || _MD2physics.isMovingRight
                )) PlayerControlledEntity.notMoving();
            } 

            self.findCollisions();
        }

        setInterval(physicsLoop, this.simSpeed);
    }

    findCollisions() {
        const recentColClone: Record<number, FgBlock> = {};

        for(const id in _MD2physics.recentCollisions) {
            recentColClone[id] = _MD2physics.recentCollisions[id];
            delete _MD2physics.recentCollisions[id];
        }

        for(const moving of this.dynamicObjs) {
            moving.vy = Math.min(this.engine.blockSizeHalf, Math.abs(moving.vy)) * Math.sign(moving.vy);
            moving.vx = Math.min(this.engine.blockSizeHalf, Math.abs(moving.vx)) * Math.sign(moving.vx);

            if(moving.vx != 0) moving.setX(moving.x + moving.vx);
            if(moving.vy != 0) moving.setY(moving.y + moving.vy);

            findstaticCollisions(this.matrix, moving, this.engine.blockSize, this.engine);

            moving.vx = 0;
            moving.vy = 0;
        }

        for(const id in _MD2physics.recentCollisions)
            delete recentColClone[id];

        for(const id in recentColClone) {
            recentColClone[id].components.onCollisionLeave();
            recentColClone[id].hasCollidedRecently = false;
            delete _MD2physics.recentCollisions[id];
        }
    }

    addEntity(entity: Entity) {
        this.dynamicObjs.push(entity);
    }

    setupAnimationLoop() {

    }

    static recentCollisions: Record<number, FgBlock> = {};
}

function findstaticCollisions(matrix: MDmatrix<FgBlock>, moving: Entity, blockSize: number, md2: _MD2engine) {
    const x = Math.floor(moving.x / blockSize);
    const maxX = Math.floor(moving.maxX / blockSize);
    const y = Math.floor(moving.y / blockSize);
    const maxY = Math.floor(moving.maxY / blockSize);

    const corners = [
        matrix.get(x, y),       // top left
        matrix.get(maxX, y),    // top right
        matrix.get(x, maxY),    // bottom left
        matrix.get(maxX, maxY), // bottom right
    ];

    for(const col of corners)
        if(col) if(resolveStaticCollisions(moving, col, md2)) continue;
}

function resolveStaticCollisions(moving: Entity, col: FgBlock, md2: _MD2engine): true | void {
    if(col.hasCollisionLeaveEvents) {
        col.hasCollidedRecently = true;
        _MD2physics.recentCollisions[col.id] = col;
    }

    if(col.testAABB(moving)) {
        if(!col.components.onCollision(md2)) return true;

        separate(moving, col);
    }
}

function separate(moving: Entity, obj: FgBlock) {
    const dx = moving.cx - obj.cx;
    const dy = moving.cy - obj.cy;

    const calcX = Math.abs(dx) - moving.halfW - obj.halfW;
    const calcY = Math.abs(dy) - moving.halfH - obj.halfH;

    if (Math.floor(calcX - calcY) == 0) return { x: moving.x, y: moving.y };
    if (calcX < calcY) {
        if (dy < 0) {
            moving.setY(obj.y - moving.h);
        } else {
            moving.setY(obj.maxY);
        }
    } else {
        if (dx < 0) {
            moving.setX(obj.x - moving.w);
        } else {
            moving.setX(obj.maxX);
        }
    }
}
