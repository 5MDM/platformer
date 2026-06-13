import { Container, Sprite, Texture, TilingSprite } from "pixi.js";
import { _MD2engine } from "../v2/engine";
import { MDcreatorToolsUI } from "./creator-tools";
import { editorClickArea } from "./el";
import { degToRad, RotationHolder, SimpleExpander, snapToGrid, ToggleState } from "../misc/util";
import { _MD2editorClick } from "./modes/click";
import { Player } from "../v2/entities/player";
import { MDmatrix } from "../misc/matrix";
import { AnyBlock, BasicBox } from "../v2/blocks/blocks";
import { _utilBar } from "./util-bar";
import { _MD2deleteClick } from "./modes/delete";
import { _MD2editorBase } from "./modes/main";
import { _md2events, MDgameGridType, WeakIndices, XYtuple, XYWH } from "../v2/types";
import { _MD2editorMulti } from "./modes/multi";
import { _MD2editorPan } from "./modes/pan";
import { _MD2editMode } from "./modes/edit";
import { _MD2filterMode } from "./modes/filter";
import { _MD2editLevelMode } from "./modes/edit-level";
import { EditorRegionShadows } from "./modes/regions/shadows";
import { createSignal, JSX } from "solid-js";
import { MDCTUI } from "./v2/main-ui";

export interface MD2editorOpts {
    engine: _MD2engine;
    el: HTMLDivElement;
}

export const _editorGridBlocks: HTMLElement[] = [];

export function _setEditorGridBlocks(e: HTMLElement[]) {
    _editorGridBlocks.push(...e);
}

export type EditorStates = "click" | "delete" | "multiEdit" | "pan" | "edit"
| "filter" | "editLevel" | "shade";

export class MD2editor {
    engine: _MD2engine;
    player: Player;

    selectedBlock = "";
    selectedBlockType: MDgameGridType = "fg";
    selectedEntity = "";
    isEntitySelected = false;

    ui: MDcreatorToolsUI;
    newUi: MDCTUI;

    testSprite: TilingSprite | Sprite;

    static EditClassStates: Record<EditorStates, typeof _MD2editorBase> = {
        click:  _MD2editorClick,
        delete: _MD2deleteClick,
        multiEdit: _MD2editorMulti,
        pan: _MD2editorPan,
        edit: _MD2editMode,
        filter: _MD2filterMode,
        editLevel: _MD2editLevelMode,
        shade: EditorRegionShadows,
    };

    editStates: Record<EditorStates, _MD2editorBase>;

    container = new Container();

    levelContainer: Container;
    levelGroups: Record<string, Container>;

    static maxLevelSize = 1024;

    grids: Record<MDgameGridType, MDmatrix<AnyBlock>> = {
        fg: new MDmatrix(MD2editor.maxLevelSize, MD2editor.maxLevelSize),
        bg: new MDmatrix(MD2editor.maxLevelSize, MD2editor.maxLevelSize),
        overlay: new MDmatrix(MD2editor.maxLevelSize, MD2editor.maxLevelSize),
    };

    activateEditorMode: _MD2editorBase;

    list: Record<number, AnyBlock> = {};

    rotation = new RotationHolder();

    static creatorToolsState = new ToggleState(() => {
        MDcreatorToolsUI.visibilitySignal[1](true);
        //MDcreatorToolsUI.creatorToolsEl.style.display = "grid";
        //MDcreatorToolsUI.creatorToolsEl.parentElement!.classList.remove("disabled");
    }, () => {
        MDcreatorToolsUI.visibilitySignal[1](false);
        //MDcreatorToolsUI.creatorToolsEl.style.display = "none";
        //MDcreatorToolsUI.creatorToolsEl.parentElement!.classList.add("disabled");
    }, true);

    constructor(o: MD2editorOpts) {
        this.engine = o.engine;
        this.levelContainer = this.engine.levelManager.container;
        this.levelGroups = this.engine.levelManager.groups;
        this.player = this.engine.generator.player;

        this.ui = new MDcreatorToolsUI(this);
        //this.ui.bindTo(o.el);

        this.engine.initPromise.then(() => this.init());

        this.ui.onGridButtonSelect = ((type: string, name: string) => {
            if(type == "block") this.onBlockSelect(name);
            else if(type == "entity") this.onEntitySelect(name);
        });

        this.testSprite = new TilingSprite({
            width: this.engine.blockSize,
            height: this.engine.blockSize,
            texture: Texture.EMPTY,
            alpha: 0.5,
        });

        this.editStates = {} as Record<EditorStates, _MD2editorBase>;
        for(const name in MD2editor.EditClassStates) {
            this.editStates[name] = 
            new(MD2editor.EditClassStates[name] as typeof _MD2editorBase)(this, editorClickArea);

            this.engine.initPromise.then(() => this.editStates[name].init());
        }

        this.activateEditorMode = this.editStates.click;
        this.editStates.click.state.enableIfOff();
        this.editStates.click.init();

        this.engine.levelManager.groups.static.addChild(this.container);

        this.engine._editorOn("save-changes", () => this.saveChanges());
        this.engine._editorOn("cancel-changes", () => this.cancelChanges());
        this.engine._editorOn("toggle-creator-tools", () => {
            MD2editor.creatorToolsState.toggle();

            if(MD2editor.creatorToolsState.isToggled) {
                this.activateEditorMode.state.enableIfOff();
                this.testSprite.visible = true;
            } else {
                this.activateEditorMode.state.disableIfOn();
                this.testSprite.visible = false;
            }
        });

        this.engine._editorOn("rotate-left", () => this.rotateLeft());
        this.engine._editorOn("rotate-right", () => this.rotateRight());

        new SimpleExpander<EditorStates, void>(str => {
            this.engine._editorOn(str, this.setupEditorModeEventListener(this.editStates[str]));
        }).parse([
            "click",
            "multiEdit",
            "delete",
            "edit",
            "shade",
            "pan",
            "editLevel"
        ]);

        this.engine._editorOn("zoom out", () => this.engine.modules.zoom.zoomOut(50));
        this.engine._editorOn("zoom in", () => this.engine.modules.zoom.zoomIn(50));

        this.engine._editorOn("recenter", () => {
            this.levelGroups.world.position.set(0);
        });

        this.engine._editorOn("filter", () => this.editStates.filter.state.toggle());

        this.rotation.onRotation = () => this.onRotation();

        this.engine.events.on(_md2events.levelDeleteB, () => this.cancelChanges());

        this.newUi = new MDCTUI(this);
        this.newUi.renderTo(o.el);
    }

    private setupEditorModeEventListener(mode: _MD2editorBase): (el: HTMLElement) => void {
        return (el: HTMLElement) => {
            this.activateEditorMode.state.disableIfOn();

            mode.setButtonEl(el);
            mode.state.toggle();

            this.activateEditorMode = mode;
        };
    }

    private onEntitySelect(name: string) {
        this.isEntitySelected = true;
        this.selectedEntity = name;
        const s = this.engine.generator.createEntitySprite(name);

        this.testSprite.destroy();

        this.testSprite = s || new TilingSprite({texture: Texture.WHITE, width: 100, height: 100});
    }

    private cancelChanges() {
        this.grids.fg.forEach(block => block.destroy());
        this.grids.bg.forEach(block => block.destroy());
        this.grids.overlay.forEach(block => block.destroy());

        this.grids.fg.clear();
        this.grids.bg.clear();
        this.grids.overlay.clear();

        (this.editStates.multiEdit as _MD2editorMulti).scp.sprite.visible = false;
    }

    private onRotation() {
        for(const el of _editorGridBlocks) {
            const img = el.children[0] as HTMLImageElement;
            img.style.transform = `rotate(${this.rotation.deg}deg)`;
        }

        this.testSprite.rotation = degToRad(this.rotation.deg);
    }

    private rotateLeft() {
        this.rotation.add(-90);
    }

    private rotateRight() {
        this.rotation.add(90);
    }

    private saveChanges() {
        try {
            this.engine.generator.injectBlocks(this.grids);
        } catch(err) {
            console.error(err);
            alert("There was an error and changes have been cancelled. Check the console");
        } finally {
            this.cancelChanges();
        }
    }

    snapToGridFromScreen([x, y]: XYtuple, pos: {x: number, y: number} = this.engine.levelManager.groups.view): XYtuple {
        return [
            snapToGrid(
                x,
                pos.x,
                this.engine.blockSize
            ),
            snapToGrid(
                y,
                pos.y, 
                this.engine.blockSize
            ),
        ];
    }

    fixPanOffset([x, y]: XYtuple): XYtuple {
        return [x - this.levelGroups.world.x, y - this.levelGroups.world.y];
    }

    fixOffset([x, y]: XYtuple): XYtuple {
        return this.fixPanOffset(this.engine.modules.zoom.fixToZoom(x, y));
    }

    private setupListeners() {
        addEventListener("pointermove", e => {
            const [x, y] = this.snapToGridFromScreen(this.fixOffset([e.x, e.y]));

            this.testSprite.position.set(x + this.testSprite.width / 2, y + this.testSprite.height / 2);
        });
    }

    createSprite(): TilingSprite | false {
        if(this.selectedBlock == "") return false;
        const info = this.engine.generator.getBlockDef(this.selectedBlock);
        if(!info) return false;

        const s = this.engine.generator.createSprite({
            x: 0,
            y: 0,
            w: this.engine.blockSize,
            h: this.engine.blockSize,
            name: this.selectedBlock,
            rotation: this.rotation.deg,
        }, info);

        s.alpha = .5;

        s.pivot.set(s.width / 2, s.height / 2);

        return s;
    }

    private onBlockSelect(name: string) {
        this.isEntitySelected = false;
        this.selectedBlock = name;
        const info = this.engine.generator.getBlockDef(name);
        if(info) this.selectedBlockType = info.type || "fg";
       
        this.testSprite.destroy();

        this.testSprite = this.createSprite() || new TilingSprite({texture: Texture.WHITE});

        this.engine.levelManager.groups.world.addChild(this.testSprite);
    }

    private init() {
        
        this.ui.setGridBlocks(this.engine.generator.getBlockDefArr());
        
        //this.ui.setGridEntities(this.engine.generator.getEntityDefArr());

        this.engine.levelManager.groups.world.addChild(this.testSprite);
        this.setupListeners();

        this.newUi.addBlocksByArray(this.engine.generator.getBlockDefArr());
    }

    checkIfOOB(x: number, y: number, maxX: number, maxY: number): boolean {
        for(const [a, b] of [[x, y], [maxX, y], [x, maxY], [maxX, maxY]])
            if(this.checkIfPointIsOOB(a, b)) {
                console.log(a, b);
                return true;
            }

        return false;
    }

    checkIfPointIsOOB(x: number, y: number): boolean {
        return this.engine.levelManager.levelGrids.fg
        .isOOB(this.engine.utils.dbz(x), this.engine.utils.dbz(y));
    }
}