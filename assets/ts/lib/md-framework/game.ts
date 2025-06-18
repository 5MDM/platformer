import { Container } from "pixi.js";
import { MDmatrix } from "../util";
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
    }

    getNewId(): number {return this.idCounter++}

    setSpawn(x: number, y: number) {
        this.spawnX = x;
        this.spawnY = y;
    }

    startPlayerDialogue(text: string) {
        alert(text);
    }
}