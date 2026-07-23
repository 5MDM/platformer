
interface AdvancedListenerOptsIncomplete<T extends EventTarget, Input> {
    eventTarget: T;
    f: (o: Input) => void;
    isMounted: boolean;
    event: string;
    context?: any;
};

type AdvancedListenerOpts<T extends EventTarget, Input> = 
AdvancedListenerOptsIncomplete<T, Input> 
& ({event: string; events?: never} | {event?: never; events: string[]});

export class AdvancedListener<T extends EventTarget, Input extends Event> {
    readonly eventTarget: T;
    readonly f: (o: Input) => void;
    readonly events: string[];
    isMounted: boolean;

    constructor(o: AdvancedListenerOpts<T, Input>) {
        this.eventTarget = o.eventTarget;
        this.f = o.f.bind(o.context);
        this.isMounted = o.isMounted;

        if(o.event) this.events = [o.event];
        else if(o.events) this.events = o.events;
        else this.events = [];
    }

    unmount() {
        if(!this.isMounted) return;
        for(const event of this.events)
            this.eventTarget.removeEventListener(event, this.f as (o: Event) => void);
        this.isMounted = false;
    }

    mount() {
        if(this.isMounted) return;
        for(const event of this.events) 
            this.eventTarget.addEventListener(event, this.f as (o: Event) => void);
        this.isMounted = true;
    }
}