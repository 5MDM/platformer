import { Sprite, Texture } from "pixi.js";
import { MDmatrix } from "../../../misc/matrix";
import { MDV } from "../../../misc/vectors/vectors";
import { MDgameGridType } from "../../../v2/types";
import { BaseMode } from "./templates/base-mode";
import { MD2editorV2 } from "../editor";
import { SelectItemDiv } from "../../../misc/el/select";
import { createSignal } from "solid-js";

interface GridFiller {
    types: MDgameGridType[];
    sprite: Sprite;
}

export class Delete extends BaseMode {
    iconPath: string = "";
    modeName: string = "Delete";

    readonly deleteGrid = 
    new MDmatrix<GridFiller>(MD2editorV2.maxLevelSize, MD2editorV2.maxLevelSize);

    readonly chosenWorldSignal = createSignal<"world" | "editor">("world");
    readonly getChosenWorld = this.chosenWorldSignal[0];

    hasModeSettings: boolean = true;

    init(): void {
        super.init();

        this.engine._editorOn("save-changes", () => {
            this.deleteGrid.advForEach(({types}, [x, y]) => {
                for(const gridType of types) {
                    this.engine.deletor.deleteBlockByWorldPos(gridType, x, y);
                }
                return true;
            });
        });

        this.engine._editorOn("cancel-changes", () => {
            this.deleteGrid.forEach(({sprite}) => 
                sprite.destroy()
            );
            this.deleteGrid.clear();
        });

        this.addModeSettingsEl(
            <SelectItemDiv itemSignal={this.chosenWorldSignal}>{setSelectedItem => <>
                <button 
                    onClick={() => setSelectedItem("world")} 
                    class={this.getChosenWorld() == "world" ? "selected" : undefined}>
                    Delete in world
                </button>
                <button 
                    onClick={() => setSelectedItem("editor")} 
                    class={this.getChosenWorld() == "editor" ? "selected" : undefined}>
                    Delete in editor
                </button>
            </>}</SelectItemDiv>
        );
    }

    onWorldDelete(blockPos: MDV.V2) {
        const dg = this.deleteGrid;
        const blocks = this.blockTools.getWorldBlocks(["overlay", "fg", "bg"], blockPos);

        for(const nameUntyped in blocks) {
            const name = nameUntyped as MDgameGridType;

            const block = blocks[name];
            if(!block) continue;

            const bSize = this.editor.engine.blockSize;

            const o: GridFiller | undefined = dg.get(blockPos.x, blockPos.y);
            if(!o) {
                const s = new Sprite({
                    texture: Texture.WHITE,
                    tint: 0xff0000,
                    alpha: .3,
                    position: blockPos.clone().multiplyS(bSize),
                    width: bSize,
                    height: bSize,
                });

                this.editor.c.addChild(s);

                dg.set(blockPos.x, blockPos.y, {
                    types: [name],
                    sprite: s
                });
            }
            else o.types.push(name);
        }
    }

    onEditorDelete(blockPos: MDV.V2) {
        for(const type of ["fg", "bg", "overlay"]) {
            this.blockTools.deleteSingleBlockInEditor(type as MDgameGridType, blockPos);

            const grid = this.deleteGrid.get(blockPos.x, blockPos.y);
            if(grid) {
                grid.sprite.destroy();
                this.deleteGrid.delete(blockPos.x, blockPos.y);
            }
        }
    }

    onDrag(blockPos: MDV.V2, pointerPosChange: MDV.V2): void {
        if(this.getChosenWorld() == "world") this.onWorldDelete(blockPos);
        else this.onEditorDelete(blockPos);
    }
}