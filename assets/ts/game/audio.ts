import music from "../../audio/music/June 7.mp3";
import { md2 } from "../constants";
import { MDaudio } from "../lib/misc/audio";

const audio = new MDaudio();

audio.loadAudio({
    "awake": music,
})
.then(() => audio.startListening());

audio.onStart = function() {
    audio.playAudio("awake");
};
