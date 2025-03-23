import { $, round } from "../lib/util";
import { app } from "../app";
import { player, wc } from "./main";
import { deltaTime, RDtime } from "./studio";

const speed = 2.2;
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
        const calcSpeed = Math.round(speed * deltaTime);

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