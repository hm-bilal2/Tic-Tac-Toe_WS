"use strict";
exports.__esModule = true;
var http = require("http");
var websocket = require("websocket");
var websocketServer = websocket.server;
var httpServer = http.createServer();
var port = 9090;
httpServer.listen(port, function () { return console.log("Listening on 9090..."); });
var gameMap = new Map(); //gameUUID-->gameState
var clientMap = new Map();
var winState = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [2, 4, 6], [0, 4, 8]];
var wsServer = new websocketServer({
    "httpServer": httpServer
});
wsServer.on("request", function (request) {
    //connect
    var connection = request.accept(null, request.origin);
    connection.on("message", function (message) {
        var result = JSON.parse(message.utf8Data);
        var ClientId = result.ClientId;
        console.log(result);
        if (result.Method == "connect") {
            var addrssInfo = JSON.parse(JSON.stringify(httpServer.address()));
            var serverName = addrssInfo.address + addrssInfo.port;
            var clientId = generateClientId(serverName, result.Name);
            var payload = {
                ClientId: clientId,
                Method: "connect"
            };
            clientMap.set(clientId, connection);
            clientMap.get(clientId).send(JSON.stringify(payload));
        }
        if (result.Method == "create") {
            var state = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
            var gameId = generateGameUUID();
            var gamesState = {
                gameId: gameId,
                playerIds: [ClientId],
                spectatorIds: [],
                State: state,
                currentPosition: 1
            };
            gameMap.set(gameId, gamesState);
            var payload = {
                Method: "create",
                ClientId: ClientId,
                GameId: gameId,
                GameState: gamesState,
                PlayerPosition: 1
            };
            clientMap.get(ClientId).send(JSON.stringify(payload));
        }
        if (result.Method == "requestAvailableGames") {
            var availableGames_1 = [];
            gameMap.forEach(function (game) {
                if (game.playerIds.length == 1) {
                    availableGames_1.push(game.gameId);
                }
            });
            connection.send(availableGames_1);
        }
        if (result.Method == "joinAsPlayer") {
            var selectedGameId = result.selectedId;
            var gameState = gameMap.get(selectedGameId);
            if (gameState.playerIds.length > 1) {
                var payload = {
                    message: "NoSlots"
                };
                connection.send(payload);
            }
            else {
                gameState.playerIds.push(ClientId);
                gameMap.set(selectedGameId, gameState);
                var payload = {
                    Client: ClientId,
                    message: "Slots",
                    gameState: gameState
                };
                connection.send(payload);
            }
        }
        if (result.Method == "makeMove") {
            var gameId = result.GameId;
            var position = result.position;
            var gameState = gameMap.get(gameId);
            if (!checkValidPosition(position, gameState === null || gameState === void 0 ? void 0 : gameState.State)) {
                var payload_1 = {
                    GameId: gameId,
                    ClientId: ClientId,
                    State: gameState,
                    Valid: false
                };
                gameState.playerIds.forEach(function (c) {
                    clientMap.get(c).send(JSON.stringify(payload_1));
                });
                gameState.spectatorIds.forEach(function (s) {
                    clientMap.get(s).send(JSON.stringify(payload_1));
                });
            }
            else {
                var newState = gameState.State;
                var coordinates = givePositionOnGrid(position);
                var playerNumber = gameState.playerIds[0] == ClientId ? 0 : 1;
                newState[coordinates[0]][coordinates[1]] = gameState.playerIds[0] == ClientId ? 0 : 1;
                var isWin = checkWinState(playerNumber, newState);
                var isDraw = false;
                if (!isWin) {
                    isDraw = checkDraw(playerNumber, newState);
                }
                var payload_2 = {
                    GameId: gameId,
                    ClientId: ClientId,
                    State: newState,
                    Valid: true,
                    Win: {
                        Value: isWin,
                        PlayerNumber: playerNumber
                    },
                    Draw: isDraw
                };
                gameState.playerIds.forEach(function (p) {
                    clientMap.get(p).send(JSON.stringify(payload_2));
                });
            }
        }
    });
});
function givePositionOnGrid(position) {
    var pos = [-1, -1];
    switch (position) {
        case 1:
            pos = [0, 0];
        case 2:
            pos = [0, 1];
        case 3:
            pos = [0, 2];
        case 4:
            pos = [1, 0];
        case 5:
            pos = [1, 1];
        case 6:
            pos = [1, 2];
        case 7:
            pos = [2, 0];
        case 8:
            pos = [2, 1];
        case 9:
            pos = [2, 2];
    }
    return pos;
}
function checkValidPosition(position, gameState) {
    var pos = givePositionOnGrid(position);
    var firstIndex = pos[0];
    var secondIndex = pos[1];
    if (position < 0 || position > 10 || gameState[firstIndex][secondIndex]) {
        return false;
    }
    return true;
}
function checkDraw(player, gameState) {
    for (var i = 0; i < winState.length; i++) {
        for (var j = 0; j < winState[i].length; j++) {
            if (gameState[i][j] != -1) {
                return false;
            }
        }
    }
    return false;
}
function checkWinState(player, gameState) {
    for (var i = 0; i < winState.length; i++) {
        var flag = 1;
        for (var j = 0; j < winState[i].length; j++) {
            if (gameState[i][j] != player) {
                flag = 0;
                break;
            }
        }
        if (flag == 1)
            return true;
    }
    return false;
}
function generateClientId(httpServer, name) {
    return httpServer + name;
}
function generateGameUUID() {
    var d = new Date().getTime(); //Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) { //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        }
        else { //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
