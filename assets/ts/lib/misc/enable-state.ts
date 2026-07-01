import { EventEmitter } from "pixi.js";

export class EnableState {
    isEnabled: boolean;

    events = new EventEmitter<"toggled" | "enabled" | "disabled">();

    constructor(onEnable?: () => void, onDisable?: () => void, isEnabled: boolean = false) {
        this.isEnabled = isEnabled;
        if(onEnable) this.events.on("enabled", onEnable);
        if(onDisable) this.events.on("disabled", onDisable);
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if(this.isEnabled) this.onEnable();
        else this.onDisable();
    }

    private onEnable(): void {
        this.events.emit("enabled");
        this.events.emit("toggled");
    }

    private onDisable(): void {
        this.events.emit("disabled");
        this.events.emit("toggled");
    }

    disableIfOn() {
        if(this.isEnabled) this.toggle();
    }

    enableIfOff() {
        if(!this.isEnabled) this.toggle();
    }
}