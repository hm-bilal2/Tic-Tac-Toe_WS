import * as http from "http";
import * as websocket from "websocket";
import { WebSocketServer } from "ws";

const websocketServer = websocket.server;
const httpServer = http.createServer();

const port:Number = 9090;

httpServer.listen(port,()=>console.log("Listening on 9090..."));

export interface IGamesState{
    gameId:String,
    playerIds:string[],
    spectatorIds:string[],
    State:Number[][],
    currentMove:Number
}

let gameMap = new Map<String,IGamesState>(); //gameUUID-->gameState

let clientMap = new Map<String,websocket.connection>();

const winState:number[][] = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]];

const wsServer = new websocketServer({
    "httpServer":httpServer
});

wsServer.on("request",request => {
    //connect
    const connection = request.accept(null, request.origin);

    connection.on("message",message =>{
        const result = JSON.parse(message.utf8Data);
        const ClientId = result.ClientId;

        console.log(result);

        if(result.Method === "connect"){
            const addrssInfo = JSON.parse(JSON.stringify(httpServer.address()));
            const serverName = addrssInfo.address+addrssInfo.port;
            const clientId:string = generateClientId(serverName,result.Name);
            const payload = {
                ClientId : clientId,
                Method : "connect"
            }
            clientMap.set(clientId,connection);
            clientMap.get(clientId)!.send(JSON.stringify(payload));
        }

        if(result.Method === "create"){
            const state:Number[][]=[[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]];
            const gameId:String = generateGameUUID();
           
            const gamesState:IGamesState ={
                gameId : gameId,
                playerIds:[ClientId],
                spectatorIds:[],
                State:state,
                currentMove: 1
            }
            
            gameMap.set(gameId,gamesState);

            const payload = {
                Method : "create",
                ClientId : ClientId,
                GameId : gameId,
                GameState: gamesState,
                PlayerPosition : 1
            }

            clientMap.get(ClientId)!.send(JSON.stringify(payload));
        }

        if(result.Method === "requestAvailableGames"){
           
            let availableGames:String[] = [];
            gameMap.forEach(game => {
                if(game.playerIds.length == 1){
                    availableGames.push(game.gameId)
                }
            });
            const payload = {
                Method : "requestAvailableGames",
                ClientId : ClientId,
                GameIds : availableGames
            }
            clientMap.get(ClientId)!.send(JSON.stringify(payload));
        }

        if(result.Method === "joinAsPlayer"){
            const selectedGameId = result.GameId;
            let gameState:IGamesState = gameMap.get(selectedGameId)!;

            if(gameState.playerIds.length>1){
                const payload = {
                    Method:"joinAsPlayer",
                    Message : "NoSlots"
                }
                clientMap.get(ClientId)!.send(JSON.stringify(payload));
            }else{
                gameState.playerIds.push(ClientId);
                gameMap.set(selectedGameId,gameState);

                const payload = {
                    Method : "joinAsPlayer",
                    Client : ClientId,
                    Message : "Slots",
                    GameState : gameState,
                    PlayerPosition : 2
                }

                clientMap.get(ClientId)!.send(JSON.stringify(payload));
            }
        }

        if(result.Method === "startGame"){
            const selectedGameId = result.GameId;
            let gameState:IGamesState = gameMap.get(selectedGameId)!;

            const payload = {
                Method : "startGame",
                GameState : gameState
            }

            gameState.playerIds.forEach(c=> {
                clientMap.get(c)!.send(JSON.stringify(payload))
            });
            gameState.spectatorIds.forEach(s=>{
                clientMap.get(s)!.send(JSON.stringify(payload))
            });
        }

        if(result.Method === "makeMove"){
            const gameId = result.GameId;
            const position = result.Position;
            const gameState = gameMap.get(gameId)!;

            if(!checkValidPosition(position,gameState?.State)){
                const payload = {
                    Method : "makeMove",
                    GameId:gameId,
                    ClientId:ClientId,
                    GameState:gameState,
                    Valid:false
                }

                gameState.playerIds.forEach(c=> {
                    console.log(c);
                    clientMap.get(c)!.send(JSON.stringify(payload))
                });
                gameState.spectatorIds.forEach(s=>{
                    clientMap.get(s)!.send(JSON.stringify(payload))
                });
            }
            else{
                let newState = gameState.State; 
                //console.log(newState);
                const coordinates = givePositionOnGrid(position);
                const playerNumber = gameState.playerIds[0] == ClientId ? 1 : 2;
                newState[coordinates.first][coordinates.second] = gameState.playerIds[0] == ClientId ? 1 : 2;
                gameState.State = newState;
                gameState.currentMove = playerNumber == 1?2:1;

                const isWin = checkWinState(playerNumber,newState);
                let isDraw = false; 
                
                if(!isWin){
                   isDraw = checkDraw(playerNumber,newState);
                }
                    
                const payload = {
                    Method : "makeMove",
                    GameId:gameId,
                    ClientId:ClientId,
                    GameState:gameState,
                    Valid:true,
                    Win:{
                        Value:isWin,
                        PlayerNumber:playerNumber
                    },
                    Draw:isDraw
                }

                gameState.playerIds.forEach(p=> {
                    clientMap.get(p)!.send(JSON.stringify(payload))
                })
                gameState.spectatorIds.forEach(s=>{
                    clientMap.get(s)!.send(JSON.stringify(payload))
                });
            }
        }
    });
});

function givePositionOnGrid(position:number){
    let pos;
    switch (position) {
        case 1:
            pos = {
                first:0,
                second:0
            };
            break;
        case 2:
            pos = {
                first:0,
                second:1
            };
            break;
        case 3:
            pos = {
                first:0,
                second:2
            };
            break;
        case 4:
            pos = {
                first:1,
                second:0
            };
            break;
        case 5:
            pos = {
                first:1,
                second:1
            };
            break;
        case 6:
            pos = {
                first:1,
                second:2
            };
            break;
        case 7:
            pos = {
                first:2,
                second:0
            };
            break;
        case 8:
            pos = {
                first:2,
                second:1
            };
            break;
        case 9:
            pos = {
                first:2,
                second:2
            };
            break;
        default:
            pos = {
                first:-1,
                second:-1
            };
    }
    return pos;
}

function checkValidPosition(position:number,gameState:Number[][]){

    if(position < 0 || position > 9){
        return false;
    }
    const pos = givePositionOnGrid(position);
    if(gameState[pos.first][pos.second]!=-1){
        return false;
    }
    return true;
}

function checkDraw(player:Number,gameState:Number[][]){
    for(let i = 0 ;i<gameState.length;i++){
        for (let j=0 ; j<gameState[i].length;j++) {
            if (gameState[i][j] != -1) {
                return true;
            }
        }
    }
    return true;
}

function checkWinState(player:Number,gameState:Number[][]){
    for(let i = 0 ;i<winState.length;i++){
        let flag = 1;
        for (let j=0 ; j<winState[i].length;j++) {
            const pos = givePositionOnGrid(winState[i][j]);
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

function generateClientId(httpServer:string,name:string){
    return httpServer+name;
}

function generateGameUUID() { 
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}