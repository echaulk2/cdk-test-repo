import { Game } from "../functions/modules";

const modules = require("../functions/modules");
const index = require("../functions/index")
//SerializeGameData
test("SerializeGameData | Success", () => {
    let gameData = { gameName:"League of Legends", yearReleased: 2008, genre: "MOBA", console: "PC", developer: "Riot Games" }
    expect(index.DeserializeGameData(gameData))
    .toEqual(new modules.Game("League of Legends", 2008, "MOBA", "PC", "Riot Games"));
});

test("SerializeGameData | Fail | no gameName", () => {
    let gameData = { yearReleased: 2008, genre: "MOBA", console: "PC", developer: "Riot Games" }
    expect(index.DeserializeGameData(gameData))
    .not.toEqual(new modules.Game("League of Legends", 2008, "MOBA", "PC", "Riot Games"));
});

test("SerializeGameData | Success | Empty JSON input", () => {
    let gameData = {}
    expect(index.DeserializeGameData(gameData))
    .toEqual({});
});
