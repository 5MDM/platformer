import { Sprite } from "pixi.js";
import { MDshell } from "../shell";
import { FgBlock } from "../unit";
import { _MDcomponentParser } from "./parser";
import { touchingBlocks } from "../interact";

const questionSprite = new Sprite({
    x: innerWidth / 2,
    y: innerHeight / 2 - 55,
    anchor: 0.5,
    visible: false,
    width: 40,
    height: 40,
});

var isQuestionSpriteDefined = false;
var isNearInteraction = false;

export interface InteractComponent {
    text: string;
}

_MDcomponentParser.componentDefs.interact = function(mdshell: MDshell, {pws}: FgBlock, component: InteractComponent) {
    if(!isQuestionSpriteDefined) {
        isQuestionSpriteDefined = true;
        questionSprite.texture = mdshell.getTexture("question.png");
        mdshell.game.container.addChild(questionSprite);
    }

    pws.hasCollisionLeaveEvents = true;

    pws.onCollide.push(() => {
        touchingBlocks[pws.id] = component as unknown as InteractComponent;

        if(!isNearInteraction) {
            isNearInteraction = true;
            questionSprite.visible = true;
        }
    });

    pws.onCollisionLeave.push(() => {
        delete touchingBlocks[pws.id];

        if(isNearInteraction) {
            if(Object.keys(touchingBlocks).length != 0) return;

            isNearInteraction = false;
            questionSprite.visible = false;
        }
    });
};