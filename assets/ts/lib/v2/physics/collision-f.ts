import { MDmatrix } from "../../misc/matrix";
import { FgBlock } from "../blocks/blocks";
import { _MD2engine } from "../engine";
import { Entity } from "../entities/entity";
import { jumpCol } from "./jump";
import { _MD2physics } from "./main";

export function findstaticCollisions(matrix: MDmatrix<FgBlock>, moving: Entity, blockSize: number, md2: _MD2engine) {
    const x = Math.floor(moving.x / blockSize);
    const maxX = Math.floor(moving.maxX / blockSize);
    const y = Math.floor(moving.y / blockSize);
    const maxY = Math.floor(moving.maxY / blockSize);

    const corners = [
        matrix.get(x, y), // top left
        matrix.get(maxX, y), // top right
        matrix.get(x, maxY), // bottom left
        matrix.get(maxX, maxY), // bottom right
    ];

    if(md2.CD == "side") jumpCol(moving, blockSize, matrix);

    for (const col of corners)
        if (col) if (resolveStaticCollisions(moving, col, md2)) continue;
}

function resolveStaticCollisions(moving: Entity, col: FgBlock, md2: _MD2engine): true | void {
    if (col.hasCollisionLeaveEvents) {
        col.hasCollidedRecently = true;
        _MD2physics.recentCollisions[col.id] = col;
    }

    if(col.testAABB(moving)) {
        if (!col.components.onCollision(md2)) return true;

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
            moving.thisFrame.hitFloor = true;
            moving.setY(obj.y - moving.h);
        } else {
            moving.thisFrame.hitCeiling = true;
            moving.canJump = false;
            moving.setY(obj.maxY);
        }
    } else {
        if (dx < 0) {
            moving.thisFrame.hitRight = true;
            moving.setX(obj.x - moving.w);
        } else {
            moving.thisFrame.hitLeft = true;
            moving.setX(obj.maxX);
        }
    }
}

