

// new SimpleExpander<[number, number, number], void>(([x, y, expected]) => {
//     const points = new MDV.V4(0, 0, x, y).getNeighboringOutsidePoints();
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

import { SimpleExpander } from "../util";
import { MDV } from "./vectors";

// const el = $$("div", {
//     attrs: {
//         id: "vec-div"
//     }
// });

// function stringify(point: Partial<MDV.V4neighboringCellHolder>): HTMLParagraphElement[] {
//     const arr: HTMLParagraphElement[] = [];

//     for(const name in point) {
//         const val: MDV.V2 = point[name];

//         arr.push($$("p", {
//             text: `${name}: (${val.x}, ${val.y})`
//         }));
//     }

//     return arr;
// }

// new SimpleExpander<[number, number], void>(([w, h]) => {
//     const bounds = new MDV.V4(0, 0, w, h);

//     const points = bounds.getNeighboringOutsidePoints();

//     for(const point of points) {
//         const div = $$("div", {
//             attrs: {
//                 class: "vec-point"
//             },
//             children: 
//                 stringify(point)
//         });

//         // if(point.bottomLeft) div.style.gridArea = "top-right";
//         // else if(point.bottomRight) div.style.gridArea = "top-left";
//         // else if(point.topLeft) div.style.gridArea = "bottom-right";
//         // else if(point.topRight) div.style.gridArea = "bottom-left";

//         el.appendChild(div);
//     }

     
//     document.body.appendChild(el);
//     console.log(...points)
// })
// .parse([
//     [3, 3]
// ]);

export function startTests() {
    // new SimpleExpander<[number, number, number, number?], void>(([w, h, expected, steps = 1]) => {
    //     const b = new MDV.V4(0, 0, w, h);
    //     const origin = new MDV.V2(Math.floor(w / 2), Math.floor(h / 2));

    //     const cell = b.findNeighborCellsFromPoint(origin, steps);

    //     const l = Object.keys(cell).length - 1;
    //     console.assert(l == expected,
    //         `${l} != ${expected}`,
    //         cell
    //     );
    // })
    // .parse([
    //     [4, 4, 8],
    //     [4, 4, 0, 4],
    //     [4, 4, 8, 2],
    //     [2, 2, 8]
    // ]);
}