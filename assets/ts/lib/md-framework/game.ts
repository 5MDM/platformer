import { Container } from "pixi.js";
import { MDmatrix } from "../util";

export interface GridBlockData {
    name: string;
    id: number;
    type: string;
}

export interface MDgameOpts {
    maxLevelWidth: number;
    maxLevelHeight: number;
    gameType: MDgameType;
    c: Container;
}

export type MDgameType = "td" | "side";
type MDgameGridType = "fg" | "bg";

export class MDgame {
    container = new Container();
    gameType: MDgameType;
    spawnX: number = 0;
    spawnY: number = 0;
    grids: Record<MDgameGridType, MDmatrix<GridBlockData>>;
    groups: Record<string, Container> = {
        bg: new Container(),
        fg: new Container(),
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

        this.container.addChild(this.groups.bg);
        this.container.addChild(this.groups.fg);
        
        o.c.addChild(this.container);
    }

    getNewId(): number {return this.idCounter++}

    setSpawn(x: number, y: number) {
        this.spawnX = x;
        this.spawnY = y;
    }
}