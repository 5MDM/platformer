import { XYWH } from "../../v2/types";
import {vectorMixin1} from "./outside-points";
import { vectorMixin2 } from "./point-adjacency";
// import "./tests";

export namespace MDV {
    export type XY = {
        x: number;
        y: number;
    }

    export type TwoNumArr = [number, number];

    export class V2 implements XY {
        x: number;
        y: number;

        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        static fromArray(arr: TwoNumArr) {
            return new V2(...arr);
        }

        static fromPoint(o: {x: number; y: number}) {
            return new V2(o.x, o.y);
        }

        clone(): V2 {return V2.fromPoint(this)}
        
        divideS(n: number) {
            this.x /= n;
            this.y /= n;
            return this;
        }

        multiplyS(n: number) {
            this.x *= n;
            this.y *= n;
            return this;
        }

        floor() {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            return this;
        }

        round() {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        }

        ceil() {
            this.x = Math.ceil(this.x);
            this.y = Math.ceil(this.y);
            return this;
        }
    }

    export type V4cornersArray = [
        TwoNumArr,
        TwoNumArr,
        TwoNumArr,
        TwoNumArr,
    ];

    export interface V4neighboringCellHolder {
        topLeft: V2;
        top: V2;
        topRight: V2;
        bottomLeft: V2;
        bottom: V2;
        bottomRight: V2;
        point: V2;

        left: V2;
        right: V2;
    }

    export interface V4NeighborCellType extends Partial<V4neighboringCellHolder> {
        type: V4cellNeighborType;
    }

    export type V4cellNeighborType = 
    "isolated" |
    "top" |
    "top-left-corner" |
    "top-right-corner" |
    "top-U" |
    "left" |
    "right" |
    "left-U" |
    "right-U" |
    "bottom-U" |
    "bottom-left-corner" |
    "bottom-right-corner" |
    "bottom" |
    "top-down-pipe" |
    "left-right-pipe";

    export class V4 implements XYWH {
        x: number;
        y: number;
        w: number;
        h: number;

        constructor(x = 0, y = 0, w = 0, h = 0) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }

        toArr(): [number, number, number, number] {
            return [this.x, this.y, this.w, this.h];
        }

        getCornersArr(): V4cornersArray {
            return [
                [this.x, this.y],
                [this.x + this.w, this.y],
                [this.x, this.y + this.h],
                [this.x + this.w, this.y + this.h]
            ];
        }

        forEachCorner(f: (v2: V2) => void, corners?: V4cornersArray) {
            const arr = corners || this.getCornersArr();
            for(const i of arr) f(V2.fromArray(i));
        }

        forEachIntPoint(f: (v2: V2) => void) {
            for(let fy = this.y; fy < this.y +this.h; fy++) {
                for(let fx = this.x; fx < this.x + this.w; fx++) {
                    f(new V2(fx, fy));
                }
            }
        }

        getOutsideIntPoints(step = 1, inset = 0): V2[] {return [] as V2[]}
        getNeighboringOutsidePoints(step = 1, inset = 0): Partial<MDV.V4neighboringCellHolder>[]
        {return [] as Partial<MDV.V4neighboringCellHolder>[]}

        static fromArr(arr: [number, number, number, number]): V4 {
            return new V4(...arr);
        }

        static fromBounds({x, y, w, h}: XYWH) {
            return new V4(x, y, w, h);
        }

        divideS(n: number) {
            this.x /= n;
            this.y /= n;
            this.w /= n;
            this.h /= n;
        }

        floorDivideS(n: number, base = 1) {
            this.divideS(n);
            this.x = Math.floor(this.x * base) / base;
            this.y = Math.floor(this.y * base) / base;
            this.w = Math.floor(this.w * base) / base;
            this.h = Math.floor(this.h * base) / base;

            return this;
        }

        findAdjacencyForEachPoint(
            this: MDV.V4,
            steps = 1,
            inset = 0,
        ): MDV.V4NeighborCellType[] {
            return [] as MDV.V4NeighborCellType[];
        }
    }
}

Object.assign(MDV.V4.prototype, vectorMixin1);
Object.assign(MDV.V4.prototype, vectorMixin2);
