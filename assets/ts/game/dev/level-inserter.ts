import { mdshell } from "../../constants";

var num = 100;

function insertLevel(txt: string) {
    var json;

    try {
        json = JSON.parse(txt);
    } catch(err) {
        console.error(err);
        alert("The level data you entered is invalid");
        return;
    }

    const levelName = (num++).toString();
    mdshell.addLevel(levelName, json);

    try {
        mdshell.destroyCurrentLevel();  
        mdshell.setCurrentLevel(levelName);
    } catch(err) {
        console.error(err);
        alert(
            "There's a problem with loading the level. "
        +   "It might be an issue with the mods or the game engine. "
        +   "The JSON is valid but the game engine is unable to parse it. "
        +   "Please check the console to find out the issue"
        );
        return;
    }
}

export function promptLevelInput() {
    const levelJson = prompt("Enter level JSON");
    if(!levelJson) return;

    insertLevel(levelJson);
}