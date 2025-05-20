import { $, toggleElement } from "../../lib/util";
import { copyLevel } from "./level-editor";
import { toggleLevelEditor, toggleStudio } from "./studio";

const menuBtn = $("#ui > #menu > #menu-btn") as HTMLButtonElement;
const editorBtn = $("#ui > #menu > #editor-btn") as HTMLButtonElement;
const diagBtn = $("#ui > #menu > #diagnostics-btn") as HTMLButtonElement;
const copyLevelBtn = $("#ui > #menu > #copy-level-btn") as HTMLButtonElement;
const shortcutsBtn = $("#ui > #menu > #shortcuts-btn") as HTMLButtonElement;

var isToggled = false;

menuBtn.onpointerup = function() {
    isToggled = !isToggled;
    toggleElement(editorBtn, isToggled, "block");
    toggleElement(diagBtn, isToggled, "block");
    toggleElement(copyLevelBtn, isToggled, "block");
    toggleElement(shortcutsBtn, isToggled, "block");
};
/*if(e.key == "p") {
        toggleStudio();
    } else if(e.key == "l") {
        toggleLevelEditor();
    } else if(e.key == "C") {
        copyLevel();
    } else if(e.key == "m") {
        toggleDevMove();
    } else if(e.key == "Escape") {
        disableDevMove();
    }*/

const msgBlob = new Blob([`Here are the shortcut keys and their functions:
P - Toggle studio

L - Toggle level editor

Shift + C - Copy level data. Notice: You must add player spawn manually

m - Toggle movement mode. This only works when the level editor is open`], {type: "text/plain"});

diagBtn.onpointerup = () => toggleStudio();
editorBtn.onpointerup = () => toggleLevelEditor();
copyLevelBtn.onpointerup = copyLevel;
shortcutsBtn.onpointerup = function() {
    const url = URL.createObjectURL(msgBlob);
    open(url);
};