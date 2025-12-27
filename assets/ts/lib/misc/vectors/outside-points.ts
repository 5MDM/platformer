import { XYWH } from "../../v2/types";
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

    getNeighboringOutsidePoints(this: MDV.V4, step = 1, inset = 0): Partial<MDV.V4neighboringCellHolder>[] {
        const arr: Partial<MDV.V4neighboringCellHolder>[] = [];
        const maxX = this.x + this.w;
        const maxY = this.y + this.h;

        const ib: XYWH = {
            x: this.x - inset,
            y: this.y - inset,
            w: maxX - inset,
            h: maxY - inset,
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

        if(maxX <= this.x + step) {
            // singular width (column)
            set(this.x, this.y, {
                bottom: new MDV.V2(this.x, this.y + step),
            });

            for(let y = this.y + step; y < maxY - step; y += step) {
                set(this.x, y, {
                    top: new MDV.V2(this.x, y - step),
                    bottom: new MDV.V2(this.x, y + step),
                });
            }

            set(this.x, LCMmaxY, {
                top: new MDV.V2(this.x, LCMmaxY - step)
            });

            return arr;
        } else if(maxY <= this.y + step) {
            // singular height (row)
            set(this.x, this.y, {
                right: new MDV.V2(this.x + step, this.y),
            });

            for(let x = this.x + step; x < maxX - step; x += step) {
                set(x, this.y, {
                    left: new MDV.V2(x - step, this.y),
                    right: new MDV.V2(x + step, this.y),
                });
            }

            set(LCMmaxX, this.y, {
                left: new MDV.V2(LCMmaxX - step, this.y),
            });

            return arr;
        }

        // top left
        set(this.x, this.y, {
            bottomRight: new MDV.V2(this.x + step, this.y + step),
            bottom: new MDV.V2(this.x, this.y + step),
            right: new MDV.V2(this.x + step, this.y),
        });

        // top right
        set(LCMmaxX, this.y, {
            bottom: new MDV.V2(LCMmaxX, this.y + step),
            left: new MDV.V2(LCMmaxX - step, this.y),
            bottomLeft: new MDV.V2(LCMmaxX - step, this.y + step),
        });

        // bottom left
        set(this.x, LCMmaxY, {
            top: new MDV.V2(this.x, LCMmaxY - step),
            right: new MDV.V2(this.x + step, LCMmaxY),
            topRight: new MDV.V2(this.x + step, LCMmaxY - step),
        });

        // bottom right
        set(LCMmaxX, LCMmaxY, {
            top: new MDV.V2(LCMmaxX, LCMmaxY - step),
            left: new MDV.V2(LCMmaxX - step, LCMmaxY),
            topLeft: new MDV.V2(LCMmaxX - step, LCMmaxY - step),
        });

        for(let x = this.x + step; x < maxX - step; x += step) {
            const leftX = x - step;
            const rightX = x + step;
            const bottomY = this.y + step;

            set(x, this.y, {
                left: new MDV.V2(leftX, this.y),
                bottomLeft: new MDV.V2(leftX, bottomY),
                bottom: new MDV.V2(x, bottomY),
                bottomRight: new MDV.V2(rightX, bottomY),
                right: new MDV.V2(rightX, this.y),
            });

            set(x, maxY, {
                left: new MDV.V2(leftX, maxY),
                topLeft: new MDV.V2(leftX, maxY - step),
                top: new MDV.V2(x, maxY - step),
                topRight: new MDV.V2(rightX, maxY - step),
                right: new MDV.V2(rightX, maxY),
            });
        }

        for(let y = this.y + step; y < maxY - step; y += step) {
            const bottomY = y + step;

            set(this.x, y, {
                top: new MDV.V2(this.x, y - step),
                topRight: new MDV.V2(this.x + step, y - step),
                bottom: new MDV.V2(this.x, bottomY),
                bottomRight: new MDV.V2(this.x + step, bottomY),
                right: new MDV.V2(this.x + step, y),
            });

            set(maxX, y, {
                topLeft: new MDV.V2(maxX - step, y - step),
                top: new MDV.V2(maxX, y - step),
                left: new MDV.V2(maxX - step, y),
                bottomLeft: new MDV.V2(maxX - step, y + step),
                bottom: new MDV.V2(maxX, y + step),
            });
        }

        return arr;
    }
};