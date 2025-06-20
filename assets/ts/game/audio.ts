import { MDaudio } from "../lib/audio";
import music from "../../audio/music/June 7.mp3";

const mdaudio = new MDaudio();
mdaudio.loadAudio({
    "awake": music,
})
.then(() => mdaudio.startListening());

mdaudio.onStart = function() {
    mdaudio.playAudio("awake");
};