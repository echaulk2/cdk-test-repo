const functions = require("../functions/functions");
const modules = require("../functions/modules");

test("Get Game Success", () => {
    expect(functions.getGame("League of Legeneds")).toBe({
        statusCode: 200,
        body: JSON.stringify(new modules.Game("League of Legends"))
    })
})
