import { EventEmitter } from "pixi.js";
import { Joystick4Movement } from "./joystick";

type Dir4Map = Record<Joystick4Movement, boolean>;
type ControlDumpEvents = Joystick4Movement 
| "deactivate-up"
| "deactivate-down"
| "deactivate-left"
| "deactivate-right"
| "deactivate-jumping";

export class ControlDump extends EventEmitter<ControlDumpEvents> {
    static genDir(): Dir4Map {
        return {
            up: false,
            left: false,
            right: false,
            down: false,
        };
    }

    static oppositeMap: Record<Joystick4Movement, Joystick4Movement> = {
        down: "up",
        left: "right",
        right: "left",
        up: "down",
    };

    isJumping = false;
    moving = ControlDump.genDir();
    looking = ControlDump.genDir();

    directionList: Dir4Map[] = [
        this.moving,
        this.looking
    ];

    setTrue(name: Joystick4Movement) {
        for(const o of this.directionList) {
            o[name] = true;
        }

        this.emit(name);
    }

    setFalse(name: Joystick4Movement) {
        for(const o of this.directionList) { 
            o[name] = false;
        }

        this.emit("deactivate-" + name as ControlDumpEvents);
    }

    setPolarTrue(name: Joystick4Movement) {
        this.setTrue(name);
        this.setFalse(ControlDump.oppositeMap[name]);
    }

    setAll4DirFalse() {
        this.setFalse("down");
        this.setFalse("left");
        this.setFalse("right");
        this.setFalse("up");
    }

    setAllFalse() {
        this.setFalse("down");
        this.setFalse("left");
        this.setFalse("right");
        this.setFalse("up");

        this.isJumping = false;
        this.emit("deactivate-jumping")
    }
}