import { Joystick } from "../../misc/joystick";
import { _MD2physics } from "./main";

export function setupMovementLoop(j: Joystick) {
    const P = _MD2physics;
    const setTrue = P.controls.setPolarTrue.bind(P.controls);
    const setFalse = P.controls.setFalse.bind(P.controls);

    P.isMovementLoopSetup = true;

    j.onDrag = () => {
        P.controls.setAll4DirFalse();

        if (j.xdir == "left") setTrue("left");
        else if (j.xdir == "right") setTrue("right");

        if (j.ydir == "down") setTrue("down");
        else if (j.ydir == "up") setTrue("up");
    };

    j.onReset = () => P.controls.setAll4DirFalse();

    addEventListener("keydown", ({ key }) => {
        switch (key) {
            case "w":
            case "W":
                setTrue("up");
                break;
            case "a":
            case "A":
                setTrue("left");
                break;
            case "s":
            case "S":
                setTrue("down");
                break;
            case "d":
            case "D":
                setTrue("right");
                break;
            case "\\":
            case "|":
                P.controls.isJumping = true;
                break;
            case "s":
            case "S":
                P.controls.looking.down = true;
        }
    }, {passive: true});

    addEventListener("keyup", ({ key }) => {
        switch (key) {
            case "w":
            case "W":
                setFalse("up");
                break;
            case "a":
            case "A":
                setFalse("left");
                break;
            case "s":
            case "S":
                setFalse("down");
                break;
            case "d":
            case "D":
                setFalse("right");
                break;
            case "\\":
            case "|":
                P.controls.isJumping = false;
                break;
            case "s":
            case "S":
                P.controls.looking.down = false;
        }
    }, {passive: true});
}