import { XYWH } from "../types";

export namespace MDphysicsInternalAABB {
    export function isXaxisInside(i: XYWH, o: XYWH) {
        return i.x > o.x
        &&  i.x + i.w < o.x + o.w;
    }

    export function isYaxisInside(i: XYWH, o: XYWH) {
        return i.y > o.y
        && i.y + i.h < o.y + o.h;
    }

    export function getBottomOverlap(i: XYWH, o: XYWH) {
        return i.y - o.y;
    }

    export function getTopOverlap(i: XYWH, o: XYWH) {
        return (o.y + o.h) - (i.y + i.h);
    }

    export function getLeftOverlap(i: XYWH, o: XYWH) {
        return o.x - i.x;
    }

    export function getRightOverlap(i: XYWH, o: XYWH) {
        return (i.x + i.w) - (o.x + o.w);
    }

    export function getOverlapBox(i: XYWH, o: XYWH): XYWH {
        return {
            x: getLeftOverlap(i, o),
            y: getBottomOverlap(i, o),
            w: getRightOverlap(i, o),
            h: getTopOverlap(i, o),
        };
    }
}

export namespace MDphysicsAABButils {
    export function aabbFromXYWH(a: XYWH, b: XYWH) {
        return (
            a.x < b.x + b.w
        &&  a.x + a.w > b.x
        &&  a.y < b.y + b.h
        &&  a.y + b.y > b.y
        );
    }

    export function domRectToXYWH(dom: DOMRect): XYWH {
        return {
            x: dom.x,
            y: dom.y,
            w: dom.width,
            h: dom.height
        };
    }

    export function getViewportAsXYWH(): XYWH {
        return {x: 0, y: 0, w: innerWidth, h: innerHeight};
    }

    export function addBorder(o: XYWH, size: number): XYWH {
        o.w += size * 2;
        o.h += size * 2;
        o.x -= size;
        o.y -= size;
        return o;
    }
}

export namespace MDphysicsUtils {
    
}