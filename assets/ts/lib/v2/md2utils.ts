import { _MD2engine } from "./engine";

export class MD2utils {
    md2: _MD2engine;

    constructor(md2: _MD2engine) {
        this.md2 = md2;
    }

    // divide by block size
    dbzMfloor(...n: number[]): number[] {return n.map(i => this.dbzFloor(i))}
    dbzM(...n: number[]): number[] {return n.map(i => this.dbz(i))}
    dbz2(a: number, b: number) {return this.dbzM(a, b) as [number, number]}
    dbz2Floor(a: number, b: number) {return this.dbzMfloor(a, b) as [number, number]}
    dbz(n: number): number {return n / this.md2.blockSize}
    dbzFloor(n: number): number {return Math.floor(this.dbz(n))}

    // multiply by block size
    mbzMfloor(...n: number[]): number[] {return n.map(i => this.mbzFloor(i))}
    mbzM(...n: number[]): number[] {return n.map(i => this.mbz(i))}
    mbz(n: number): number {return n * this.md2.blockSize}
    mbzFloor(n: number): number {return Math.floor(this.mbz(n))}

    // round by block size
    roundBz(n: number): number {return this.mbz(this.dbz(n))}
}