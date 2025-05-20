import { isMobile } from "pixi.js";
import { $, round } from "../lib/util";

import { deltaTime } from "./dev/stats";
import { Joystick } from "../lib/joystick";
import { player } from "../constants";

const speed = 5;
var isPlayingAnim = false;
var isMovingLeft = false;
var isMovingRight = false;
var isJumping = false;
var isGoingDown = false;

addEventListener("keydown", e => {
    switch(e.key) {
        case "a": case "ArrowLeft": isMovingLeft = true; break;
        case "d": case "ArrowRight": isMovingRight = true; break;
        case "w": case "ArrowUp": isJumping = true; break;
        case "s": case "ArrowDown": isGoingDown = true; break;
    }
});

addEventListener("keyup", e => {
    switch(e.key) {
        case "a": case "ArrowLeft": isMovingLeft = false; break;
        case "d": case "ArrowRight": isMovingRight = false; break;
        case "w": case "ArrowUp": isJumping = false; break;
        case "s": case "ArrowDown": isGoingDown = false; break;
    }
});

var areControlsEnabled = true;
export function disableControls() {
    areControlsEnabled = false;
}

export function enableControls() {
    areControlsEnabled = true;
}

var lastMoveUDwasUp = false;

export function startControlLoop() {
    var isMoving = false;
    function loop() {
        if(!areControlsEnabled) return requestAnimationFrame(loop);
        player.container.scale.x = 1;
        isMoving = false;

        const calcSpeed = (speed * deltaTime);

        if(isMovingLeft) {
            player.vx -= calcSpeed;
            isMoving = true;
            player.playAnimation("walk-l", 0.08);
            lastMoveUDwasUp = false;
        }

        if(isMovingRight) {
            player.vx += calcSpeed;
            isMoving = true;
            player.playAnimation("walk-r", 0.08);
            lastMoveUDwasUp = false;
        }

        if(isJumping) {
            player.vy -= calcSpeed;
            isMoving = true;
            player.playAnimation("walk-ud-up", 0.08);
            lastMoveUDwasUp = true;
        }

        if(isGoingDown) {
            player.vy += calcSpeed;
            isMoving = true;
            player.playAnimation("walk-ud-down", 0.08);
            lastMoveUDwasUp = false;
        }

        if(!isMoving) {
            if(lastMoveUDwasUp) player.playSprite("stand-ud-up");
            else player.playSprite("stand-ud-down");
        }

        requestAnimationFrame(loop);
    }

    loop();
}

const joystick = new Joystick({
    target: $("#joystick") as HTMLDivElement,
    outerColor: "rgba(50,50,50,.8)",
    innerColor: "white",
    size: 40,
    max: 90,
});

joystick.onDrag = function() {
    isMovingLeft = false;
    isMovingRight = false;
    isJumping = false;
    isGoingDown = false;

    if(joystick.xdir == "left") isMovingLeft = true; else
    if(joystick.xdir == "right") isMovingRight = true;

    if(joystick.ydir == "up") isJumping = true; else
    if(joystick.ydir == "down") isGoingDown = true;
};

joystick.onReset = function() {
    isMovingLeft = false;
    isMovingRight = false;
    isJumping = false;
    isGoingDown = false;
};

/*
joystick.parent.addEventListener("pointerup", () => {
    isMovingLeft = false;
    isMovingRight = false;
    isJumping = false;
    isGoingDown = false;
});

joystick.parent.addEventListener("pointercancel", () => {
    isMovingLeft = false;
    isMovingRight = false;
    isJumping = false;
    isGoingDown = false;
});
*/

