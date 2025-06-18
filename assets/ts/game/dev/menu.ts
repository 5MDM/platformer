import { $, toggleElement } from "../../lib/util";
import { copyLevel } from "./level-editor";
import { promptLevelInput } from "./level-inserter";
import { editorState, studioState } from "./studio";

const menuBtn = $("#ui > #menu > #menu-btn") as HTMLButtonElement;
const editorBtn = $("#ui > #menu > #editor-btn") as HTMLButtonElement;
const diagBtn = $("#ui > #menu > #diagnostics-btn") as HTMLButtonElement;
const copyLevelBtn = $("#ui > #menu > #copy-level-btn") as HTMLButtonElement;
const shortcutsBtn = $("#ui > #menu > #shortcuts-btn") as HTMLButtonElement;
const insertLevelBtn = $("#ui > #menu > #insert-level-btn") as HTMLButtonElement;

var isToggled = false;

menuBtn.onpointerup = function() {
    isToggled = !isToggled;
    toggleElement(editorBtn, isToggled, "block");
    toggleElement(diagBtn, isToggled, "block");
    toggleElement(copyLevelBtn, isToggled, "block");
    toggleElement(shortcutsBtn, isToggled, "block");
    toggleElement(insertLevelBtn, isToggled, "block");
};

const msgBlob = new Blob([`Here are the shortcut keys and their functions:
P - Toggle studio

L - Toggle level editor

Shift + C - Copy level data. Notice: You must add player spawn manually

m - Toggle movement mode. If the level editor isn't open, then it resets to the default position after being turned off

r - Rotate 90 degrees clockwise

Shift + R - Rotate 90 degrees counterclockwise

Shift + L - Open level inserter

i - interact

`], {type: "text/plain"});

diagBtn.onpointerup = () => studioState.toggle();
editorBtn.onpointerup = () => editorState.toggle();
copyLevelBtn.onpointerup = copyLevel;
shortcutsBtn.onpointerup = function() {
    const url = URL.createObjectURL(msgBlob);
    open(url);
};

insertLevelBtn.onpointerup = () => promptLevelInput();