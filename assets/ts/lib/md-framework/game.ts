import { Container } from "pixi.js";
import { $, MDmatrix, radToDeg, ToggleState } from "../util";
import { BgObj, FgObj, LevelJSONoutput } from "./shell";

export interface GridBlockData {
    name: string;
    id: number;
    type: string;
}

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
    grids: Record<MDgameGridType, MDmatrix<GridBlockData>>;
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
        fg: Record<number, FgObj>;
        bg: Record<number, BgObj>;
        overlay: Record<number, BgObj>;
    } = {
        fg: {},
        bg: {},
        overlay: {},
    };

    clearAndDestroyItems() {
        for(const id in this.blocks.fg) {
            const block = this.blocks.fg[id];
            this.container
            block.pwb.destroy();

            delete this.blocks.fg[id];
        }

        for(const id in this.blocks.bg) {
            const block = this.blocks.bg[id];
            block.sprite.destroy();

            delete this.blocks.bg[id];
        }

        for(const id in this.blocks.overlay) {
            const block = this.blocks.overlay[id];
            block.sprite.destroy();

            delete this.blocks.overlay[id];
        }

        this.grids.bg.clear();
        this.grids.fg.clear();
        this.grids.overlay.clear();

        this.endDialogue();
        
    }

    iterateFGblocks(f: (block: FgObj, id: string) => void) {
        for(const id in this.blocks.fg)
            f(this.blocks.fg[id], id);
    }

    iterateBGblocks(f: (block: BgObj, id: string) => void) {
        for(const id in this.blocks.bg)
            f(this.blocks.bg[id], id);
    }    

    iterateOverlayblocks(f: (block: BgObj, id: string) => void) {
        for(const id in this.blocks.overlay)
            f(this.blocks.overlay[id], id);
    }

    getBlocksAsArray(): LevelJSONoutput[] {
        const arr: LevelJSONoutput[] = [];

        this.iterateFGblocks(({x, y, w, h, rotation, type}) => {
            arr.push({x, y, w, h, rotation: radToDeg(rotation), type});
        });

        this.iterateBGblocks(({x, y, w, h, rotation, type}) => {
            arr.push({x, y, w, h, rotation: radToDeg(rotation), type});
        });

        this.iterateOverlayblocks(({x, y, w, h, rotation, type}) => {
            arr.push({x, y, w, h, rotation: radToDeg(rotation), type});
        });

        return arr;
    }

    constructor(o: MDgameOpts) {
        this.gameType = o.gameType;
        this.grids = {
            fg: new MDmatrix<GridBlockData>(o.maxLevelWidth, o.maxLevelHeight),
            bg: new MDmatrix<GridBlockData>(o.maxLevelWidth, o.maxLevelHeight),
            overlay: new MDmatrix<GridBlockData>(o.maxLevelWidth, o.maxLevelHeight),
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