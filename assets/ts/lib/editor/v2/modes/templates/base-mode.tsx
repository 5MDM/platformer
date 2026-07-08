import { Container, ContainerChild, Graphics, Sprite, Texture } from "pixi.js";
import { DragController } from "../../../../misc/drag";
import { EnableState } from "../../../../misc/enable-state";
import { _MD2engine } from "../../../../v2/engine";
import { MD2zoomModule } from "../../../../v2/modules/zoom";
import { MD2editorV2 } from "../../editor";
import { MDgameGridType, XYtuple } from "../../../../v2/types";
import { snapToGrid } from "../../../../misc/util";
import { MDV } from "../../../../misc/vectors/vectors";
import { AnyBlock, BgBlock, FgBlock } from "../../../../v2/blocks/blocks";
import { MDmatrix } from "../../../../misc/matrix";
import { createSignal, JSXElement, Show } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

export abstract class BaseMode {
    readonly state = new EnableState(() => this.stateSignal[1](true), () => this.stateSignal[1](false));
    readonly stateSignal = createSignal<boolean>(this.state.isEnabled);
    readonly getState = this.stateSignal[0];
    hasModeSettings = false;

    engine: _MD2engine;

    /**The fullscreen transparent div where the user pointer is recorded */
    targetEl: HTMLElement;

    editor: MD2editorV2;

    dragController: DragController;

    zoom: MD2zoomModule;

    abstract iconPath: string;
    abstract modeName: string;

    constructor(editor: MD2editorV2, targetEl: HTMLElement) {
        this.editor = editor;
        this.engine = editor.engine;
        this.targetEl = targetEl;
        this.zoom = this.engine.modules.zoom;

        this.dragController = new DragController({
            touchEl: this.targetEl,
            isMultitouch: false,
            ignorePropogatedEvents: true,
            elementAllowList: ["editor-v2"]
        });

        this.dragController.disable();

        this.dragController.changeDefaultandNormalGrab("default");
        this.dragController.changeDefaultAndNormalGrabbing("pointer");

        const g = new Graphics();
        g.rect(0, 0, this.engine.blockSize + 1, this.engine.blockSize + 1)
        .stroke({
            width: 2,
            color: "yellow"
        });

        this.yellowBorderTexture = this.engine.app.renderer.generateTexture(g);
    }

    getBlockFromEditorGrid<T extends AnyBlock>
    (type: MDgameGridType, [x, y]: MDV.V2): T | undefined {
        const grid = this.editor.editorGrids[type];
        if(grid.isOOB(x, y)) return;
        
        return grid.get(x, y) as T;
    }

    init() {
        this.dragController.enable();
        this.dragController.onDrag = (dx, dy, x, y) => this.triggerDragEvent(x, y, dx, dy);

        if(this.hasModeSettings) 
            this.state.events.on("enabled", () => this.editor.ui.setModeSettingsVisibility(true));
    }

    protected getWorldPos(rx: number, ry: number): [number, number] {
        const {zoomLevel} = this.zoom;
        const {player} = this.engine.generator;

        rx /= zoomLevel;
        rx += player.x - innerWidth / 2 / zoomLevel;
        rx -= player.halfW / zoomLevel - player.halfW;
        rx -= this.editor.levelGroups.world.x;

        ry /= zoomLevel;
        ry += player.y - innerHeight / 2 / zoomLevel;
        ry -= player.halfH / zoomLevel - player.halfH;
        ry -= this.editor.levelGroups.world.y;

        return [rx, ry];
    }

    snapToGridFromScreen(
        [x, y]: XYtuple, 
        pos: {x: number, y: number} = this.engine.levelManager.groups.view
    ): XYtuple {
        return [snapToGrid(
            x,
            pos.x,
            this.engine.blockSize
        ), snapToGrid(
            y,
            pos.y, 
            this.engine.blockSize
        )];
    }

    private triggerDragEvent(rx: number, ry: number, dx: number, dy: number) {
        if(!this.state.isEnabled) return;

        const [x, y] = this.snapToGridFromScreen(this.getWorldPos(rx, ry),
            this.editor.engine.levelManager.groups.static
        );

        this.onDrag(new MDV.V2(x, y).divideS(this.engine.blockSize), new MDV.V2(dx, dy));
    }

    abstract onDrag(blockPos: MDV.V2, pointerPosChange: MDV.V2): void;

    yellowBorderTexture: Texture;

    protected addModeSettingsEl(el: JSXElement) {
        this.editor.ui.editorModeSettingsElementArray.push(
            <Show when={this.getState()}>{el}</Show>
        );
    }

    blockTools = {
        self: this,
        isSpaceEmpty(gridName: MDgameGridType, gridPos: MDV.V2): boolean {
            const grid = this.self.editor.editorGrids[gridName];
            const block = grid.get(gridPos.x, gridPos.y);

            return block == undefined;
        },
        isSpaceEmptyOnAllGrids(gridPos: MDV.V2): boolean {
            var isEmpty = true;
            this.self.editor.forEachGrid(g => {
                if(g.get(gridPos.x, gridPos.y)) isEmpty = false;
            });

            return isEmpty;
        },
        createSingleBlock(name: string, gridPos: MDV.V2, rotation = 0, record = false) {
            return this.createBlock(name, new MDV.V4(...gridPos, 1, 1), rotation, record);
        },
        createBlock(
            name: string, [x, y, w, h]: MDV.V4, rotation: number = 0, record = false
        ): AnyBlock | false {
            const block = this.self.editor.engine.generator
            .createAndReturnBlock({name, x, y, w, h, rotation}, record);
            const bz = this.self.engine.blockSize;
            const bzh = this.self.engine.blockSizeHalf;

            const ye = new Sprite(this.self.yellowBorderTexture);
            ye.position.set(x * bz, y * bz);

            if(block) {
                block.container.x += bzh;
                block.container.addChild(ye);
            }

            return block;
        },
        createBlockAndRecordInEditor<T extends AnyBlock>(
            name: string, 
            box: MDV.V4, 
            rotation: number = 0
        ): T | false {
            const block = this.createBlock(name, box, rotation) as (T | false);
            if(!block) return false;

            this.self.editor.c.addChild(block.container);
            (this.self.editor.editorGrids[block.type] as MDmatrix<T>).set(box.x, box.y, block);
            return block;
        },
        isOOB([x, y]: XYtuple): boolean {return this.self.editor.editorGrids.bg.isOOB(x, y)},
        createSingleBlockAndRecordInEditor<T extends AnyBlock>(
            name: string, 
            [x, y]: MDV.V2, 
            rotation: number = 0
        ): T | false {
            const block = this.createBlock(name, new MDV.V4(x, y, 1, 1), rotation) as (T | false);
            if(!block) return false;

            this.self.editor.c.addChild(block.container);

            (this.self.editor.editorGrids[block.type] as MDmatrix<T>).set(x, y, block);
            return block;
        },
        getGrid(type: MDgameGridType) {return this.self.editor.editorGrids[type]},
        deleteSingleBlockInEditor(type: MDgameGridType, gridPos: MDV.V2) {
            const g = this.getGrid(type);
            const b = g.get(gridPos.x, gridPos.y);
            if(!b) return;

            this.self.editor.c.removeChild(b.container, b.sprite);
            g.delete(gridPos.x, gridPos.y);
        },
        getWorldBlocks<T extends MDgameGridType[]>(types: T, [x, y]: MDV.V2)
        : GridTypeBlocks {
            const o: Partial<GridTypeBlocks> = {};
            for(const type of types) {
                const grid = this.self.engine.levelManager.levelGrids[type];
                const block = grid.get(x, y) || false;
                o[type] = block as (FgBlock & BgBlock) | undefined;
            }

            return o as GridTypeBlocks;
        },
        getEditorBlocks<T extends MDgameGridType[]>(types: T, [x, y]: MDV.V2)
        : GridTypeBlocks {
            const o: Partial<GridTypeBlocks> = {};
            for(const type of types) {
                const grid = this.self.editor.editorGrids[type];
                const block = grid.get(x, y) || false;
                o[type] = block as (FgBlock & BgBlock) | undefined;
            }

            return o as GridTypeBlocks;
        }
    };
}

interface GridTypeBlocks {
    fg: FgBlock | undefined;
    bg: BgBlock | undefined;
    overlay: BgBlock | undefined;
}