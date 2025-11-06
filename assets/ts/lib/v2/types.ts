import { AnimatedSprite, Sprite, TilingSprite } from "pixi.js";
import { GMOutput } from "../misc/keymap";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock } from "./blocks/blocks";
import { MD2componentObjType } from "./blocks/components/main";
import { AnimatedTilingSprite } from "../misc/animated-tiles";

export type MDgameGridType = "fg" | "bg" | "overlay";

export interface LevelJSONoutput extends GMOutput {
    rotation: number;
    components?: Record<string, Record<string, any>>;
}

export type AnySprite = Sprite | TilingSprite | AnimatedSprite;

export type AnyTileSprites = TilingSprite | AnimatedTilingSprite;

export interface BlockInfo {
    name: string;
    type?: MDgameGridType;
    texture: string;
    components?: MD2componentObjType;
    isOversize: boolean;
    category: string;
    isAnimated?: boolean;
}

interface ModDataFileBase {
    $schema?: string;
    version: [number, number, number];
}

export interface LevelDataV0_0_0 extends ModDataFileBase {
    blocks: LevelJSONoutput[];
    //background?: BackgroundOpts;
}

export interface ModInfo extends ModDataFileBase {
    name: string;
    blocks: BlockInfo[];
}

export type WorldGrids = Record<MDgameGridType, MDmatrix<AnyBlock>>;

export interface EntityFileInfo extends ModDataFileBase {
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

export type XYtuple = [number, number];

export interface BlockCreationOpts extends XYWH {
    name: string;
    rotation?: number;
    overlay?: boolean;
    //components?: ComponentList;
}

export enum _md2events {
    levelDeleteB = "level delete before",
    levelDeleteA = "level delete after",
};

export type WeakIndices<T extends string> = T | (string & {});

export interface ItemFileInfo extends ModDataFileBase {
    data: Record<string, {
        texture: string;
        onUse: string;
        desc: string;
    }>;
}