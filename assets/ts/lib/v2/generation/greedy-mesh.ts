import { Keymap } from "../../misc/keymap";
import { MDmatrix } from "../../misc/matrix";
import { createDegreesRecord, Degrees, degToRad, radToDeg } from "../../misc/util";
import { AnyBlock, BasicBox, FgBlock } from "../blocks/blocks";
import { LevelJSONoutput, MDgameGridType, WorldGrids } from "../types";

interface Bounds {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    name: string;
    doesExist: boolean;
}

export function greedyMesh(grids: WorldGrids): LevelJSONoutput[] {
    const lists: Record<MDgameGridType, Record<Degrees, Record<number, AnyBlock>>> = {
        fg: createDegreesRecord(),
        bg: createDegreesRecord(),
        overlay: createDegreesRecord(),
    };

    const blockNames: Record<Degrees, Record<string, MDmatrix<AnyBlock>>> = createDegreesRecord();

    grids.fg.forEach((block) => lists.fg[block.rotation as Degrees][block.id] = block);
    grids.bg.forEach((block) => lists.bg[block.rotation as Degrees][block.id] = block);
    grids.overlay.forEach((block) => lists.overlay[block.rotation as Degrees][block.id] = block);
    
    // sort grids
    for(const type in lists) {    
        const degreeList = lists[type as MDgameGridType] as Record<Degrees, Record<number, AnyBlock>>;

        for(const degree in degreeList) {
            const list = degreeList[Number(degree) as Degrees];

            for(const id in list) {
                // each id is unique
                const block = list[id];
                if(!blockNames[block.rotation as Degrees][block.name]) 
                    blockNames[block.rotation as Degrees][block.name] = 
                    new MDmatrix<AnyBlock>(grids.bg.w, grids.bg.h);

                // blockNames[block.rotation as Degrees][block.name]
                // .set(block.x / block.blockSize, block.y / block.blockSize, block);

                const matrix = blockNames[block.rotation as Degrees][block.name];

                Keymap.IterateGMrect(
                    block.x / block.blockSize,
                    block.y / block.blockSize,
                    block.w / block.blockSize,
                    block.h / block.blockSize,
                    (x, y) => matrix.set(x, y, block),
                );
            }

            const grid = grids[type as MDgameGridType];
            grid.clear();
        }
    }   
    
    const output: LevelJSONoutput[] = [];

    for(const degreesS in blockNames) {
        const degrees = Number(degreesS) as Degrees;
        const list = blockNames[degrees];

        for(const name in list) {
            const grid = list[name];
        
            output.push(...gMparseIndividual(grid, name, degrees));
        }
    }

    return output;
}

export function greedyMeshGridFromBlockDeletion(block: AnyBlock, dx: number, dy: number): LevelJSONoutput[] {
    const matrix = new MDmatrix<AnyBlock>(...block.getWorldGridSize());
    const [x, y] = block.getWorldGridPos();

    block.iterateWorldBounds((x, y, lx, ly) => matrix.set(lx, ly, block));
    matrix.delete(dx - x, dy - y);

    if(matrix.checkIfEMpty()) return [];

    const output: LevelJSONoutput[] = 
    gMparseIndividual(matrix, block.name, block.rotation as Degrees);

    for(const i in output) {
        output[i].x += x;
        output[i].y += y;
    }

    return output;
}

export function gMparseIndividual(matrix: MDmatrix<AnyBlock>, name: string, rotation: Degrees): LevelJSONoutput[] {
    const m = matrix.matrix;
    const bounds: Bounds = {
        xmin: Infinity,
        ymin: Infinity,
        xmax: -1, 
        ymax: -1, 
        doesExist: false,
        name,
    };

    const ymax = m.length;

    for(let y = 0; y != ymax; y++) {
        let x = 0;
        
        // Horizontal slice
        const hSlice = m[y];
        for(const char of hSlice) {
            x++;
            if(!char) continue;

            if(x <= bounds.xmin) bounds.xmin = x-1;
            if(x > bounds.xmax) bounds.xmax = x+1;

            if(y < bounds.ymin) bounds.ymin = y;
            if(y >= bounds.ymax) bounds.ymax = y+1;
            if(!bounds.doesExist) bounds.doesExist = true;
        }
    }

    if(bounds.xmin >= bounds.xmax) {
        console.log(bounds);
        throw new Error("xmin >= xmax");
    }

    if(bounds.ymin >= bounds.ymax) {
        console.log(bounds);
        throw new Error("ymin >= ymax");
    }

    const mm: MDmatrix<AnyBlock> = 
    new MDmatrix(bounds.xmax - bounds.xmin, bounds.ymax - bounds.ymin);

    for(const ry in m) {
        const y = Number(ry);
        const ySlice: AnyBlock[] = m[y];

        for(const rx in ySlice) {
            const x = Number(rx);
            if(!ySlice[x]) continue;
            
            const {ymin, xmin} = bounds;
            const realY = y - ymin;
            const realX = x - xmin;

            try {
                const block = matrix.get(x, y);
                if(!block) throw new Error("Block not found");

                mm.set(realX, realY, block);
            } catch(err) {
                console.log(`${x} - ${xmin} = ${realX}`)
                console.error(`keymap.ts: out of bound coords (${realX}, ${realY})`, err);
            }
        }
    }   
    
    const output: LevelJSONoutput[] = [];

    output.push(...gmIndividual<AnyBlock>(bounds, mm, rotation));

    return output;
}

function gmIndividual<T>(bounds: Bounds, matrix: MDmatrix<T>, rotation: Degrees): LevelJSONoutput[] {
    const output: LevelJSONoutput[] = [];

    for(let y = bounds.ymin; y < bounds.ymax; y++) {
        for(let x = bounds.xmin; x < bounds.xmax; x++) {
            sweep(x, y);
        }
    }

    function sweep(rx: number, ry: number) {
        var w = 0;
        var h = 0;
        
        const x = rx - bounds.xmin;
        const y = ry - bounds.ymin;

        const res: T | undefined = matrix.get(x, y);
        if(!res) return;

        for(let fx = x; fx < bounds.xmax - bounds.xmin; fx++) {
            const res: T | undefined = matrix.get(fx, y);
            
            if(!res) break;
            w++;
        }

        for(let fy = y; fy < bounds.ymax - bounds.ymin; fy++) {
            var hasEnded = false;
            
            for(let fx = x; fx < x+w; fx++) {
                const res: T | undefined = matrix.get(fx, fy);
                
                if(!res) {
                    hasEnded = true;
                    break;
                }
            }

            if(hasEnded) break;
            h++;
        }

        for(let fy = y; fy < y+h; fy++) {
            for(let fx = x; fx < x+w; fx++) {
                matrix.delete(fx, fy);
            }
        }

        output.push({
            x: x + bounds.xmin,
            y: y + bounds.ymin,
            w,
            h,
            type: bounds.name,
            rotation,
        });
    }
    
    return output;
}