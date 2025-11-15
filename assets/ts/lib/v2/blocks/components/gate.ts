import { Sprite, Texture } from "pixi.js";
import { _MD2engine } from "../../engine";
import { ContinueCollisionResolution, MD2componentModule } from "./main";
import { MD2componentManager } from "./main-manager";
import { MD2item } from "../../items/item";
import { MD2tweenOnce } from "../../../misc/tweener";
import { AnySprite } from "../../types";

type MD2gateOpeningF = (md2: _MD2engine) => boolean;

export interface GateOpts {
    isRestrictive?: boolean;
    needsItems: string[];
    sound?: string;
    onOpen?: string;
}

export class MD2gateComponent extends MD2componentModule {
    isUnlocked = false;

    openingConditions: Record<string, MD2gateOpeningF> = {};
    isRestrictive = false;
    fadeToNothing = false;
    isOpening = false;

    openTexture: Texture;

    constructor(manager: MD2componentManager, opts: Record<string, any>) {
        super(manager, opts);
        this.opts = opts as GateOpts;

        if(this.opts.onOpen) {
            this.openTexture = MD2componentManager.md2.dataManager.getTexture(this.opts.onOpen);
        } else {
            this.fadeToNothing = true;
            this.openTexture = Texture.EMPTY;
        }

        this.addCondition("item-checker", md2 => {
            if(this.isRestrictive) {
                const arr: MD2item[] = [];

                for(const name of this.opts.needsItems) {
                    const item = md2.dataManager.getItem(name);
                    if(!item) return false;

                    arr.push(item);
                } 

                for(const item of arr) md2.dataManager.consumeItem(item);

                return true;
            } else {
                for(const name of this.opts.needsItems) {
                    const item = md2.dataManager.getItem(name);

                    if(!item) continue;

                    md2.dataManager.consumeItem(item);
                    return true;
                } 

                return false;
            }
        });
    }

    addCondition(name: string, f: MD2gateOpeningF) {
        this.openingConditions[name] = f;
    }

    onCollide(md2: _MD2engine): ContinueCollisionResolution {
        if(this.isUnlocked) return false;
        else if(this.isOpening) return true;

        if(this.canBecomeUnlocked(md2)) {
            this.isOpening = true;
            if(this.fadeToNothing) {
                MD2tweenOnce<AnySprite>(this.manager.block.sprite, (s, prg) => {
                    s.alpha = prg;
                }, 2000, () => this.isUnlocked = true);
            } else {
                this.manager.block.sprite.texture = this.openTexture;
                this.isUnlocked = true;
            }

            return true;

        } else return true;
    }

    canBecomeUnlocked(md2: _MD2engine): boolean {
        if(this.isRestrictive) {
            // all functions need to be true
            for(const name in this.openingConditions) {
                const f = this.openingConditions[name];

                if(!f(md2)) return false;
            }

            return true;
        } else {
            // at least one function needs to be true
            for(const name in this.openingConditions) {
                const f = this.openingConditions[name];

                if(f(md2)) return true;
            }

            return false;
        }
    }


}