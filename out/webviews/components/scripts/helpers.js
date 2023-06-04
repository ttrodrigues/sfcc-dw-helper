"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJsonFile = void 0;
const fs = require("fs");
function writeJsonFile() {
    fs.writeFile("test.txt", "Hey there!", function (err) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("The file created!");
        }
    });
}
exports.writeJsonFile = writeJsonFile;
//# sourceMappingURL=helpers.js.map