import { EventEmitter } from "pixi.js";
import { MD2GUI } from "./main";

export abstract class MD2GUIpart {
    gui: MD2GUI;
    events = new EventEmitter();
    el?: HTMLElement;

    constructor(gui: MD2GUI) {
        this.gui = gui;
    }
}