import { Joystick } from "../../misc/joystick";
import { _MD2physics } from "./main";
import { Mphysics } from "./v2/main";

export function setupMovementLoop() {
    const P = Mphysics;
    //const setTrue = P.controls.setPolarTrue.bind(P.controls);
    //const setFalse = P.controls.setFalse.bind(P.controls);

    P.isMovementLoopSetup = true;
    const c = P.controls.moving;

    addEventListener("keydown", o => {
        const key = o.key.toLowerCase();
        switch (key) {
            case "w":
                c.up = true;
                //setTrue("up");
                break;
            case "a":
                c.left = true;
                //setTrue("left");
                break;
            case "s":
                c.down = true;
                //setTrue("down");
                //P.controls.looking.down = true;
                break;
            case "d":
                c.right = true;
                //setTrue("right");
                break;
            case "\\":
            case "|":
                c.isJumping = true;
                //P.controls.isJumping = true;
                break;
        }
    }, {passive: true});

    addEventListener("keyup", o => {
        const key = o.key.toLowerCase();
        switch (key) {
            case "w":
                c.up = false;
                //setFalse("up");
                break;
            case "a":
                c.left = false;
                //setFalse("left");
                break;
            case "s":
                c.down = false;
                //setFalse("down");
                //P.controls.looking.down = false;
                break;
            case "d":
                c.right = false;
                //setFalse("right");
                break;
            case "\\":
            case "|":
                c.isJumping = false;
                //P.controls.isJumping = false;
                break;
        }
    }, {passive: true});
}