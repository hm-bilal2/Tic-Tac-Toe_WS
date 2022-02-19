"use strict";
exports.__esModule = true;
var ws_1 = require("ws");
var readline = require("readline");
var clientId;
var gameId;
var playerNumber;
var state;
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var ws = new ws_1.WebSocket("ws://localhost:9090");
connect();
ws.onmessage = function (message) {
    var response = JSON.parse(message.data.toString());
    //connect
    if (response.Method == "connect") {
        clientId = response.ClientId;
        console.log("Connected successfully, your Client Id is \n ".concat(clientId));
        console.log("\nEnter From any of the below choices : \n1. Create new game\n2. Join existing game\n3. Spectate ");
        rl.question("Enter your choice as 1,2,3 : ", function (choice) {
            if (choice === "1") {
                create();
            }
            else if (choice === "2") {
            }
            else if (choice === "3") {
            }
            else {
                console.log("Wrong choice");
            }
        });
    }
    if (response.Method === "create") {
        console.log(response);
        drawReferences();
        createEmptyGrid();
        gameId = response.GameId;
        playerNumber = response.PlayerNumber;
    }
};
function connect() {
    rl.question("Enter your name : ", function (name) {
        var payload = {
            Name: name,
            Method: "connect"
        };
        ws.send(JSON.stringify(payload));
        console.log("Sent a payload...");
    });
}
function create() {
    var payload = {
        Method: "create",
        ClientId: clientId
    };
    ws.send(JSON.stringify(payload));
}
function createEmptyGrid() {
    console.log(" | | \n | | \n | | ");
}
function createGrid(state) {
}
function drawReferences() {
    console.log("1|2|3\n4|5|6\n7|8|9");
}
