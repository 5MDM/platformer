import { isMobile } from "pixi.js";
import { $, round } from "../lib/util";
import { app } from "../main";

import { player, wc } from "./main";
import { deltaTime, RDtime } from "./studio";
import { Joystick } from "../lib/joystick";

const speed = 3;
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
    function loop() {
        const calcSpeed = (speed * deltaTime);

        if(isMovingLeft) {
            player.vx -= calcSpeed;
        }

        if(isMovingRight) {
            player.vx += calcSpeed;
        }

        if(isJumping) {
            player.vy -= calcSpeed;
        }

        if(isGoingDown) player.vy += calcSpeed;
    }

    setInterval(loop, 1/60);
}

const joystick = new Joystick({
    target: $("#joystick") as HTMLDivElement,
    outerColor: "rgba(50,50,50,.8)",
    innerColor: "white",
    size: 30,
    max: 70,
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

