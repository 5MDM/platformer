import { Application, EventEmitter, SpritesheetData } from "pixi.js";
import { _MD2dataManager } from "./data-loaders/data";
import { _MD2dataManagerOpts } from "./data-loaders/sprite-loader";
import { _MD2 } from "./obj";
import { _MD2levelManager } from "./level";
import { _MD2errorManager } from "./errors";
import { _MD2physics, _MD2physicsOpts } from "./physics/main";
import { MDmatrix } from "../misc/matrix";
import { FgBlock } from "./blocks/blocks";
import { _MD2deletor } from "./generation/deletor";
import { _MD2fullGen } from "./generation/full-gen";
import { Joystick } from "../misc/joystick";
import { MD2zoomModule } from "./modules/zoom";
import { MD2module } from "./modules/main";
import { MD2envModule } from "./modules/env/main";
import { MD2textModule } from "./modules/text/text";
import { MDaudio } from "../misc/audio";
import { MD2GUI } from "./modules/gui/main";
import { BlockComponentManager } from "./blocks/components/main-manager";

interface EngineOpts {
    engine: {
        blockSize: number;
        app: Application;
        joystick: Joystick;
    };
    dataManager: _MD2dataManagerOpts;
    physics: _MD2physicsOpts;
    gui: {
        target: HTMLDivElement;
    }
}

type CDtype = "side" | "td";

export class _MD2engine {
    CD: CDtype = "td";

    blockSize: number;
    blockSizeHalf: number;
    dataManager: _MD2dataManager;
    levelManager: _MD2levelManager;
    errorManager: _MD2errorManager;
    generator: _MD2fullGen;
    physics: _MD2physics;
    deletor: _MD2deletor;
    app: Application;
    audio: MDaudio = new MDaudio();

    events = new EventEmitter();

    isTyping = false;

    joystick: Joystick;

    modules: {
        [index: string]: MD2module;
        zoom: MD2zoomModule;
        env: MD2envModule;
        text: MD2textModule;
        gui: MD2GUI;
    };

    _editorEmit(name: string, ...args: any[]): void {
        this.events.emit("editor:" + name, ...args);
    }

    _editorOn(name: string, f: (...args: any[]) => void): void {
        this.events.on("editor:" + name, f);
    }

    initPromise: Promise<void>;
    private initPromiseRes?: () => void;

    divideByBlockSize(n: number): number {
        return Math.floor(n / this.blockSize);
    }

    mulByBlockSize(n: number): number {
        return n * this.blockSize;
    }

    constructor(opts: EngineOpts) {
        BlockComponentManager.setEngine(this);
        this.joystick = opts.engine.joystick;
        this.blockSize = opts.engine.blockSize;
        this.blockSizeHalf = this.blockSize / 2;
        this.app = opts.engine.app;
        
        this.deletor = new _MD2deletor(this);
        this.physics = new _MD2physics(this, opts.physics);
        this.dataManager = new _MD2dataManager(this, opts.dataManager);
        this.levelManager = new _MD2levelManager(this);
        this.errorManager = new _MD2errorManager();
        this.generator = new _MD2fullGen(this);

        this.modules = {
            zoom: new MD2zoomModule(this),
            env: new MD2envModule(this),
            text: new MD2textModule(this),
            gui: new MD2GUI(this),
        };

        this.physics.setMatrix(this.levelManager.levelGrids.fg as MDmatrix<FgBlock>);

        this.initPromise = new Promise(res => {
            this.initPromiseRes = res;
        });

        this.modules.gui.appendToTarget(opts.gui.target);

        this._editorOn("switch-dimensions", () => this.switchDimensions());
    }

    switchDimensions() {
        if(this.CD == "td") this.CD = "side"
        else this.CD = "td";
    }

    async init() {
        await this.dataManager.init();
        this.app.stage.addChild(this.levelManager.container);

        this.physics.isLoopRunning = true;

        if(this.initPromiseRes) this.initPromiseRes();

        for(const i in this.modules)
            await this.modules[i].init();
    }
}