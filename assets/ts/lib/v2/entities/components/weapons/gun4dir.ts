import { audio } from "../../../../../game/audio";
import { Joystick4Movement } from "../../../../misc/joystick";
import { MDV } from "../../../../misc/vectors/vectors";
import { WeaponGun } from "./gun";

const V2 = MDV.V2;

export class Gun4dir extends WeaponGun {
    static localVel: Record<Joystick4Movement, MDV.V2> = {
        up: new V2(0, -1),
        left: new V2(-1, 0),
        right: new V2(1, 0),
        down: new V2(0, 1),
    };

    currentDirection = Gun4dir.localVel.right;

    setDirection(dir: Joystick4Movement) {
        this.currentDirection = Gun4dir.localVel[dir];
    }

    override async fireMain(...args: any[]) {
        const e = [this.createBullet()];

        audio.playAudio("gunshot");

        await this.moveObjByVel(e, this.currentDirection.clone().multiplyS(this.opts.bulletSpeed), 1000);

        this.deleteProjectiles(e);
    }
}