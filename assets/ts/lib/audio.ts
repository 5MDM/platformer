import { MDshell } from "./md-framework/shell";

export class MDaudio {
    audioContext = new AudioContext();
    audios: Record<string, AudioBufferSourceNode> = {};
    isReady = false;

    constructor() {
    }

    onStart = () => undefined;

    startListening() {
        if(this.isReady) return;
        addEventListener("pointerdown", () => this.prime(), {once: true});
        addEventListener("focus", () => this.prime(), {once: true});
        addEventListener("keydown", () => this.prime(), {once: true});
    }

    private prime() {
        if(this.isReady) return;

        this.isReady = true;
        this.onStart();
    }

    async loadAudio(arr: string[]): Promise<void> {
        const pr = new Promise<void>(
            res => {
                for(const url of arr) {
                    const name = url.split("/").pop();
                    if(!name) throw MDshell.Err(`Audio "${url}" has invalid name`);

                    fetch(url)
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