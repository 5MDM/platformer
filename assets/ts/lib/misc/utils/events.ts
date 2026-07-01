
export function runFunctionIfDomEventHappened(
    hasHappened: boolean,
    eventName: keyof WindowEventMap,
    f: ((e: any) => void),
    opts: AddEventListenerOptions | boolean
) {
    if(hasHappened) f(undefined);
    else addEventListener(eventName, f, opts);
}

