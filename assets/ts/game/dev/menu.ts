import { $, toggleElement } from "../../lib/util";
import { copyLevel } from "./level-editor";
import { toggleLevelEditor, toggleStudio } from "./studio";

const menuBtn = $("#ui > #menu > #menu-btn") as HTMLButtonElement;
const editorBtn = $("#ui > #menu > #editor-btn") as HTMLButtonElement;
const diagBtn = $("#ui > #menu > #diagnostics-btn") as HTMLButtonElement;
const copyLevelBtn = $("#ui > #menu > #copy-level-btn") as HTMLButtonElement;

var isToggled = false;

menuBtn.onpointerup = function() {
    isToggled = !isToggled;
    toggleElement(editorBtn, isToggled, "block");
    toggleElement(diagBtn, isToggled, "block");
    toggleElement(copyLevelBtn, isToggled, "block");
};

diagBtn.onpointerup = () => toggleStudio();
editorBtn.onpointerup = () => toggleLevelEditor();
copyLevelBtn.onpointerup = copyLevel;