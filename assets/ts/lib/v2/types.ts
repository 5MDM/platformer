import { ComponentList } from "../md-framework/block-components/parser";
import { MDgameGridType } from "../md-framework/game";
import { BackgroundOpts } from "../md-framework/level-gen";
import { GMOutput } from "../misc/keymap";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock } from "./block";


export interface LevelJSONoutput extends GMOutput {
    rotation: number;
    components?: ComponentList;
}

export interface BlockInfo {
    name: string;
    type?: MDgameGridType;
    texture: string;
    components?: ComponentList;
    isOversize: boolean;
    category: string;
}

export interface LevelDataV0_0_0 {
    version: [number, number, number];
    blocks: LevelJSONoutput[];
    background?: BackgroundOpts;
}

export interface ModInfo {
    name: string;
    blocks: BlockInfo[];
    version: [number, number, number];
}

export type WorldGrids = Record<MDgameGridType, MDmatrix<AnyBlock>>;