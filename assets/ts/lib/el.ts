
export class ElList<T> {
    selectClassName: string;

    elementCreator: (opts: T) => HTMLElement;

    flags: Record<string, boolean> = {};

    onUp: (el: HTMLElement) => void;

    constructor(
        selectClassName: string, 
        elementCreator: (opts: T) => HTMLElement, 
        onUp: (el: HTMLElement) => void
    ) {
        this.elementCreator = elementCreator;
        this.selectClassName = selectClassName;
        this.onUp = onUp;
    }

    parse(arr: T[], parent: HTMLElement) {
        const elements: HTMLElement[] = [];

        for(const i of arr)
            elements.push(this.elementCreator(i));

        for(const element of elements) {
            element.addEventListener("pointerup", () => this.onUp(element))
            parent.appendChild(element);
        }
    }
}