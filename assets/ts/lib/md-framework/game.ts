import { Container } from "pixi.js";
import { $, radToDeg, ToggleState } from "../util";
import { MDmatrix } from "../matrix";
import { LevelJSONoutput, MDshell } from "./shell";
import { BgBlock, FgBlock } from "./unit";

export interface MDgameOpts {
    maxLevelWidth: number;
    maxLevelHeight: number;
    gameType: MDgameType;
}

export type MDgameType = "td" | "side";
export type MDgameGridType = "fg" | "bg" | "overlay";

// world container -> view -> static -> bg and fg

export class MDgame {
    dialogueElement = $("#ui > #dialogue > #dialogue-c");
    dialogueParagraphElement = $("#ui > #dialogue > #dialogue-c > #text") as HTMLParagraphElement;

    //pwObjects: Record<number, FgObj> = {};
    //bgObjects: Record<number, BgObj> = {};

    container = new Container();
    gameType: MDgameType;
    spawnX: number = 0;
    spawnY: number = 0;
    grids: {
        fg: MDmatrix<FgBlock>;
        bg: MDmatrix<BgBlock>;
        overlay: MDmatrix<BgBlock>;
    };
    groups = {
        bg: new Container(),
        fg: new Container(),
        overlay: new Container(),
        static: new Container(),
        view: new Container(),
        world: new Container(), 
    };
    editGrid: MDmatrix<string>;

    private idCounter = 0;

    blocks: {
        fg: Record<number, FgBlock>;
        bg: Record<number, BgBlock>;
        overlay: Record<number, BgBlock>;
    } = {
        fg: {},
        bg: {},
        overlay: {},
    };

    clearAndDestroyItems() {
        for(const id in this.blocks.fg) {
            const block = this.blocks.fg[id];
            block.destroy();

            delete this.blocks.fg[id];
        }

        for(const id in this.blocks.bg) {
            const block = this.blocks.bg[id];
            block.destroy();

            delete this.blocks.bg[id];
        }

        for(const id in this.blocks.overlay) {
            const block = this.blocks.overlay[id];
            block.destroy();

            delete this.blocks.overlay[id];
        }

        this.grids.bg.clear();
        this.grids.fg.clear();
        this.grids.overlay.clear();

        this.endDialogue();
        
    }

    iterateFGblocks(f: (block: FgBlock, id: string) => void) {
        for(const id in this.blocks.fg)
            f(this.blocks.fg[id], id);
    }

    iterateBGblocks(f: (block: BgBlock, id: string) => void) {
        for(const id in this.blocks.bg)
            f(this.blocks.bg[id], id);
    }    

    iterateOverlayblocks(f: (block: BgBlock, id: string) => void) {
        for(const id in this.blocks.overlay)
            f(this.blocks.overlay[id], id);
    }

    getBlocksAsArray(): LevelJSONoutput[] {
        const arr: LevelJSONoutput[] = [];

        this.iterateFGblocks(({x, y, w, h, rotation, name}) => {
            arr.push({x, y, w, h, rotation: radToDeg(rotation), type: name});
        });

        this.iterateBGblocks(({x, y, w, h, rotation, name}) => {
            arr.push({x, y, w, h, rotation: radToDeg(rotation), type: name});
        });

        this.iterateOverlayblocks(({x, y, w, h, rotation, name}) => {
            arr.push({x, y, w, h, rotation: radToDeg(rotation), type: name});
        });

        return arr;
    }

    constructor(o: MDgameOpts) {
        this.gameType = o.gameType;
        this.grids = {
            fg: new MDmatrix<FgBlock>(o.maxLevelWidth, o.maxLevelHeight),
            bg: new MDmatrix<BgBlock>(o.maxLevelWidth, o.maxLevelHeight),
            overlay: new MDmatrix<BgBlock>(o.maxLevelWidth, o.maxLevelHeight),
        };

        this.editGrid = new MDmatrix<string>(o.maxLevelWidth, o.maxLevelHeight);

        this.groups.static.addChild(this.groups.bg);
        this.groups.static.addChild(this.groups.fg);
        this.groups.static.addChild(this.groups.overlay);
        this.groups.view.addChild(this.groups.static);
        this.groups.world.addChild(this.groups.view);
        
        this.container.addChild(this.groups.world);       
    }

    getNewId(): number {return this.idCounter++}

    setSpawn(x: number, y: number) {
        this.spawnX = x;
        this.spawnY = y;
    }

    currentDialogue = "(no text)";

    toggleDialogue(text: string = "(no text)") {
        this.currentDialogue = text;
        this.playerDialogueState.toggle();
    }

    endDialogue(): boolean {
        if(this.playerDialogueState.isToggled) {
            this.playerDialogueState.toggle();
            return true;
        }

        return false;
    }

    private playerDialogueState = new ToggleState(() => {
        this.dialogueParagraphElement.textContent = this.currentDialogue;
        this.dialogueElement.style.display = "block";
    }, () => {
        this.dialogueParagraphElement.textContent = "(no text)";
        this.dialogueElement.style.display = "none";
    });
}