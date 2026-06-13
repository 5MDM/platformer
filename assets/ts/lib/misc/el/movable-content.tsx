import { JSX } from "solid-js/jsx-runtime";
import { clamp } from "../util";
import { CSSunitTable } from "./solidjs";
import { MDphysicsAABButils, MDphysicsInternalAABB, MDphysicsUtils } from "../../v2/engine-utils/physics";
import { onMount } from "solid-js";
import { MDV } from "../vectors/vectors";

export function MovableContent(props: {
    children: JSX.Element;
    shrinkToScreen?: boolean;
    borderWidth?: number;
    minWidthPercent?: number;
}): JSX.Element {
    const css = new CSSunitTable({
        width: [100, "%"],
        bottom: [0, "px"],
        position: "fixed",
        height: [100, "%"],
        left: [0, "px"],
    });

    const isBorderWidthDefined = props.borderWidth != undefined;
    const borderWidth = props.borderWidth ?? 0;
    const minWidthPercent = props.minWidthPercent ?? 40;

    css.refreshSignal();

    var isDragging = false;
    var isResizing = false;
    var isInitCalculated = false;
    var initW = 1;

    return <div
        {...props}

        onpointerdown={e => {
            isDragging = true;

            if (!isInitCalculated) {
                const div = e.target as HTMLDivElement;
                isInitCalculated = true;
                initW = div.clientWidth + borderWidth * 2;

                css.changeUnit("width", "px");
                css.set("width", initW);
                css.refreshSignal();
            }
        }}

        onpointermove={e => {
            if(!isDragging) return;

            // if (props.shrinkToScreen) {
            //     const rect = e.target.getBoundingClientRect();
            //     const isTouchingRight = rect.right + e.movementX >= innerWidth - borderWidth;

            //     if (e.movementX > 0 && css.getNum("left") >= 0 && isTouchingRight) {
            //         // going right
            //         const rawW = (initW - leftMargin) / initW * 100;
            //         const w = clamp(minWidthPercent, rawW, 100);

            //         if(rawW > minWidthPercent) css.set("left", leftMargin);
                    
            //         css.set("width", w);
            //     } else if (e.movementX < 0 && css.getNum("left") <= 0) {
            //         // going left
            //         const percentDecrease = e.movementX / initW * 100;
            //         const newPercent = clamp(minWidthPercent, css.getNum("width") + percentDecrease, 100);

            //         css.set("width", newPercent);
            //     } else {
            //         // normal move
            //         css.set("left", leftMargin);
            //     }
            // } else {
            //     css.set("left", leftMargin);
            // }

            onMove(e, css, props.shrinkToScreen, props.borderWidth);

            css.refreshSignal();
        }}

        onpointerup={e => isDragging = false}
        onpointerleave={e => isDragging = false}

        style={css.stringSignal[0]()}>
        {props.children}
    </div>;
}

const P = MDphysicsAABButils;
const Pi = MDphysicsInternalAABB;
const {V4, V2} = MDV;

function onMove(e: PointerEvent & {
    target: Element;
    currentTarget: HTMLElement;
}, css: CSSunitTable, shrinkToScreen?: boolean, borderWidth: number = 0) {
    const {movementX, movementY} = e;

    const oldBox = V4.fromElementBounds(e.currentTarget);
    const newBox = oldBox.clone().addV2(new V2(movementX, movementY));

    var deltaX = movementX;
    var deltaY = -movementY;

    const bottom = css.get("bottom") as number;

    if(shrinkToScreen) {
        const overlap = Pi.getOverlapBox(newBox, V4.getViewport());
        if(overlap.x > 0) {
            css.operator("width", "+=", Math.min(-.8, movementX));
            css.set("left", 0);
            deltaX = 0
        } else if(overlap.w > 0) {
            css.set("right", 0);
            css.operator("width", "-=", movementX);
        }

        if((overlap.h) < 0) {
            css.operator("height", "-=", Math.min(.62, movementY));
            css.set("bottom", 0);
            deltaY = 0;
        } else if((overlap.y) < 0) {
            const p = (overlap.h - newBox.y - bottom) / (newBox.h) * 50;

            css.operator("height", "-=", p);
            css.operator("bottom", "+=", p);
        }
    }

    css.operator("left", "+=", deltaX);
    css.operator("bottom", "+=", deltaY);
}