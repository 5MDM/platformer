import { Assets, BindableTexture, Container, Spritesheet, SpritesheetData, Texture, TextureSource, TilingSprite } from "pixi.js";
import { Keymap } from "./lib/keymap";
import { $, iteratePaths, MDmatrix, ToggleList } from "./lib/util";
import { PWS } from "./lib/pw-objects";
import { enablePlacementMode, setSelectedBlock } from "./game/dev/studio";
import { blockDefs, BlockInfo, blockSize, chunkSize, ModInfo, pw, staticChunks, staticContainer } from "./constants";
import { setPlayerSpawn } from "./main";

const blocksEl = $("#ui > #editor #block-row") as HTMLDivElement;
const data = (await (import.meta.glob<{default: SpritesheetData}>("../spritesheet-data/data.json"))["../spritesheet-data/data.json"]()).default;
const atlasImgUrl = (await (import.meta.glob<{default: string}>("../images/atlas.png"))["../images/atlas.png"]()).default;
const atlasImg = new Image();
export const size = Number(getComputedStyle(blocksEl).getPropertyValue("--img-size").slice(0, -2));
atlasImg.src = atlasImgUrl;
const editorBlocks: HTMLImageElement[] = [];

const ic = new OffscreenCanvas(256, 256);
const ictx = ic.getContext("2d");
if(ictx === null) throw new Error("couldn't get 2d context");

await new Promise(res => {
    atlasImg.onload = res;
});

const spriteSheetTexture: BindableTexture = await Assets.load(atlasImgUrl);

export const spritesheet = new Spritesheet(
    spriteSheetTexture,
    data
);

const spritesheetPr = spritesheet.parse();

export const levelmap = new Keymap();

export async function initMods(): Promise<ToggleList> {
    await spritesheetPr;

    const iterate = await iteratePaths<ModInfo>
    (import.meta.glob<{default: ModInfo}>("../mods/*/manifest.json"), parseMod);

    const list = new ToggleList(editorBlocks, (el) => {
        enablePlacementMode();
        setSelectedBlock(el.getAttribute("data-name")!);
        el.classList.add("toggled");
    }, (el) => {
        el.classList.remove("toggled");
    }, blocksEl);

    return list;
}

export async function parseMod(path: string, mod: ModInfo) {
    levelmap.key("@", (x, y, w, h) => {
        setPlayerSpawn(x * blockSize, y * blockSize);
    });

    for(const block of mod.blocks) {
        if(!spritesheet.textures[block.texture]) throw new Error(block.texture);
        blockDefs[block.texture] = block;
        levelmap.key(block.character, 
            (x, y, w, h) => createBlock(createSprite(block.texture, x, y, w, h), x, y, w, h)
        );

        await addToEditor(block.texture, data.frames[block.texture].frame);
    }
}

async function addToEditor(texture: string, {x, y, w, h}: {x: number, y: number, w: number, h: number}): Promise<void> {
    ic.width = w;
    ic.height = h;
    ictx!.drawImage(atlasImg, x, y, w, h, 0, 0, w, h);

    const blob = await ic.convertToBlob();
    const url = URL.createObjectURL(blob);
    const img = new Image(size, size);

    img.src = url;
    img.onload = () => URL.revokeObjectURL(url);
    img.setAttribute("data-name", texture);
    editorBlocks.push(img);
}

export function createSprite(name: string, x: number, y: number, w: number, h: number): TilingSprite {
    x *= blockSize;
    y *= blockSize;

    const t = getTexture(name);

    const s = new TilingSprite({
        texture: t,
        width: blockSize * w + 1,
        height: blockSize * h + 1,
        position: {x, y},
        roundPixels: true,
        tileScale: {x: blockSize / t.width, y: blockSize / t.height},
    });

    s.clampMargin = 0;

    return s;
}

export function getTexture(name: string): Texture {
    return spritesheet.textures[name];
}

export function createBlock(sprite: TilingSprite, x: number, y: number, w: number, h: number) {
    const obj = new PWS(sprite.x, sprite.y, w * blockSize, h * blockSize);
    obj.sprite = sprite;

    Keymap.IterateGMrect(x, y, w, h, (x, y) => {
        pw.addStatic(x, y, obj);
    });
    
    const chunkX =  Math.floor(obj.x / blockSize / chunkSize);
    const chunkY = Math.floor(obj.y / blockSize / chunkSize);

    const got = staticChunks.get(chunkX, chunkX);
    if(!got) {
        const c = new Container();
        staticChunks.set(chunkX, chunkY, c);
        obj.toContainer(c);
        staticContainer.addChild(c);
    } else {
        obj.toContainer(got);
    }
}
