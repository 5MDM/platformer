import { isMobile } from "pixi.js";
import { $, round } from "../lib/util";
import { app } from "../main";

import { player } from "./main";
import { deltaTime } from "./studio";
import { Joystick } from "../lib/joystick";

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

export function startControlLoop() {
    var isMoving = false;
    function loop() {
        player.container.scale.x = 1;
        isMoving = false;

        const calcSpeed = (speed * deltaTime);

        if(isMovingLeft) {
            player.vx -= calcSpeed;
            isMoving = true;
            player.playAnimation("walk-l", 0.08);
        }

        if(isMovingRight) {
            player.vx += calcSpeed;
            isMoving = true;
            player.playAnimation("walk-r", 0.08);
        }

        if(isJumping) {
            player.vy -= calcSpeed;
            isMoving = true;
            player.playAnimation("walk-ud", 0.08);
        }

        if(isGoingDown) {
            player.vy += calcSpeed;
            isMoving = true;
            player.playAnimation("walk-ud", 0.08);
        }

        if(!isMoving) {
            player.playSprite("stand-ud");
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

