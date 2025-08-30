import { Application, SpritesheetData } from "pixi.js";
import { _MD2dataManager, _MD2dataManagerOpts } from "./data";
import { _MD2 } from "./obj";
import { _MD2levelManager } from "./level";
import { _MD2errorManager } from "./errors";
import { _MD2generator } from "./generation/generator";
import { _MD2physics, _MD2physicsOpts } from "./physics";
import { MDmatrix } from "../misc/matrix";
import { FgBlock } from "./block";
import { _MD2deletor } from "./generation/deletor";

interface EngineOpts {
    engine: {
        blockSize: number;
        app: Application;
    };
    dataManager: _MD2dataManagerOpts;
    physics: _MD2physicsOpts;
}

export class _MD2engine {
    blockSize: number;
    blockSizeHalf: number;
    dataManager: _MD2dataManager;
    levelManager: _MD2levelManager;
    errorManager: _MD2errorManager;
    generator: _MD2generator;
    physics: _MD2physics;
    deletor: _MD2deletor;
    app: Application;

    initPromise: Promise<void>;
    private initPromiseRes?: () => void;

    constructor(opts: EngineOpts) {
        this.blockSize = opts.engine.blockSize;
        this.blockSizeHalf = this.blockSize / 2;
        this.app = opts.engine.app;
        
        this.deletor = new _MD2deletor(this);
        this.physics = new _MD2physics(this, opts.physics);
        this.dataManager = new _MD2dataManager(this, opts.dataManager);
        this.levelManager = new _MD2levelManager(this);
        this.errorManager = new _MD2errorManager();
        this.generator = new _MD2generator(this);

        this.physics.setMatrix(this.levelManager.levelGrids.fg as MDmatrix<FgBlock>);

        this.initPromise = new Promise(res => {
            this.initPromiseRes = res;
        });
    }

    async init() {
        await this.dataManager.init();
        this.app.stage.addChild(this.levelManager.container);

        this.physics.isLoopRunning = true;

        if(this.initPromiseRes) this.initPromiseRes();
    }
}