import { Accessor, createSignal, Show, Signal, splitProps } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { MovableContent, MovableContentOpts } from "./movable-content";
import { CSSunitTable } from "./solidjs";
import { EventEmitter } from "pixi.js";
import { PointerMoveEvent } from "../util";
import { SimpleUIarrayTracker } from "../utils/simpleIdtracker";

export interface IwindowOpts extends MovableContentOpts {
    onClose?: () => boolean | void;
    onMinimize?: () => boolean | void;
    onExtend?: () => boolean | void;
    title?: string;
} 

const cornerTracker = new SimpleUIarrayTracker();

export function Iwindow(p: {
    children: JSX.Element;
    heightPercent?: number;
    widthPercent?: number;
    leftPercent?: number;
    bottomPercent?: number;
    visibilitySignal?: Signal<boolean>
    [index: string]: any;
} & IwindowOpts) {
    p.borderWidth ??= 10;
    var cornerPos: number | undefined = undefined;

    const [props, other] = splitProps(p, [
        "children", "onClose", "onMinimize", "onExtend",
        "title", "events", "heightPercent", "widthPercent",
        "leftPercent", "bottomPercent", "visibilitySignal"
    ]);

    props.visibilitySignal ||= createSignal(true);
    const {visibilitySignal} = props;

    const events = props.events || new EventEmitter();

    const table: CSSunitTable = new CSSunitTable({
        width: [props.widthPercent ?? 100, "%"],
        bottom: [(props.bottomPercent ?? 0) / 100 * innerHeight, "px"],
        position: "fixed",
        height: [props.heightPercent ?? 100, "%"],
        left: [(props.leftPercent ?? 0) / 100 * innerWidth, "px"],
        "will-change": "transform"
    });

    var isMinimizedAtCorner = false;
    const [getMinimizationState, setMinimizationState] = createSignal(false);

    events.on("move", (e: PointerMoveEvent) => {
        if(!getMinimizationState()) return;

        if(table.getNum("left") > 1e-2) {
            // not at corner

            isMinimizedAtCorner = false;
            // minimizedAtCornerIdTracker.unregister(windowId);
            if(cornerPos !== undefined) {
                cornerTracker.remove(cornerPos);
                cornerPos = undefined;
            }
        }
    });
    
    function minimize() {
        if(isMinimizedAtCorner) return;

        table.set("width", 200 / innerWidth * 100);
        table.set("height", 40 / innerHeight * 100);
        table.set("left", 0);

        isMinimizedAtCorner = true;
        // minimizedAtCornerIdTracker.register(windowId);
        // const emptySlot = minimizedAtCornerIdTracker.getEmptyIdSlot();
        cornerPos = cornerTracker.insertAndGetPos();

        table.set("bottom", (cornerPos * 40));

        table.refreshSignal();
        setMinimizationState(true);
    }

    function maximize() {
        isMinimizedAtCorner = false;
        table.set("left", 0);
        table.set("bottom", 0);
        table.set("width", 100);
        table.set("height", 100);
        table.refreshSignal();
        if(cornerPos !== undefined) cornerTracker.remove(cornerPos);
        cornerPos = undefined;
        setMinimizationState(false);
    }

    function close() {
        visibilitySignal[1](false);
    }
    
    const el = <Show when={visibilitySignal[0]()}>
        <MovableContent 
            events={events} 
            customCSStable={table} 
            inertiaDecay={.96}
            {...other} 
            class={"i-window " + (other.class ?? "")}>
            <div class="i-window-top">
                <Show when={props.title}>
                    <p>{props.title}</p>
                </Show>
                <button onClick={minimize}>-</button>
                <button onClick={maximize}>□</button>
                <button onClick={close}>X</button>
            </div>
            <Show when={!getMinimizationState()}>
                <div class="i-window-bottom">{props.children}</div>
            </Show>
        </MovableContent>
    </Show>

    return el;
}