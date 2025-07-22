import music from "../../audio/music/June 7.mp3";
import { mdshell } from "../constants";

mdshell.audio.loadAudio({
    "awake": music,
})
.then(() => mdshell.audio.startListening());

mdshell.audio.onStart = function() {
    mdshell.audio.playAudio("awake");
};