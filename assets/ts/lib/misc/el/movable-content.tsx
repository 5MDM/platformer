import { JSX } from "solid-js/jsx-runtime";
import { CSSunitTable } from "./solidjs";
import { MDphysicsInternalAABB } from "../../v2/engine-utils/physics";
import { Accessor, splitProps } from "solid-js";
import { MDV } from "../vectors/vectors";
import { runFunctionIfDomEventHappened } from "../utils/events";
import { EventEmitter } from "pixi.js";
import { PointerMoveEvent, stopAnimLoop } from "../util";
import { XYWH } from "../../v2/types";

type MoveAndFindElOptsEventF = (o: MoveAndFindElOpts, overlap: XYWH) => void;

interface MoveAndFindElOpts {
    shrinkToScreen?: boolean;
    movement: MDV.V2;
    box: MDV.V4;
    minW: number;
    minH: number;
    on: Record<"left" | "right" | "top" | "bottom", 
        Record<"hit" | "snap", MoveAndFindElOptsEventF>
    >;
}

interface onMoveOpts extends Omit<MoveAndFindElOpts, "on"> {
    el: HTMLElement;
    movement: MDV.V2;
    css: CSSunitTable;
    shrinkToScreen?: boolean;
    borderWidth: number;
   
    initW: number;
    initH: number;

    box: MDV.V4;
    translateF: TranslateF;
}

export interface MovableContentOpts {
    shrinkToScreen?: boolean;
    borderWidth?: number;
    minWidthPx?: number;
    minHeightPx?: number;
    canMove?: Accessor<boolean>;
    customCSStable?: CSSunitTable;
    events?: EventEmitter<"move">;
    inertiaDecay?: number;
}

type TranslateF = (v2: MDV.V2) => void;

export function MovableContent(p: {
    children: JSX.Element;
    [index: string]: any;
} & MovableContentOpts): JSX.Element {
    const [props, other] =
    splitProps(p, [
        "children", "borderWidth", "minWidthPx", "minHeightPx",
        "shrinkToScreen", "canMove", "customCSStable", "events",
        "inertiaDecay"
    ]);

    props.minWidthPx ??= 180;
    props.minHeightPx ??= 200;

    const css = props.customCSStable ?? new CSSunitTable({
        width: [100, "%"],
        bottom: [0, "px"],
        "will-change": "transform",
        position: "fixed",
        height: [100, "%"],
        left: [0, "px"],
        "touch-action": "none",
        "user-select": "none",
        transform: "translate(0, 0)",
    });

    const borderWidth = props.borderWidth ?? 0;

    css.refreshSignal();

    var isDragging = false;
    var isInitCalculated = false;
    var initW = NaN;
    var initH = NaN;
    var el!: HTMLDivElement;

    const speed = new MDV.V2();

    var divPrRes: (e: HTMLDivElement) => void;
    const divPr = new Promise<HTMLDivElement>(res => divPrRes = res);

    return <div
        ref={div => divPrRes(div)}
        {...other}

        onpointerdown={e => {
            speed.x = 0;
            speed.y = 0;

            isDragging = true;

            if(!isInitCalculated) {
                const canMove = props.canMove?.() || true;
                if(!canMove) return;

                divPr.then(div => {
                    runFunctionIfDomEventHappened
                    (document.readyState == "complete", "load", () => {
                        if(isInitCalculated) return;
                        isInitCalculated = true;
                        initW = e.currentTarget.clientWidth + borderWidth * 2;
                        initH = e.currentTarget.clientHeight + borderWidth * 2;
                        el = div;
                    }, {once: true});
                });
            }
        }}

        onpointermove={e => {
            const canMove = props.canMove?.() || true;
            if(!isDragging || Number.isNaN(initW) || !canMove) return;

            props.events?.emit("move", e);

            onMove({
                css,
                shrinkToScreen: props.shrinkToScreen,
                borderWidth: props.borderWidth ?? 0,
                minW: props.minWidthPx!,
                minH: props.minHeightPx!,
                initW,
                initH,
                el: e.currentTarget,
                movement: new MDV.V2(e.movementX, e.movementY),
                box: MDV.V4.fromElementBounds(e.currentTarget),
                translateF([x, y]) {
                    
                }
            });

            speed.x = e.movementX;
            speed.y = e.movementY;

            css.refreshSignal();
        }}

        onpointerup={e => {
            isDragging = false;
            if(props.inertiaDecay) handleInertia(e);
        }}

        onpointerleave={e => isDragging = false}

        style={css.stringSignal[0]()}>
        {props.children}
    </div>;

    function handleInertia(e: PointerMoveEvent) {
        stopAnimLoop((start, stop) => {
            speed.multiplyS(props.inertiaDecay!);

            const h = initH * css.getNum("height") / 100;

            // const box = new MDV.V4(
            //     css.getNum("left"), 
            //     innerHeight - css.getNum("bottom") - h,
            //     initW * css.getNum("width") / 100, 
            //     h
            // );
            const box = MDV.V4.fromElementBounds(el);

            findOverlap({
                box,
                minW: props.minWidthPx!,
                minH: props.minHeightPx!,
                movement: speed,
                shrinkToScreen: true,
                on: {
                    left: {
                        hit(o, overlap) {
                            const p = overlap.x / initW * 100;
                            css.operator("width", "-=", Math.min(2, p));
                        },
                        snap() {
                            css.set("left", 0);
                            speed.x = 0;
                        }
                    },
                    right: {
                        hit(o, overlap) {
                            const p = overlap.w / initW * 100;
                            //css.operator("width", "-=", p);
                            speed.x = 0;
                        },
                        snap() {speed.x = 0}
                    },
                    top: {
                        hit(o, overlap) {
                            speed.y = 0;
                        },
                        snap() {
                            css.set("bottom", innerHeight - box.h);
                            speed.y = 0;
                        } 
                    },
                    bottom: {
                        hit(o, overlap) {
                            const p = -(overlap.y) / initH * 100;

                            //css.operator("height", "-=", p);
                            css.set("bottom", 0);
                            speed.y = 0;
                        },
                        snap() {
                            speed.y = 0;
                            css.set("bottom", 0);
                        }
                    }
                }
            });

            css.operator("left", "+=", speed.x);
            css.operator("bottom", "+=", -speed.y);

            props.events?.emit("move", e);
            
            css.refreshSignal();

            if(Math.abs(speed.x) < 1e-2 && Math.abs(speed.y) < 1e-2) return stop();
        }).start();
    }
}

const Pi = MDphysicsInternalAABB;
const {V4, V2} = MDV;

function findOverlap
(o: MoveAndFindElOpts) {
    const oldBox = o.box;
    const newBox = oldBox.clone().addV2(o.movement);

    if(o.shrinkToScreen) {
        const overlap = Pi.getOverlapBox(newBox, V4.getViewport());
        const isBelowMinW = newBox.w > o.minW;
        const isBelowMinH = newBox.h > o.minH;

        if(overlap.x > 0) {
            if(isBelowMinW) 
                o.on.left.hit(o, overlap);

            o.on.left.snap(o, overlap);
        } else if(overlap.w > 0) {
            if(!isBelowMinW)
                o.on.right.snap(o, overlap);
            else
                o.on.right.hit(o, overlap);
        }

        if(overlap.h < 0) {
            if(isBelowMinH)
                o.on.bottom.hit(o, overlap);
            
            o.on.bottom.snap(o, overlap);
        } else if(overlap.y < 0) {
            if(!isBelowMinH)
                o.on.top.snap(o, overlap);
            else o.on.top.hit(o, overlap);
        
        }
    }
}

function onMove({
    box, css, shrinkToScreen, minW, minH, initW, initH, movement,
    translateF
}: onMoveOpts): MDV.V4 {
    var deltaX = movement.x;
    var deltaY = -movement.y;

    findOverlap({
        movement: movement.clone(),
        shrinkToScreen: shrinkToScreen ?? false,
        minW,
        minH,
        box,
        on: {
            left: {
                hit(o, overlap) {
                    const p = overlap.x / initW * 100;
                    css.operator("width", "-=", Math.min(2, p));
                },
                snap() {
                    css.set("left", 0);
                    deltaX = 0;
                }
            },
            right: {
                hit(o, overlap) {
                    const p = overlap.w / initW * 100;
                    css.operator("width", "-=", p);
                },
                snap() {deltaX = 0}
            },
            bottom: {
                hit(o, overlap) {
                    const p = (-overlap.h) / initH * 100;

                    css.operator("height", "-=", p);
                },
                snap() {
                    css.set("bottom", 0);
                    deltaY = 0;
                }
            },
            top: {
                hit(o, overlap) {
                    const p = (-overlap.y) / initH * 100;

                    css.operator("height", "-=", p);
                },
                snap() {
                    deltaY = 0;
                }
            }
        }
    });

    const oldBox = box;
    const newBox = oldBox.clone().addV2(new V2(movement.x, movement.y));

    css.operator("left", "+=", deltaX);
    css.operator("bottom", "+=", deltaY);

    newBox.x = css.getNum("left");
    newBox.y = css.getNum("bottom");

    return newBox;
}