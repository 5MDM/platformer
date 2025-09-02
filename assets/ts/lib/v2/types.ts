import { GMOutput } from "../misc/keymap";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock } from "./block";

export type MDgameGridType = "fg" | "bg" | "overlay";

export interface LevelJSONoutput extends GMOutput {
    rotation: number;
    //components?: ComponentList;
}

export interface BlockInfo {
    name: string;
    type?: MDgameGridType;
    texture: string;
    //components?: ComponentList;
    isOversize: boolean;
    category: string;
}

export interface LevelDataV0_0_0 {
    version: [number, number, number];
    blocks: LevelJSONoutput[];
    //background?: BackgroundOpts;
}

export interface ModInfo {
    name: string;
    blocks: BlockInfo[];
    version: [number, number, number];
}

export type WorldGrids = Record<MDgameGridType, MDmatrix<AnyBlock>>;

export interface EntityFileInfo {
    version: [number, number, number];
    entities: Record<string, EntityInfo>;
}

export interface EntityInfo {
    name: string;
    textures: Record<string, string>;
}

export interface XYWH {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface BlockCreationOpts extends XYWH {
    name: string;
    rotation?: number;
    overlay?: boolean;
    //components?: ComponentList;
}