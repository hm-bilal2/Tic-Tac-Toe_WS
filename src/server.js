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
var winState = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]];
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
        if (result.Method === "connect") {
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
        if (result.Method === "create") {
            var state = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
            var gameId = generateGameUUID();
            var gamesState = {
                gameId: gameId,
                playerIds: [ClientId],
                spectatorIds: [],
                State: state,
                currentMove: 1
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
        if (result.Method === "requestAvailableGames") {
            var availableGames_1 = [];
            gameMap.forEach(function (game) {
                if (game.playerIds.length == 1) {
                    availableGames_1.push(game.gameId);
                }
            });
            var payload = {
                Method: "requestAvailableGames",
                ClientId: ClientId,
                GameIds: availableGames_1
            };
            clientMap.get(ClientId).send(JSON.stringify(payload));
        }
        if (result.Method === "joinAsPlayer") {
            var selectedGameId = result.GameId;
            var gameState = gameMap.get(selectedGameId);
            if (gameState.playerIds.length > 1) {
                var payload = {
                    Method: "joinAsPlayer",
                    Message: "NoSlots"
                };
                clientMap.get(ClientId).send(JSON.stringify(payload));
            }
            else {
                gameState.playerIds.push(ClientId);
                gameMap.set(selectedGameId, gameState);
                var payload = {
                    Method: "joinAsPlayer",
                    Client: ClientId,
                    Message: "Slots",
                    GameState: gameState,
                    PlayerPosition: 2
                };
                clientMap.get(ClientId).send(JSON.stringify(payload));
            }
        }
        if (result.Method === "startGame") {
            var selectedGameId = result.GameId;
            var gameState = gameMap.get(selectedGameId);
            var payload_1 = {
                Method: "startGame",
                GameState: gameState
            };
            gameState.playerIds.forEach(function (c) {
                clientMap.get(c).send(JSON.stringify(payload_1));
            });
            gameState.spectatorIds.forEach(function (s) {
                clientMap.get(s).send(JSON.stringify(payload_1));
            });
        }
        if (result.Method === "makeMove") {
            var gameId = result.GameId;
            var position = result.Position;
            var gameState = gameMap.get(gameId);
            if (!checkValidPosition(position, gameState === null || gameState === void 0 ? void 0 : gameState.State)) {
                var payload_2 = {
                    Method: "makeMove",
                    GameId: gameId,
                    ClientId: ClientId,
                    GameState: gameState,
                    Valid: false
                };
                gameState.playerIds.forEach(function (c) {
                    console.log(c);
                    clientMap.get(c).send(JSON.stringify(payload_2));
                });
                gameState.spectatorIds.forEach(function (s) {
                    clientMap.get(s).send(JSON.stringify(payload_2));
                });
            }
            else {
                var newState = gameState.State;
                //console.log(newState);
                var coordinates = givePositionOnGrid(position);
                var playerNumber = gameState.playerIds[0] == ClientId ? 1 : 2;
                newState[coordinates.first][coordinates.second] = gameState.playerIds[0] == ClientId ? 1 : 2;
                gameState.State = newState;
                gameState.currentMove = playerNumber == 1 ? 2 : 1;
                var isWin = checkWinState(playerNumber, newState);
                var isDraw = false;
                if (!isWin) {
                    isDraw = checkDraw(playerNumber, newState);
                }
                var payload_3 = {
                    Method: "makeMove",
                    GameId: gameId,
                    ClientId: ClientId,
                    GameState: gameState,
                    Valid: true,
                    Win: {
                        Value: isWin,
                        PlayerNumber: playerNumber
                    },
                    Draw: isDraw
                };
                gameState.playerIds.forEach(function (p) {
                    clientMap.get(p).send(JSON.stringify(payload_3));
                });
                gameState.spectatorIds.forEach(function (s) {
                    clientMap.get(s).send(JSON.stringify(payload_3));
                });
            }
        }
        if (result.Method == "getAllGames") {
            var allGames_1 = [];
            gameMap.forEach(function (game) {
                allGames_1.push(game.gameId);
            });
            var payload = {
                Method: "getAllGames",
                ClientId: ClientId,
                AllGames: allGames_1
            };
            clientMap.get(ClientId).send(JSON.stringify(payload));
        }
        if (result.Method == "joinAsSpectator") {
            var selectedGameId = result.GameId;
            var gameState = gameMap.get(selectedGameId);
            gameState.spectatorIds.push(ClientId);
            gameMap.set(selectedGameId, gameState);
            var payload = {
                Method: "joinAsSpectator",
                Client: ClientId,
                GameState: gameState,
                PlayerPosition: 3
            };
            clientMap.get(ClientId).send(JSON.stringify(payload));
        }
    });
});
function givePositionOnGrid(position) {
    var pos;
    switch (position) {
        case 1:
            pos = {
                first: 0,
                second: 0
            };
            break;
        case 2:
            pos = {
                first: 0,
                second: 1
            };
            break;
        case 3:
            pos = {
                first: 0,
                second: 2
            };
            break;
        case 4:
            pos = {
                first: 1,
                second: 0
            };
            break;
        case 5:
            pos = {
                first: 1,
                second: 1
            };
            break;
        case 6:
            pos = {
                first: 1,
                second: 2
            };
            break;
        case 7:
            pos = {
                first: 2,
                second: 0
            };
            break;
        case 8:
            pos = {
                first: 2,
                second: 1
            };
            break;
        case 9:
            pos = {
                first: 2,
                second: 2
            };
            break;
        default:
            pos = {
                first: -1,
                second: -1
            };
    }
    return pos;
}
function checkValidPosition(position, gameState) {
    if (position < 0 || position > 9) {
        return false;
    }
    var pos = givePositionOnGrid(position);
    if (gameState[pos.first][pos.second] != -1) {
        return false;
    }
    return true;
}
function checkDraw(player, gameState) {
    for (var i = 0; i < gameState.length; i++) {
        for (var j = 0; j < gameState[i].length; j++) {
            if (gameState[i][j] != -1) {
                return true;
            }
        }
    }
    return true;
}
function checkWinState(player, gameState) {
    for (var i = 0; i < winState.length; i++) {
        var flag = 1;
        for (var j = 0; j < winState[i].length; j++) {
            var pos = givePositionOnGrid(winState[i][j]);
            if (gameState[pos.first][pos.second] != player) {
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
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        }
        else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
