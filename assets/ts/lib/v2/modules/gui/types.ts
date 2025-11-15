import { EventEmitter } from "pixi.js";
import { MD2GUI } from "./main";
import { _MD2dataManager } from "../../data-loaders/data";

export abstract class MD2GUIpart {
    gui: MD2GUI;
    events = new EventEmitter();
    el?: HTMLElement;
    dataManager: _MD2dataManager;

    constructor(gui: MD2GUI) {
        this.gui = gui;
        this.dataManager = gui.md2.dataManager;
    }
}