import { Joystick } from "../../misc/joystick";
import { _MD2physics } from "./main";

export function setupMovementLoop(j: Joystick) {
    _MD2physics.isMovementLoopSetup = true;

    j.onDrag = () => {
        if (j.xdir == "left") _MD2physics.isMovingLeft = true;
        else if (j.xdir == "right") _MD2physics.isMovingRight = true;
        else {
            _MD2physics.isMovingLeft = false;
            _MD2physics.isMovingRight = false;
        }

        if (j.ydir == "down") _MD2physics.isMovingDown = true;
        else if (j.ydir == "up") _MD2physics.isMovingUp = true;
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

    addEventListener("keydown", ({ key }) => {
        switch (key) {
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

    addEventListener("keyup", ({ key }) => {
        switch (key) {
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