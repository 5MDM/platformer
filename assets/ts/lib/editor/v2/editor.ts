import { Container, ContainerChild, Sprite } from "pixi.js";
import { _MD2engine } from "../../v2/engine";
import { BaseMode } from "./modes/templates/base-mode";
import { MDgameGridType } from "../../v2/types";
import { MDmatrix } from "../../misc/matrix";
import { BgBlock, FgBlock } from "../../v2/blocks/blocks";
import { MDCTUI } from "./main-ui";
import { MD2editor } from "../main";
import { PlaceBlock } from "./modes/placeBlock";
import { createSignal, Signal } from "solid-js";
import { initToolbarEvents } from "./toolbarEvents";
import { EnableState } from "../../misc/enable-state";

type Mode = new (editor: MD2editorV2, targetEl: HTMLElement) => BaseMode;

export class MD2editorV2 {
    engine: _MD2engine;
    targetEl: HTMLElement;

    state = new EnableState(() => {
        this.ui.visibilitySignal[1](true);
    }, () => {
        this.ui.visibilitySignal[1](false);
    }, true);

    levelGroups: {
        bg: Container<ContainerChild>;
        entity: Container<ContainerChild>;
        fg: Container<ContainerChild>;
        overlay: Container<ContainerChild>;
        static: Container<ContainerChild>;
        view: Container<ContainerChild>;
        world: Container<ContainerChild>;
    };

    selection: {
        self: MD2editorV2;
        modeName: Signal<string | undefined>;
        mode: undefined | BaseMode;
        changeModeTo(name: string): void;
    } = {
        self: this,
        modeName: createSignal<string | undefined>(),
        mode: undefined,
        changeModeTo(name: string) {
            this.mode?.state?.disableIfOn();
            const mode = this.self.modes[name];
            if(!mode) return;

            this.modeName[1](name);
            this.mode = mode;
            this.mode.state.enableIfOff();
        }
    };

    blockModifiers = {
        rotation: 0,
    };

    constructor(engine: _MD2engine, el: HTMLElement) {
        this.engine = engine;
        this.targetEl = el;
        this.levelGroups = this.engine.levelManager.groups;

        this.engine.initPromise.then(this.init.bind(this));

        initToolbarEvents(this);
    }

    private init() {
        this.parseModes();
        this.ui.addBlocksByArray(this.engine.generator.getBlockDefArr());
        this.ui.renderTo(this.targetEl);
        this.engine.levelManager.groups.static.addChild(this.c);
    }

    private parseModes() {
        for(const Mode of this.modesToBeParsed) {
            const mode = new Mode(this, this.targetEl);
            this.modes[mode.modeName] = mode;
        }

        this.areModesParsed = true;

        for(const modeName in this.modes)
            this.modes[modeName].init();
    }

    areModesParsed = false;
    private modesToBeParsed: Mode[] = [
        PlaceBlock,
    ];

    modes: Record<string, BaseMode> = {};

    c = new Container();

    static maxLevelSize = 1024;

    editorGrids: Record<MDgameGridType, (MDmatrix<FgBlock> | MDmatrix<BgBlock>)> = {
        fg: new MDmatrix(st.maxLevelSize, st.maxLevelSize),
        bg: new MDmatrix(st.maxLevelSize, st.maxLevelSize),
        overlay: new MDmatrix(st.maxLevelSize, st.maxLevelSize),
    };
    
    forEachGrid(
        f: (grid: MDmatrix<FgBlock> | MDmatrix<BgBlock>, name: MDgameGridType) => void
    ) {
        f(this.editorGrids.fg, "fg");
        f(this.editorGrids.bg, "bg");
        f(this.editorGrids.overlay, "overlay");
    }

    ui: MDCTUI = new MDCTUI(this);
}

const st = MD2editorV2;