import { XYWH } from "../../v2/types";
import { MDgrid } from "../grids/grid";
import { MDmatrix } from "../matrix";
import { objIterator, simpleSwitch } from "../util";
import {vectorMixin1} from "./outside-points";
import { vectorMixin2 } from "./point-adjacency";

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

    type TypeFor4dir = "top" | "left" | "bottom" | "right";
    type TypeForCorners = "bottomLeft" | "bottomRight" | "topLeft" | "topRight";
    export type TypeFor8dir = TypeFor4dir | TypeForCorners;
    export type In8dir<T> = Record<TypeFor8dir, T>;
    export type In8dirAndCenter<T> = In8dir<T> & {center: T};
    export type Some8dirAndCenter<T> = Partial<In8dir<T>> & {center: T};

    export class V2 implements XY {
        x: number;
        y: number;

        *[Symbol.iterator]() {
            for(const i of [this.x, this.y]) yield i;
        }

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

        set(x: number, y: number): this {
            this.x = x;
            this.y = y;
            return this;
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

        add(p: XY) {
            this.x += p.x;
            this.y += p.y;
            return this;
        }

        addS(n: number): this {
            this.x += n;
            this.y += n;
            return this;
        }

        toArray(): [number, number] {
            return [this.x, this.y];
        }

        toFloat32Array(): Float32Array {
            return new Float32Array([this.x, this.y]);
        }

        isEqualTo(p: MDV.V2): boolean {
            return this.x == p.x
            && this.y == p.y;
        }

        static xy(x: number, y: number): XY {
            return {x, y};
        }

        static pointsIn8dir: In8dir<XY> = {
            "topLeft": this.xy(-1, -1),
            "top": this.xy(0, -1),
            "topRight": this.xy(1, -1),
            "left": this.xy(-1, 0),
            "right": this.xy(1, 0),
            "bottomLeft": this.xy(-1, 1),
            "bottom": this.xy(0, 1),
            "bottomRight": this.xy(1, 1),
        };

        static keysOfPointsIn8dir = Object.keys(this.pointsIn8dir);

        getPointsAndCenterIn8dir(): In8dirAndCenter<V2> {
            return {
                topLeft: this.clone().add(V2.pointsIn8dir.topLeft),
                top: this.clone().add(V2.pointsIn8dir.top),
                topRight: this.clone().add(V2.pointsIn8dir.topRight),
                left: this.clone().add(V2.pointsIn8dir.left),
                right: this.clone().add(V2.pointsIn8dir.right),
                bottomLeft: this.clone().add(V2.pointsIn8dir.bottomLeft),
                bottom: this.clone().add(V2.pointsIn8dir.bottom),
                bottomRight: this.clone().add(V2.pointsIn8dir.bottomRight),
                center: this.clone(),
            };
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

        static fromV2(v2: MDV.V2, w = 1, h = 1): MDV.V4 {
            return new MDV.V4(v2.x, v2.y, w, h);
        }

        *[Symbol.iterator]() {
            for(const i of [this.x, this.y, this.w, this.h]) yield i;
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

        /**
         * # THIS DOESN'T WORK AT ALL
         * ~WARNING: inset doesn't work~
         * @deprecated
         */
        getOutsideIntPoints(step = 1, inset = 0): V2[] {return [] as V2[]}
        getNeighboringOutsidePoints(step = 1, inset = 0): Partial<MDV.V4neighboringCellHolder>[]
        {return [] as Partial<MDV.V4neighboringCellHolder>[]}

        static fromArr(arr: [number, number, number, number]): V4 {
            return new V4(...arr);
        }

        static fromBounds({x, y, w, h}: XYWH) {
            return new V4(x, y, w, h);
        }

        addPos({x, y}: XY): this {
            this.x += x;
            this.y += y;
            return this;
        }

        subtractPos({x, y}: XY): this {
            this.x -= x;
            this.y -= y;
            return this;
        }

        getPosAsVec2(): MDV.V2 {
            return new MDV.V2(this.x, this.y);
        }

        getPosAsXY(): XY {return {x: this.x, y: this.y}}

        getWH(): MDV.V2 {return new MDV.V2(this.w, this.h)}

        getWHasXY(): XY {return {x: this.w, y: this.h}} 

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

        /**
         * 
         * @returns FindAdjacencyForEachOutsidePointUsingGridOutput  
         * This returns an object with:  
         * `main: V4NeighborCellType[];`  
         * `removedPoints: Partial<V4neighboringCellHolder>[];`  
         * 
         * "main" will be the most useful
         */
        findAdjacencyForEachOutsidePointUsingGrid<T>(
            grid: MDmatrix<T>,
            step = 1,
            inset = 0,
        ): FindAdjacencyForEachOutsidePointUsingGridOutput {
            return {} as FindAdjacencyForEachOutsidePointUsingGridOutput;
        }

        /**
         * WARNING: inset doesn't work
         * @returns MDV.GetNeighboringOutsidePointsUsingGridOutput  
         * It returns an object that has the keys "outsidePoints" and "removedPoints". 
         * "outsidePoints" will be the most useful
         */
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

        applyToElementAsRelativePx(el: HTMLElement) {
            el.style.left = this.x + "px";
            el.style.bottom = this.y + "px";
            el.style.width = this.w + "px";
            el.style.height = this.h + "px";
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

        getOutsidePointsReformed
        (this: MDV.V4, step = 1, inset = 0): Some8dirAndCenter<MDV.V2>[] {
            const arr: Some8dirAndCenter<MDV.V2>[] = [];
            //const maxX = this.x + this.w;
            //const maxY = this.y + this.h;

            const ib: XYWH = {
                x: this.x - inset,
                y: this.y - inset,
                w: this.x + this.w - inset,
                h: this.y + this.h - inset,
            };

            if(ib.w <= 0 || ib.h <= 0) return [];

            const LCMmaxX = ib.w - (ib.w % step) - 1;
            const LCMmaxY = ib.h - (ib.h % step) - 1;

            const set = (x: number, y: number, o: Partial<MDV.V4neighboringCellHolder>) => {
                arr.push({
                    center: new MDV.V2(x, y),
                    ...o
                });
            };

            // singular block
            if(ib.w <= ib.x + step
            && ib.h <= ib.y + step
            ) return [{
                center: new MDV.V2(this.x, this.y),
            }];

            // checka if this is a 1 block wide column
            if(ib.w <= ib.x + step) {
                // singular width (column)
                // this goes up to down

                set(ib.x, ib.y, {
                    bottom: new MDV.V2(ib.x, ib.y + step),
                });

                for(let y = ib.y + step; y < ib.h - step; y += step) {
                    set(ib.x, y, {
                        top: new MDV.V2(ib.x, y - step),
                        bottom: new MDV.V2(ib.x, y + step),
                    });
                }

                set(ib.x, LCMmaxY, {
                    top: new MDV.V2(ib.x, LCMmaxY - step)
                });

                return arr;
            } else if(ib.h <= ib.y + step) {
                // checks if this is a 1 block tall row

                // singular height (row)
                // this goes left to right

                set(ib.x, ib.y, {
                    right: new MDV.V2(ib.x + step, ib.y),
                });

                for(let x = ib.x + step; x < ib.w - step; x += step) {
                    set(x, this.y, {
                        left: new MDV.V2(x - step, ib.y),
                        right: new MDV.V2(x + step, ib.y),
                    });
                }

                set(LCMmaxX, ib.y, {
                    left: new MDV.V2(LCMmaxX - step, ib.y),
                });

                return arr;
            }

            // all the normal blocks are processed below this comment

            // top left
            set(ib.x, ib.y, {
                bottomRight: new MDV.V2(ib.x + step, ib.y + step),
                bottom: new MDV.V2(ib.x, ib.y + step),
                right: new MDV.V2(ib.x + step, ib.y),
            });

            // top right
            set(LCMmaxX, ib.y, {
                bottom: new MDV.V2(LCMmaxX, ib.y + step),
                left: new MDV.V2(LCMmaxX - step, ib.y),
                bottomLeft: new MDV.V2(LCMmaxX - step, ib.y + step),
            });

            // bottom left
            set(ib.x, LCMmaxY, {
                top: new MDV.V2(ib.x, LCMmaxY - step),
                right: new MDV.V2(ib.x + step, LCMmaxY),
                topRight: new MDV.V2(ib.x + step, LCMmaxY - step),
            });

            // bottom right
            set(LCMmaxX, LCMmaxY, {
                top: new MDV.V2(LCMmaxX, LCMmaxY - step),
                left: new MDV.V2(LCMmaxX - step, LCMmaxY),
                topLeft: new MDV.V2(LCMmaxX - step, LCMmaxY - step),
            });

            for(let x = ib.x + step; x < ib.w - step; x += step) {
                const leftX = x - step;
                const rightX = x + step;
                const bottomY = ib.y + step;

                set(x, this.y, {
                    left: new MDV.V2(leftX, ib.y),
                    bottomLeft: new MDV.V2(leftX, bottomY),
                    bottom: new MDV.V2(x, bottomY),
                    bottomRight: new MDV.V2(rightX, bottomY),
                    right: new MDV.V2(rightX, ib.y),
                });

                // recently fixed
                set(x, ib.h - step, {
                    left: new MDV.V2(leftX, ib.h),
                    topLeft: new MDV.V2(leftX, ib.h - step),
                    top: new MDV.V2(x, ib.h - step),
                    topRight: new MDV.V2(rightX, ib.h - step),
                    right: new MDV.V2(rightX, ib.h),
                });
            }

            for(let y = ib.y + step; y < ib.h - step; y += step) {
                const bottomY = y + step;

                set(ib.x, y, {
                    top: new MDV.V2(ib.x, y - step),
                    topRight: new MDV.V2(ib.x + step, y - step),
                    bottom: new MDV.V2(ib.x, bottomY),
                    bottomRight: new MDV.V2(ib.x + step, bottomY),
                    right: new MDV.V2(ib.x + step, y),
                });

                // recently fixed
                set(ib.w - step, y, {
                    topLeft: new MDV.V2(ib.w - step, y - step),
                    top: new MDV.V2(ib.w, y - step),
                    left: new MDV.V2(ib.w - step, y),
                    bottomLeft: new MDV.V2(ib.w - step, y + step),
                    bottom: new MDV.V2(ib.w, y + step),
                });
            }

            return arr;
        }

        /**
         * All neighboring points are 
         */
        getNeighboringOutsidePointsUsingGridReformed<T>(
            this: MDV.V4,
            grid: MDgrid<T>,
            step = 1,
            inset = 0,
        ): Some8dirAndCenter<V2>[] {
            const removedPoints: Some8dirAndCenter<T>[] = [];
            const oldPoints = this.getOutsidePointsReformed(step, inset);

            for(const n in oldPoints) {
                const point = oldPoints[n];
                var isPointAnOutsidePoint = false;

                for(const key in MDV.V4neighboringCellPropMap) {
                    if(!point[key]) {
                        // Check surroundings with the grid.
                        // This is to stop the greedy mesh
                        // from messing things up

                        // the fix was using point.point instead of "this"
                        var x = point.center!.x;
                        var y = point.center!.y;

                        simpleSwitch<string, keyof MDV.V4NeighborCellType>(key, {
                            topLeft() {
                                x -= step;
                                y -= step;
                            },
                            top() {y -= step},
                            topRight() {
                                x += step;
                                y -= step;
                            },
                            bottomLeft() {
                                x -= step;
                                y += step;
                            },
                            bottom() {y += step},
                            bottomRight() {
                                x += step;
                                y += step;
                            },
                            left() {x -= step},
                            right() {x += step},
                        });

                        const found = grid.get(point.center);

                        if(found) point[key] = new MDV.V2(x, y);
                        else isPointAnOutsidePoint = true;
                    }
                }

                // checks if all 8 surroundings are
                // not air

                if(!isPointAnOutsidePoint)
                    for(const key in MDV.V4neighboringCellPropMap) 
                        if(!point[key]) {
                            isPointAnOutsidePoint = true;
                            break;
                        }

                // Any point that doesn't border air
                // if(!isPointAnOutsidePoint) {
                //     removedPoints.push(...oldPoints.splice(Number(n), 1));
                // }
            }

            return oldPoints;
        }
    }
}

Object.assign(MDV.V4.prototype, vectorMixin1);
Object.assign(MDV.V4.prototype, vectorMixin2);
