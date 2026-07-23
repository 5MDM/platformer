import { MDV } from "../vectors/vectors";
import { MDgrid } from "./grid";

export class MDboolGrid extends MDgrid<true> {
    override set(p: MDV.V2): void {
        super.set(p, true);
    }

    override place(p: MDV.V2): boolean {
        return super.place(p, true);
    }

    override forEachTile(f: (t: true, coord: MDV.V2, set: () => void) => boolean | void): void {
        for(let y = 0; y < this.grid.length; y++) {
            
            const ySlices = this.grid[y];
            
            for(let x = 0; x < ySlices.length; x++) {
                const val = ySlices[x];
                const v = new MDV.V2(x, y);
                const set = () => this.set(v);

                const canContinue = f(val, v.clone(), set) ?? true;
                if(!canContinue) return;
            }
        }
    }

    override fillWith(): void {
        super.fillWith(true);
    }

    override setAllTo(): void {}

    override setRow(y: number): void {
        super.setRow(y, true);
    }
}