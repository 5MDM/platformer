import { XYWH } from "../v2/types";
import { MDmatrix } from "./matrix";
import { SimpleExpander } from "./util";

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
    }

    export type V4cornersArray = [
        TwoNumArr,
        TwoNumArr,
        TwoNumArr,
        TwoNumArr,
    ];

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

        getOutsideIntPoints(step = 1): V2[] {
            const arr: V2[] = [];
            const maxX = this.x + this.w;
            const maxY = this.y + this.h;

            const set = (x: number, y: number) => {
                arr.push(new V2(x, y));
            };

            // singular block
            if(maxX <= this.x + step
            && maxY <= this.y + step
            ) return [new V2(this.x, this.y)];

            if(maxX <= this.x + step) {
                // singular width
                for(let y = this.y; y < maxY; y += step) {
                    set(this.x, y);
                }

                return arr;
            } else if(maxY <= this.y + step) {
                // singular height
                for(let x = this.x; x < maxX; x += step) {
                    set(x, this.y);
                }

                return arr;
            }

            for(let x = this.x; x < maxX; x += step) {
                set(x, this.y);
                set(x, maxY);
            }

            for(let y = this.y + step; y < maxY - step; y += step) {
                set(this.x, y);
                set(maxX, y);
            }

            return arr;
        }

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
    }
}

// new SimpleExpander<[number, number, number], void>(([x, y, expected]) => {
//     const points = new MDV.V4(0, 0, x, y).getOutsideIntPoints();
//     console.assert(points.length == expected, 
//         `\n"size (${x}, ${y}) with length ${points.length} != ${expected}`
//     );
// }).parse([
//     [1, 1, 1],
//     [2, 2, 4],
//     [2, 3, 6],
//     [4, 4, 12],
//     [1, 10, 10],
//     [3, 2, 6]
// ]);