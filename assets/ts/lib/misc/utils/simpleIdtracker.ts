
export class SimpleUIarrayTracker {
    map = new Map<number, true>();

    counter = 0;

    mapToSortedArr(): number[] {
        return Array.from(this.map.keys()).sort((a, b) => a - b);
    }

    getFirstOpenPosition(): number {
        const arr = this.mapToSortedArr();
        if(arr.length < 1) return this.counter;

        const highestPos = arr[arr.length-1];

        for(let pos = 0; pos < highestPos; pos++) {
            const arrayPos: undefined | number = arr[pos];
            if(arrayPos === undefined || pos != arrayPos) return pos;
        }
        
        return this.counter+1;
    }

    insertAndGetPos(): number {
        const n = this.getFirstOpenPosition();
        this.map.set(n, true);
        return n;
    }

    remove(position: number) {
        this.map.delete(position);
    }
}