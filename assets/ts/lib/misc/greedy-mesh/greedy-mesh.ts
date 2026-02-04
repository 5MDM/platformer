import { XYWH } from "../../v2/types";
import { Keymap } from "../keymap";
import { MDmatrix } from "../matrix";
import { SimpleExpander } from "../util";

function sweep(output: XYWH[], matrix: MDmatrix<boolean>, x: number, y: number) {
    var w = 0;
    var h = 0;
    
    const res: boolean | undefined = matrix.get(x, y);
    if(!res) return;

    for(let fx = x; fx < matrix.w; fx++) {
        const res: boolean | undefined = matrix.get(fx, y);
        
        if(!res) break;
        w++;
    }

    for(let fy = y; fy < matrix.h; fy++) {
        var hasEnded = false;
        
        for(let fx = x; fx < x+w; fx++) {
            const res: boolean | undefined = matrix.get(fx, fy);
            
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

    output.push({x, y, w, h});
}

export function greedyMeshBooleans(m: MDmatrix<boolean>): XYWH[] {
    const output: XYWH[] = [];
    
    for(let y = 0; y < m.h; y++) {
        for(let x = 0; x < m.w; x++) {
            sweep(output, m, x, y);
        }
    }

    return output;
}

export function greedyMeshStrings(m: MDmatrix<string>): Record<string, XYWH[]> {
    const matrices: Record<string, MDmatrix<true>> = {};
    const output: Record<string, XYWH[]> = {};

    // this loop only shows 1 item for some reason
    m.advForEach((t, v2) => {
        if(!matrices[t]) 
            matrices[t] = new MDmatrix<true>(m.w, m.h);

        matrices[t].set(v2.x, v2.y, true);
        
        return true;
    });

    for(const name in matrices) {
        const matrix = matrices[name];
        const arr = greedyMeshBooleans(matrix);

        output[name] = arr;
    }

    return output;
}