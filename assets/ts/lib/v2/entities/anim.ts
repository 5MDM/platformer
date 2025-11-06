import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { _MD2errorManager } from "../errors";
import { _MD2dataManager } from "../data";

export type EntityUDanims = 
"td-walk-d" |
"td-walk-u" |
"td-walk-l" |
"td-walk-r";

export type EntityUDStances = 
"td-stand-u" |
"td-stand-d";

export type BasicEntityAnims = EntityUDanims;

export type BasicEntityStances = EntityUDStances;

export type BasicEntityActions = BasicEntityAnims | BasicEntityStances;

type EntityActionType = "animation" | "stance";

interface ActionContainer {
    name: string;
    type: EntityActionType;
    sprite: Sprite | AnimatedSprite;
};

export interface AnimControlOpts {
}

export class AnimControl {
    entityC: Container;

    lastSprite?: Sprite;
    lastAnim?: AnimatedSprite;
    currentAction: ActionContainer = AnimControl.action("default", new Sprite(Texture.WHITE), "stance");

    private animations: Record<string, [AnimatedSprite, number]> = {};
    private stances: Record<string, Sprite> = {};

    constructor(o: AnimControlOpts, entityC: Container) {
        this.entityC = entityC;
    }

    registerAnimation(name: string, anim: AnimatedSprite, speed: number) {
        this.animations[name] = [anim, speed];
        anim.visible = false;
        this.entityC.addChild(anim);
    }

    registerStance(name: string, stance: Sprite) {
        this.stances[name] = stance;
        stance.visible = false;
        this.entityC.addChild(stance);
    }

    static action(name: string, sprite: Sprite | AnimatedSprite, type: EntityActionType): ActionContainer {
        return {name, sprite, type};
    }

    private clearCurrentAction() {
        if(this.lastSprite) {
            this.lastSprite.visible = false;
            delete this.lastSprite;
        }

        if(this.lastAnim) {
            this.lastAnim.stop();
            this.lastAnim.visible = false;
            delete this.lastAnim;
        }
    }

    setActionIfNotSame(name: string, isAnim: boolean = false) {
        const type: EntityActionType = isAnim ? "animation" : "stance";

        if(this.currentAction.name == name && this.currentAction.type == type) return;
        this.setAction(name, isAnim);
    }


    defaultSpeed = 0.08;
    getAnim(name: string): [AnimatedSprite, number] {
        const anim: undefined | [AnimatedSprite, number] = this.animations[name];
        if(!anim) {
            _MD2errorManager.animationNotFound(name);
            return [new AnimatedSprite([Texture.WHITE]), this.defaultSpeed];
        }
        else return anim;
    }

    getStance(name: string): Sprite {
        const stance: undefined | Sprite = this.stances[name];
        if(!stance) {
            _MD2errorManager.animationNotFound(name);
            return new Sprite(Texture.WHITE);
        }
        else return stance;
    }

    setBasicAction(name: BasicEntityActions, isAnim: boolean = false, animSpeed?: number) {
        this.setAction(name, isAnim, animSpeed);
    }

    setAction(name: string, isAnim: boolean = false, animSpeed?: number) {
        const type: EntityActionType = isAnim ? "animation" : "stance";

        this.clearCurrentAction();
        
        if(isAnim) {
            const [anim, speed] = this.getAnim(name);
            anim.visible = true;

            anim.animationSpeed = animSpeed || speed;
            anim.play();

            this.currentAction = AnimControl.action(name, anim, type);
            this.lastAnim = anim;
        } else {
            const stance = this.getStance(name);
            stance.visible = true;
            this.currentAction = AnimControl.action(name, stance, type);
            this.lastSprite = stance;
        }
    }

    registerAnimationsWithSameSpeed
    (dataManager: _MD2dataManager, speed: number, anims: [string, string | AnimatedSprite][]) {
        for(const [name, textureName] of anims) {
            var anim = textureName;
            if(typeof textureName == "string") anim = dataManager.getAnimation(textureName);

            this.registerAnimation(name, anim as AnimatedSprite, speed);
        }
    }

    destroy() {
        for(const name in this.animations) this.animations[name][0].destroy();
        for(const name in this.stances) this.stances[name].destroy();
    }
}