import music from "../../audio/music/June 7.mp3";
import gunshot from "../../audio/music/gunshot.mp3";
import { md2 } from "../constants";
import { MDaudio } from "../lib/misc/audio";

export const audio = new MDaudio();

audio.loadAudio({
    "awake": music,
    "gunshot": gunshot,
})
.then(() => audio.startListening());

audio.onStart = function() {
    //audio.playAudio("awake");
};
