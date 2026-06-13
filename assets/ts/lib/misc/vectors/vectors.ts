import { XYWH } from "../../v2/types";
import { MDmatrix } from "../matrix";
import {vectorMixin1} from "./outside-points";
import { vectorMixin2 } from "./point-adjacency";
// import { startTests } from "./tests";

export namespace MDV {
    export type XY = {
        x: number;
        y: number;
    }

    export type TwoNumArr = [number, number];

    export interface GetNeighboringOutsidePointsUsingGridOutput {
        outsidePoints: Partial<MDV.V4neighboringCellHolder>[];
        removedPoints: Partial<MDV.V4neighboringCellHolder>[];
    };

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

        add(p: V2) {
            this.x += p.x;
            this.y += p.y;
        }
    }

    export type V4cornersArray = [
        TwoNumArr,
        TwoNumArr,
        TwoNumArr,
        TwoNumArr,
    ];

    export const V4neighboringCellPropMap = {
        topLeft: true,
        top: true,
        topRight: true,
        bottomLeft: true,
        bottom: true,
        bottomRight: true,
        left: true,
        right: true,
    };

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

    export type V4cellIcornerType = 
    "top-left-icorner"
    | "top-right-icorner"
    | "bottom-left-icorner"
    | "bottom-right-icorner";

    export type V4cell8sidesType = 
    "top-left-corner"
    | "top-right-corner"
    | "top"
    | "left" 
    | "right"
    | "bottom-left-corner"
    | "bottom-right-corner" 
    | "bottom";

    export type V4cellNeighborType = V4cell8sidesType
    | V4cellIcornerType
    | "isolated" |
    "top-U" |
    "left-U" |
    "right-U" |
    "bottom-U" |
    "top-down-pipe" |
    "left-right-pipe";

    export interface FindAdjacencyForEachOutsidePointUsingGridOutput {
        main: V4NeighborCellType[];
        removedPoints: Partial<MDV.V4neighboringCellHolder>[];
    }

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

        forEachIntPoint(f: (v2: V2) => void, inset = 0) {
            for(let fy = this.y + inset; fy < this.y + this.h - inset; fy++) {
                for(let fx = this.x + inset; fx < this.x + this.w - inset; fx++) {
                    f(new V2(fx, fy));
                }
            }
        }

        forEachIntPointByStep(f: (v2: V2) => void, step = 1, inset = 0) {
            for(let fy = this.y + inset; fy < this.y + this.h - inset; fy += step) {
                for(let fx = this.x + inset; fx < this.x + this.w - inset; fx += step) {
                    f(new V2(fx, fy));
                }
            }
        }

        clone() {
            return MDV.V4.fromBounds(this);
        }

        floor() {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            this.w = Math.floor(this.w);
            this.h = Math.floor(this.h);
            return this;
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
            return this;
        }

        multiplyS(n: number) {
            this.x *= n;
            this.y *= n;
            this.w *= n;
            this.h *= n;
            return this;
        }

        floorDivideS(n: number, base = 1) {
            this.divideS(n);
            this.x = Math.floor(this.x * base) / base;
            this.y = Math.floor(this.y * base) / base;
            this.w = Math.floor(this.w * base) / base;
            this.h = Math.floor(this.h * base) / base;

            return this;
        }

        findAdjacencyForEachOutsidePoint(
            this: MDV.V4,
            steps = 1,
            inset = 0,
        ): MDV.V4NeighborCellType[] {
            return [] as MDV.V4NeighborCellType[];
        }

        findAdjacencyForEachPoint
        (this: MDV.V4, steps = 1, inset = 0):
        MDV.V4NeighborCellType[] {
            return [] as MDV.V4NeighborCellType[];
        }

        findAdjacencyFromCell(cell: Partial<V4neighboringCellHolder>): MDV.V4NeighborCellType {
            return undefined as unknown as MDV.V4NeighborCellType;
        }

        findAdjacencyForEachOutsidePointUsingGrid<T>(
            grid: MDmatrix<T>,
            step = 1,
            inset = 0,
        ): FindAdjacencyForEachOutsidePointUsingGridOutput {
            return {} as FindAdjacencyForEachOutsidePointUsingGridOutput;
        }

        getNeighboringOutsidePointsUsingGrid<T>(grid: MDmatrix<T>, step = 1, inset = 0): 
        GetNeighboringOutsidePointsUsingGridOutput {
            return {} as GetNeighboringOutsidePointsUsingGridOutput;
        }

        findNeighborCellsFromPoint(point: MDV.V2, steps = 1):
        Partial<MDV.V4neighboringCellHolder> {
            return undefined as unknown as MDV.V4neighboringCellHolder;
        }

        addV2(v2: V2) {
            this.x += v2.x;
            this.y += v2.y;
            return this;
        }

        static getViewport() {
            return new V4(0, 0, innerWidth, innerHeight);
        }

        static cell8posGrid: Record<MDV.V4cell8sidesType, MDV.V2> = {
            "top-left-corner": new V2(-1, -1),
            "top": new V2(0, -1),
            "top-right-corner": new V2(1, -1),
            "left": new V2(-1, 0),
            "right": new V2(1, 0),
            "bottom-left-corner": new V2(-1, 1),
            "bottom": new V2(0, 1),
            "bottom-right-corner": new V2(1, 1),
        };

        static clone8posGrid(): Record<MDV.V4cell8sidesType, MDV.V2> {
            const o: Record<MDV.V4cell8sidesType, MDV.V2> = 
            {} as Record<MDV.V4cell8sidesType, MDV.V2>;

            for(const name in V4.cell8posGrid) {
                const p: V2 = V4.cell8posGrid[name].clone();
                o[name] = p;
            }

            return o;
        }

        static getCell8PosGridMultipliedByNum(steps = 1): Record<MDV.V4cell8sidesType, MDV.V2> {
            const grid: Record<MDV.V4cell8sidesType, MDV.V2> = V4.clone8posGrid();
            for(const name in grid) {
                const p: MDV.V2 = grid[name];
                p.multiplyS(steps);
            }

            return grid;
        }

        containsOrAlignsWithPoint(p: V2) {
            return this.x <= p.x
            && this.x + this.w >= p.x
            && this.y <= p.y
            && this.y + this.h >= p.y;
        }

        static fromDOMrect(domBox: DOMRect): V4 {
            return new V4(domBox.x, domBox.y, domBox.width, domBox.height);
        }

        static fromElementBounds(el: Element): V4 {
            return V4.fromDOMrect(el.getBoundingClientRect());
        }
    }
}

Object.assign(MDV.V4.prototype, vectorMixin1);
Object.assign(MDV.V4.prototype, vectorMixin2);

// startTests();