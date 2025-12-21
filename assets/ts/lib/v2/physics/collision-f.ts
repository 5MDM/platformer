import { blockSize } from "../../../constants";
import { MDmatrix } from "../../misc/matrix";
import { MDV } from "../../misc/vectors";
import { FgBlock } from "../blocks/blocks";
import { _MD2engine } from "../engine";
import { Entity, MovingDynamicObj } from "../entities/entity";
import { jumpCol } from "./jump";
import { _MD2physics } from "./main";

function makeCornerArray(x: number, y: number, m: MDmatrix<FgBlock>): [number, number, FgBlock | undefined] {
    return [x, y, m.get(x, y)];
}

export function findstaticCollisions(matrix: MDmatrix<FgBlock>, moving: MovingDynamicObj, blockSize: number, md2: _MD2engine) {
    const x = Math.floor(moving.x / blockSize);
    const maxX = Math.floor(moving.maxX / blockSize);
    const y = Math.floor(moving.y / blockSize);
    const maxY = Math.floor(moving.maxY / blockSize);

        // const corners = [
        //     matrix.get(x, y), // top left
        //     matrix.get(maxX, y), // top right
        //     matrix.get(x, maxY), // bottom left
        //     matrix.get(maxX, maxY), // bottom right
        // ];

    const newCorners = [
        makeCornerArray(x, y, matrix),
        makeCornerArray(maxX, y, matrix),
        makeCornerArray(x, maxY, matrix),
        makeCornerArray(maxX, maxY, matrix),
    ];

    if(md2.CD == "side") jumpCol(moving, blockSize, matrix);
    
    for (const [x, y, col] of newCorners)
        if(col) {
            if(resolveStaticCollisions(moving, col, md2, x, y)) continue;
        }
}

function resolveStaticCollisions(
    moving: MovingDynamicObj, col: FgBlock, md2: _MD2engine,
    x: number, y: number
): true | void {
    if (col.hasCollisionLeaveEvents) {
        col.hasCollidedRecently = true;
        _MD2physics.recentCollisions[col.id] = col;
    }

    if(col.testAABB(moving)) {
        if (!col.components.onCollision(md2)) return true;

        moving.events.emit("hit", col, MDV.V4.fromBounds({
            x: x * blockSize, y: y * blockSize, w: moving.w, h: moving.h,
        }).floorDivideS(blockSize));
        separate(moving, col);
    }
}
function separate(moving: MovingDynamicObj, obj: FgBlock) {
    const dx = moving.cx - obj.cx;
    const dy = moving.cy - obj.cy;

    const calcX = Math.abs(dx) - moving.halfW - obj.halfW;
    const calcY = Math.abs(dy) - moving.halfH - obj.halfH;

    if(moving.isDestroyed || obj.isDestroyed) return;

    if (Math.floor(calcX - calcY) == 0) return { x: moving.x, y: moving.y };
    if (calcX < calcY) {
        if (dy < 0) {
            moving.events.emit("hitFloor", obj);
            moving.thisFrame.hitFloor = true;
            moving.setY(obj.y - moving.h);
        } else {
            moving.events.emit("hitCeiling", obj);
            moving.thisFrame.hitCeiling = true;
            moving.canJump = false;
            moving.setY(obj.maxY);
        }
    } else {
        if (dx < 0) {
            moving.events.emit("hitRight", obj);
            moving.thisFrame.hitRight = true;
            moving.setX(obj.x - moving.w);
        } else {
            moving.events.emit("hitLeft", obj);
            moving.thisFrame.hitLeft = true;
            moving.setX(obj.maxX);
        }
    }
}

