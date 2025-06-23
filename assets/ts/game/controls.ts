import { $, ToggleState } from "../lib/util";

import { deltaTime } from "./dev/stats";
import { Joystick } from "../lib/joystick";
import { player } from "../constants";
import { playerInteract } from "../lib/md-framework/interact";
import { isMobile } from "pixi.js";
import { areControlsEnabled } from "./dev/studio";

const speed = 5;
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

var lastMoveUDwasUp = false;

const mspeed = 0.1;

export function startControlLoop() {
    var isMoving = false;

    function loop() {
        if(!areControlsEnabled) return requestAnimationFrame(loop);
        isMoving = false;

        const calcSpeed = (speed * deltaTime);

        if(isMovingLeft) {
            player.vx -= calcSpeed;
            isMoving = true;
            player.playAnimation("walk-l", mspeed);
            lastMoveUDwasUp = false;
        }

        if(isMovingRight) {
            player.vx += calcSpeed;
            isMoving = true;
            player.playAnimation("walk-r", mspeed);
            lastMoveUDwasUp = false;
        }

        if(isJumping) {
            player.vy -= calcSpeed;
            isMoving = true;
            player.playAnimation("walk-ud-up", mspeed);
            lastMoveUDwasUp = true;
        }

        if(isGoingDown) {
            player.vy += calcSpeed;
            isMoving = true;
            player.playAnimation("walk-ud-down", mspeed);
            lastMoveUDwasUp = false;
        }

        if(!isMoving) {
            if(lastMoveUDwasUp) player.playSprite("stand-ud-up");
            else player.playSprite("stand-ud-down");
        }

        if(player.vx != 0 && player.vy != 0) {
            // Math.sqrt(2) is the actual thing, not 1.3
            player.vx = Math.ceil(player.vx / 1.4);
            player.vy = Math.ceil(player.vy / 1.4);
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
    max: 95,
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

addEventListener("blur", () => joystick.onReset());

const interactBtn = $("#ui > #mobile-ui > #interact-btn");

if(!isMobile.any) {
    interactBtn.style.display = "none";
    joystick.parent.style.display = "none";
}

interactBtn.onpointerdown = function() {
    interactBtn.style.filter = "grayscale()";
};

interactBtn.onpointerup = function() {
    interactBtn.style.filter = "";
    playerInteract();
};

