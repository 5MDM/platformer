import { Accessor, createSignal, JSX, JSXElement, Setter, Show, Signal, splitProps } from "solid-js";

interface InnerPageBtnInfo {
    entryElF: (onClick: () => void) => JSXElement;
    pageEl: JSXElement;
}

export function InnerPage(p: {
    children: (backBtn: JSXElement) => JSXElement;
    backBtnF: (onClick: () => void) => JSXElement;
    [i: string]: any;
}): JSXElement {
    const [props, other] = splitProps(p, ["children", "backBtnF"]);

    // shows visibility for entry els
    const [getIsVisible, setIsVisible] = createSignal(true);

    const backBtn = props.backBtnF(() => setIsVisible(true));

    const data = props.children(backBtn) as unknown as 
    Accessor<InnerPageBtnInfo>[] | Accessor<InnerPageBtnInfo>;

    const btnElements: JSXElement[] = [];
    const pageElements: JSXElement[] = [];

    var lastSetter: Setter<boolean> | undefined;

    function parseData(getData: Accessor<InnerPageBtnInfo>) {
        const {entryElF, pageEl} = getData();
        const [getIsPageVisible, setIsPageVisible] = createSignal(true);

        btnElements.push(
            // entryElF is the function that gives the button or element
            // that goes to the page
            entryElF(() => {
                // on button click
                if(lastSetter) lastSetter(false);
                setIsVisible(false);
                setIsPageVisible(true);
                lastSetter = setIsPageVisible;
            }),
        );

        pageElements.push(
            <Show when={getIsPageVisible()}>
                {pageEl}
            </Show>
        );
    }

    if(Array.isArray(data))
        for(const getData of data) 
            parseData(getData);
    else 
        parseData(data);

    return <Show fallback={pageElements} when={getIsVisible()}>
        {btnElements}
    </Show>;
}

export function InnerPageBtn(p: {
    text: string;
    children: JSXElement;
    [i: string]: any;
}): JSXElement {
    const [props, other] = splitProps(p, ["text", "children"]);

    const [getIsVisible, setIsVisible] = createSignal(false);

    const o: InnerPageBtnInfo = {
        entryElF: onClick => <button 
            onClick={() => {setIsVisible(true); onClick()}}
            {...other}>
            {props.text}
        </button>,
        pageEl: <Show when={getIsVisible()}>{props.children}</Show>,
    };

    return o as unknown as JSXElement;
}
