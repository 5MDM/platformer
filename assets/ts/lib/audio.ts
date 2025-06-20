import { MDshell } from "./md-framework/shell";

export class MDaudio {
    audioContext = new AudioContext();
    audios: Record<string, AudioBufferSourceNode> = {};
    isReady = false;

    private listenerIDs: Record<string, () => void> = {};

    constructor() {
    }

    onStart = () => undefined;

    startListening() {
        if(this.isReady) return;

        this.DOMlisten("keydown", () => this.prime());
        this.DOMlisten("touchend", () => this.prime());
        this.DOMlisten("mousedown", () => this.prime());
        this.DOMlisten("click", () => this.prime());
    }

    private DOMlisten<K extends keyof WindowEventMap>(type: K, f: () => void) {
        this.listenerIDs[type] = f;
        addEventListener(type, f);
    }

    private removeDOMlisteners() {
        for(const type in this.listenerIDs) removeEventListener(type, this.listenerIDs[type]);
    }

    private prime() {    
        if(this.isReady) return;
        this.isReady = true;
        this.onStart();
        this.removeDOMlisteners();
    }

    async loadAudio(arr: Record<string, string>): Promise<void> {
        const pr = new Promise<void>(
            res => {
                for(const name in arr) {
                    fetch(arr[name])
                    .then(e => e.arrayBuffer())
                    .then(buffer => this.audioContext.decodeAudioData(buffer))
                    .then(audioBuffer => {
                        this.loadBuffer(name, audioBuffer);
                        res();
                    });
                }
            }
        );

        return pr;
    }

    private loadBuffer(name: string, buffer: AudioBuffer) {
        const src = this.audioContext.createBufferSource();
        src.buffer = buffer;
        src.connect(this.audioContext.destination);

        this.audios[name] = src;
    }

    playAudio(name: string) {
        if(!this.isReady) 
            return MDshell.Err(`Can't play "${name}" because context isn't ready`);

        const val = this.audios[name];
        if(!val) return MDshell.Err(`Can't find audio "${name}"`);

        
        val.start();
    }
}