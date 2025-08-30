import { $ } from "../lib/misc/util";
import { pw } from "../constants";
import { isMobile } from "pixi.js";
import { areControlsEnabled } from "./dev/studio";
import { playerInteract } from "../lib/md-framework/interact";
import { Joystick } from "../lib/misc/joystick";

const speed = 0.3;
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

const mspeed = 0.08;

export function startControlLoop() {
    var isMoving = false;

    function loop(d: number): void {
        if(!areControlsEnabled) return;
        isMoving = false;

        var finalX = 0;
        var finalY = 0;
        const calcSpeed = (speed * d);

        // if(isMovingLeft) {
        //     finalX -= calcSpeed;
        //     isMoving = true;
        //     mdshell.player.playAnimation("walk-l", mspeed);
        //     lastMoveUDwasUp = false;
        // }

        // if(isMovingRight) {
        //     finalX += calcSpeed;
        //     isMoving = true;
        //     mdshell.player.playAnimation("walk-r", mspeed);
        //     lastMoveUDwasUp = false;
        // }

        // if(isJumping) {
        //     finalY -= calcSpeed;
        //     isMoving = true;
        //     mdshell.player.playAnimation("walk-ud-up", mspeed);
        //     lastMoveUDwasUp = true;
        // }

        // if(isGoingDown) {
        //     finalY += calcSpeed;
        //     isMoving = true;
        //     mdshell.player.playAnimation("walk-ud-down", mspeed);
        //     lastMoveUDwasUp = false;
        // }

        // if(!isMoving) {
        //     //if(lastMoveUDwasUp) mdshell.player.playSprite("stand-ud-up");
        //     //else mdshell.player.playSprite("stand-ud-down");

        // }

        // if(finalX != 0 && finalY != 0) {
        //     finalX = Math.sign(finalX) * calcSpeed / Math.SQRT2;
        //     finalY = Math.sign(finalY) * calcSpeed / Math.SQRT2;
        // }

        // mdshell.player.vx += finalX;
        // mdshell.player.vy += finalY;
    }

    pw.onPhysicsTick = loop;
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

