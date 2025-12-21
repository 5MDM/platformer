import { MDmatrix } from "../../misc/matrix";
import { FgBlock } from "../blocks/blocks";
import { Entity, MovingDynamicObj } from "../entities/entity";
import { Projectile } from "../entities/projectile";

export function jumpCol(o: MovingDynamicObj, blockSize: number, m: MDmatrix<FgBlock>) {
    var {x, y, maxY, maxX} = o;

    function round(n: number): number {
        return Math.floor(n / blockSize);
    }

    x = round(x);
    y = round(y);
    maxX = round(maxX);
    maxY = round(maxY + blockSize / 2);

    const blocks: (FgBlock | undefined)[] = [m.get(x, maxY), m.get(maxX, maxY)];

    var canJump = false;
    for(const block of blocks) {
        if(!block) continue;
        
        if(o.isStandingOn(block)) {
            canJump = true;
            break;
        }
    }

    if(canJump) {
        o.resetJump();
    } else {
    }
}
