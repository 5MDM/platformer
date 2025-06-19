import { Container } from "pixi.js";
import { $, MDmatrix, ToggleState } from "../util";
import { PWB, PWS } from "../pw-objects";
import { BgObj, FgObj, MDshell } from "./shell";

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
type MDgameGridType = "fg" | "bg";

// world container -> view -> static -> bg and fg

export class MDgame {
    dialogueElement = $("#ui > #dialogue > #dialogue-c");
    dialogueParagraphElement = $("#ui > #dialogue > #dialogue-c > #text") as HTMLParagraphElement;

    pwObjects: Record<number, FgObj> = {};
    bgObjects: Record<number, BgObj> = {};

    container = new Container();
    gameType: MDgameType;
    spawnX: number = 0;
    spawnY: number = 0;
    grids: Record<MDgameGridType, MDmatrix<GridBlockData>>;
    groups = {
        bg: new Container(),
        fg: new Container(),
        static: new Container(),
        view: new Container(),
        world: new Container(), 
    };
    editGrid: MDmatrix<string>;

    private idCounter = 0;

    constructor(o: MDgameOpts) {
        this.gameType = o.gameType;
        this.grids = {
            fg: new MDmatrix<GridBlockData>(o.maxLevelWidth, o.maxLevelHeight),
            bg: new MDmatrix<GridBlockData>(o.maxLevelWidth, o.maxLevelHeight),
        };

        this.editGrid = new MDmatrix<string>(o.maxLevelWidth, o.maxLevelHeight);

        this.groups.static.addChild(this.groups.bg);
        this.groups.static.addChild(this.groups.fg);
        this.groups.view.addChild(this.groups.static);
        this.groups.world.addChild(this.groups.view);
        
        this.container.addChild(this.groups.world);       

        /*addEventListener("keydown", e => {
            if(e.key == "Enter") {
                this.dialogueParagraphElement.textContent = "(no text)";
                this.dialogueElement.style.display = "none";
            }
        });*/
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