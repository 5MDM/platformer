import { XYWH } from "../../v2/types";
import { MDmatrix } from "../matrix";
import { simpleSwitch } from "../util";
import { MDV } from "./vectors";

export const vectorMixin1 = {
    getOutsideIntPoints(this: MDV.V4, step = 1, inset = 0): MDV.V2[] {
        const arr: MDV.V2[] = [];
        const maxX = this.x + this.w;
        const maxY = this.y + this.h;

        const set = (x: number, y: number) => {
            arr.push(new MDV.V2(x, y));
        };

        // singular block
        if(maxX <= this.x + step
        && maxY <= this.y + step
        ) return [new MDV.V2(this.x, this.y)];

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
    },

    getNeighboringOutsidePointsUsingGrid<T>(
        this: MDV.V4,
        grid: MDmatrix<T>,
        step = 1,
        inset = 0,
        
    ): MDV.GetNeighboringOutsidePointsUsingGridOutput {
        const removedPoints: Partial<MDV.V4neighboringCellHolder>[] = [];
        const oldPoints = this.getNeighboringOutsidePoints(step, inset);

        for(const n in oldPoints) {
            const point = oldPoints[n];
            var isPointAnOutsidePoint = false;

            for(const key in MDV.V4neighboringCellPropMap) {
                if(!point[key]) {
                    // Check surroundings with the grid.
                    // This is to stop the greedy mesh
                    // from messing things up

                    // topLeft: true,
                    // top: true,
                    // topRight: true,
                    // bottomLeft: true,
                    // bottom: true,
                    // bottomRight: true,
                    // left: true,
                    // right: true,

                    // the fix was using point.point instead of "this"
                    // I was stupid all along
                    var x = point.point!.x;
                    var y = point.point!.y;

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

                    const found = grid.get(x, y);

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

            if(!isPointAnOutsidePoint) {
                removedPoints.push(...oldPoints.splice(Number(n), 1));
            }
        }

        return {
            outsidePoints: oldPoints,
            removedPoints,
        };
    },

    getNeighboringOutsidePoints(this: MDV.V4, step = 1, inset = 0): Partial<MDV.V4neighboringCellHolder>[] {
        const arr: Partial<MDV.V4neighboringCellHolder>[] = [];
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
                point: new MDV.V2(x, y),
                ...o
            });
        };

        // singular block
        if(ib.w <= ib.x + step
        && ib.h <= ib.y + step
        ) return [{
            point: new MDV.V2(this.x, this.y),
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
};