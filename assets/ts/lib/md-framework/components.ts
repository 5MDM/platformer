import { MDgame } from "./game";
import { touchingBlocks } from "./interact";
import { MDshell } from "./shell";
import { Sprite } from "pixi.js";
import { FgBlock } from "./unit";

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

export function checkIfComponentsAreEqual
(obj1: Record<string, Record<string, any>>, obj2: Record<string, Record<string, any>>): boolean {
    const componentList: Record<string, true> = {};

    for(const component in obj1) componentList[component] = true;

    for(const component in obj2)
        if(!componentList[component]) return false;
    
    for(const component in obj1)
        for(const prop in obj1[component]) {
            const prop1 = obj1[component][prop];
            const prop2 = obj2[component]?.[prop];

            if(prop1 != prop2) return false;
        }


    return true;
}

export function parseBlockComponents(mdshell: MDshell, game: MDgame, components: BlockComponent, id: number) {
    const fgObj = game.blocks.fg[id];

    if(components.door) parseDoor(mdshell, game, components, fgObj);

    if(components.interact) parseInteract(mdshell, game, components, fgObj);

    if(components.doorpoint) parseDoorpoint(mdshell, components, fgObj);
}

function parseDoorpoint(mdshell: MDshell, components: BlockComponent, {pws}: FgBlock) {
    var hasCollided = false;

    pws.onCollide.push(() => {
        if(hasCollided) return;
        hasCollided = true;
        
        mdshell.destroyCurrentLevel();
        mdshell.setCurrentLevel(components.doorpoint!.toLevel);
    });
}

function parseDoor(mdshell: MDshell, game: MDgame, components: BlockComponent, {pws}: FgBlock) {
    const ogTextureName = pws.type;
    const {onOpen} = components.door as DoorComponent;

    pws.hasCollisionLeaveEvents = true;
    var isOpen = false;

    pws.onCollide.push(o => {
        if(!isOpen) {
            isOpen = true;
            o.sprite!.texture = mdshell.getTexture(onOpen);
        }

        return true;
    });

    pws.onCollisionLeave.push(o => {
        if(isOpen) {
            isOpen = false;
            o.sprite!.texture = mdshell.getTexture(ogTextureName);
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

function parseInteract(mdshell: MDshell, game: MDgame, components: BlockComponent, {pws}: FgBlock) {
    if(!isQuestionSpriteDefined) {
        isQuestionSpriteDefined = true;
        questionSprite.texture = mdshell.getTexture("question.png");
        mdshell.game.container.addChild(questionSprite);
    }

    pws.hasCollisionLeaveEvents = true;

    pws.onCollide.push(() => {
        touchingBlocks[pws.id] = components.interact!;

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
}