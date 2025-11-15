import { _MD2dataManager } from "./data-loaders/data";
import { _MD2engine } from "./engine";
import { _MD2errorManager } from "./errors";
import { _MD2fullGen } from "./generation/full-gen";
import { _MD2levelManager } from "./level";

export namespace _MD2 {
    export const version: [number, number, number] = [0, 0, 0];
    export const Engine = _MD2engine;
    export const DataManager = _MD2dataManager;
    export const ErrorManager = _MD2errorManager;
    export const LevelManager = _MD2levelManager;
    export const Generator = _MD2fullGen;
}
