import { MD2errors } from "../../v2/errors";
import { MDV } from "./vectors";


export const vectorMixin2 = {
    findNeighborCellsFromPoint(
        this: MDV.V4, 
        point: MDV.V2,
        steps = 1, 
        grid8posCache?: Record<MDV.V4cell8sidesType, MDV.V2>
    ): Partial<MDV.V4neighboringCellHolder> {
        const o: Partial<MDV.V4neighboringCellHolder> = {
            point,
        };

        const grid = (steps == 1) ? MDV.V4.cell8posGrid : (
            grid8posCache || MDV.V4.getCell8PosGridMultipliedByNum(steps)
        );

        for(const name in grid) {
            const p: MDV.V2 = grid[name].clone();
            p.add(point);

            const hasPoint = this.containsOrAlignsWithPoint(p);

            if(hasPoint) o[name] = p;
            else console.log(p, this);
        }

        return o;
    },

    findAdjacencyFromCell(this: MDV.V4, c: Partial<MDV.V4neighboringCellHolder>):
    MDV.V4NeighborCellType {
        if(c.bottom && !c.top) {
            // located near top

            if(c.left && c.right) {
                return {
                    ...c,
                    type: "top"
                };
            } else if(!c.left && !c.right) {
                return {
                    ...c,
                    type: "top-U"
                };
            } else if(c.left) {
                return {
                    ...c,
                    type: "top-right-corner"
                };
            } else if(c.right) {
                return {
                    ...c,
                    type: "top-left-corner"
                };
            } else MD2errors.ifStatementErr();
        } else if(c.top && !c.bottom) {
            // located near bottom

            if(c.left && c.right) {
                return {
                    ...c,
                    type: "bottom"
                };
            } else if(!c.left && !c.right) {
                return {
                    ...c,
                    type: "bottom-U"
                };
            } else if(c.left) {
                return {
                    ...c,
                    type: "bottom-right-corner"
                };
            } else if(c.right) {
                return {
                    ...c,
                    type: "bottom-left-corner"
                };
            } else MD2errors.ifStatementErr();
        }

        // can be either !(top && bottom) or both top && bottom

        if(c.left) {
            // located near right

            if(!(c.top && c.bottom)) {
                return {
                    ...c,
                    type: "right-U"
                };
            } else if(c.top && c.bottom) {
                return {
                    ...c,
                    type: "right"
                };
            } else if(c.right) {
                return {
                    ...c,
                    type: "left-right-pipe"
                };
            } else MD2errors.ifStatementErr();
        } else if(c.right) {
            // located near left

            if(!(c.top && c.bottom)) {
                return {
                    ...c,
                    type: "left-U"
                };
            } else if(c.top && c.bottom) {
                return {
                    ...c,
                    type: "left"
                };
            } else MD2errors.ifStatementErr();
        }

        // can be still be either !(top && bottom) and both top && bottom

        if(c.top && c.bottom) {
            return {
                ...c,
                type: "top-down-pipe"
            };
        }

        return {
            ...c,
            type: "isolated"
        };
    },

    findAdjacencyForEachPoint(
        this: MDV.V4,
        steps = 1,
        inset = 0,

    ): MDV.V4NeighborCellType[] {
        const arr: MDV.V4NeighborCellType[] = [];
        
        this.forEachIntPoint(p => {
            const cell = this.findNeighborCellsFromPoint(p, steps);
            arr.push(this.findAdjacencyFromCell(cell));
        }, inset);

        return arr;
    },

    findAdjacencyForEachOutsidePoint(
        this: MDV.V4,
        steps = 1,
        inset = 0,
    ): MDV.V4NeighborCellType[] {
        const points = this.getNeighboringOutsidePoints(steps, inset);
        const arr: MDV.V4NeighborCellType[] = [];

        for(const c of points) {
            arr.push(this.findAdjacencyFromCell(c));
        }

        return arr;
    },


};
