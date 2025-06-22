import { disableControls } from "../../game/controls";
import { MDgame } from "./game";
import { touchingBlocks } from "./interact";
import { FgObj, MDshell } from "./shell";
import { Sprite } from "pixi.js";

export interface BlockComponent {
    door?: DoorComponent;
    interact?: InteractComponent;
    doorpoint?: DoorpointComponent;
}

interface DoorpointComponent {
    toLevel: string;
}

interface DoorComponent {
    onOpen: string;
}

export interface InteractComponent {
    text: string;
}

export function parseBlockComponents(mdshell: MDshell, game: MDgame, components: BlockComponent, id: number) {
    const fgObj = game.blocks.fg[id];

    if(components.door) parseDoor(mdshell, game, components, fgObj);

    if(components.interact) parseInteract(mdshell, game, components, fgObj);

    if(components.doorpoint) parseDoorpoint(mdshell, components, fgObj);
}

function parseDoorpoint(mdshell: MDshell, components: BlockComponent, {pwb}: FgObj) {
    var hasCollided = false;

    pwb.onCollide.push(() => {
        if(hasCollided) return;
        hasCollided = true;
        
        mdshell.destroyCurrentLevel();
        mdshell.setCurrentLevel(components.doorpoint!.toLevel);
    });
}

function parseDoor(mdshell: MDshell, game: MDgame, components: BlockComponent, {pwb}: FgObj) {
    const ogTextureName = pwb.type;
    const {onOpen} = components.door as DoorComponent;

    pwb.hasCollisionLeaveEvents = true;
    var isOpen = false;

    pwb.onCollide.push(pws => {
        if(!isOpen) {
            isOpen = true;
            pws.sprite!.texture = mdshell.getTexture(onOpen);
        }

        return true;
    });

    pwb.onCollisionLeave.push(pws => {
        if(isOpen) {
            isOpen = false;
            pws.sprite!.texture = mdshell.getTexture(ogTextureName);
        }
    });
}

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
function parseInteract(mdshell: MDshell, game: MDgame, components: BlockComponent, {pwb}: FgObj) {
    if(!isQuestionSpriteDefined) {
        isQuestionSpriteDefined = true;
        questionSprite.texture = mdshell.getTexture("question.png");
        mdshell.game.container.addChild(questionSprite);
    }

    pwb.hasCollisionLeaveEvents = true;

    pwb.onCollide.push(() => {
        touchingBlocks[pwb.id] = components.interact!;

        if(!isNearInteraction) {
            isNearInteraction = true;
            questionSprite.visible = true;
        }
    });

    pwb.onCollisionLeave.push(() => {
        delete touchingBlocks[pwb.id];

        if(isNearInteraction) {
            if(Object.keys(touchingBlocks).length != 0) return;

            isNearInteraction = false;
            questionSprite.visible = false;
        }
    });
}