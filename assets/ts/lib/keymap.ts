
export class Keymap {
    onEnd: () => void = () => undefined;
    keys: {[index: string]: (x: number, y: number) => void} = {};

    run(txt: string) {
        const txtArr: string[] = txt.split("\n");  
        const yMax = txtArr.length;

        for(let y = 0; y != yMax; y++) {
            let x = 0;
            
            // Horizontal slice
            const hSlice = txtArr[y];
            for(const char of hSlice) {
                this.keys[char]?.(x, y);
                x++;
            }
        }

        this.onEnd();
    }

    key(char: string, f: (x: number, y: number) => void) {
        this.keys[char] = f;
    }

    static async buildString(endX: number, endY: number, f: (x: number, y: number) => string | undefined): Promise<string> {
        const final: string[] = [];

        const prArr: Promise<void>[] = [];

        for(let y = 0; y < endY; y++) prArr.push(
            new Promise(res => {
                setTimeout(() => {
                    findY(y);
                    res();
                });
            }),
        );

        function findY(y: number) {
            const yLayer: string[] = [];
    
            for(let x = 0; x < endX; x++) {
                const char = f(x, y) || " ";
                yLayer.push(char);
            }
    
            final.push(yLayer.join(""));
        }

        const finalPr = Promise.all(prArr);
        await finalPr;

        return final.join("\n");
    }
}