import { MD2errors } from "../../v2/errors";
import { MDV } from "./vectors";


export const vectorMixin2 = {
    findAdjacencyForEachPoint(
        this: MDV.V4,
        steps = 1,
        inset = 0,
    ): MDV.V4NeighborCellType[] {
        const points = this.getNeighboringOutsidePoints(steps, inset);
        const arr: MDV.V4NeighborCellType[] = [];

        for(const c of points) {
            if(c.bottom && !c.top) {
                // located near top

                if(c.left && c.right) {
                    arr.push({
                        ...c,
                        type: "top"
                    });
                    continue;
                } else if(!c.left && !c.right) {
                    arr.push({
                        ...c,
                        type: "top-U"
                    });
                    continue;
                } else if(c.left) {
                    arr.push({
                        ...c,
                        type: "top-right-corner"
                    });
                    continue;
                } else if(c.right) {
                    arr.push({
                        ...c,
                        type: "top-left-corner"
                    });
                    continue;
                } else MD2errors.ifStatementErr();
            } else if(c.top && !c.bottom) {
                // located near bottom

                if(c.left && c.right) {
                    arr.push({
                        ...c,
                        type: "bottom"
                    });

                    continue;
                } else if(!c.left && !c.right) {
                    arr.push({
                        ...c,
                        type: "bottom-U"
                    });
                    continue;
                } else if(c.left) {
                    arr.push({
                        ...c,
                        type: "bottom-right-corner"
                    });
                    continue;
                } else if(c.right) {
                    arr.push({
                        ...c,
                        type: "bottom-left-corner"
                    });
                    continue;
                } else MD2errors.ifStatementErr();
            }

            // can be either !(top && bottom) or both top && bottom

            if(c.left) {
                // located near right

                if(!(c.top && c.bottom)) {
                    arr.push({
                        ...c,
                        type: "right-U"
                    });
                    continue;
                } else if(c.top && c.bottom) {
                    arr.push({
                        ...c,
                        type: "right"
                    });
                    continue;
                } else if(c.right) {
                    arr.push({
                        ...c,
                        type: "left-right-pipe"
                    });
                    continue;
                } else MD2errors.ifStatementErr();
            } else if(c.right) {
                // located near left

                if(!(c.top && c.bottom)) {
                    arr.push({
                        ...c,
                        type: "left-U"
                    });
                    continue;
                } else if(c.top && c.bottom) {
                    arr.push({
                        ...c,
                        type: "left"
                    });
                    continue;
                } else MD2errors.ifStatementErr();
            }

            // can be still be either !(top && bottom) and both top && bottom

            if(c.top && c.bottom) {
                arr.push({
                    ...c,
                    type: "top-down-pipe"
                });
                continue;
            }

            arr.push({
                ...c,
                type: "isolated"
            });

            console.warn("Isolated block");
        }

        return arr;
    },
};
