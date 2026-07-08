import { JSX, Signal, splitProps } from "solid-js";

export function SelectItemDiv<T extends string | number | Object | undefined>(p: {
    children: (
        setSelectedItem: (o: T) => void, 
    ) => JSX.Element;
    onSelect?: (o: T) => void;
    onUnselect?: (o: T) => void;
    itemSignal: Signal<T>;
    [i: string]: any;
}): JSX.Element {
    const [props, other] = 
    splitProps(p, ["children", "onSelect", "onUnselect", "itemSignal"]);

    const [getId, setId] = props.itemSignal;

    // function will be manually called in the onclick event thing
    function setSelectedItem(o: T) {
        if(getId() !== undefined) props.onUnselect?.(o);
        setId(o as Exclude<T, Function>);
        props.onSelect?.(o);
    }

    return <div {...other}>
        {props.children(setSelectedItem)}
    </div>
}