
export async function mdLoadImage(src: string, width?: number, height?: number): 
Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
        const img = new Image(width, height);
        img.src = src;
        img.onload = () => res(img);
        img.onerror = err => rej(err);
    });
}