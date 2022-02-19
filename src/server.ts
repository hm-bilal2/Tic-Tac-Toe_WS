import * as http from "http";
import * as websocket from "websocket";
import { WebSocketServer } from "ws";

const websocketServer = websocket.server;
const httpServer = http.createServer();

const port:Number = 9090;

httpServer.listen(port,()=>console.log("Listening on 9090..."));

interface IGamesState{
    gameId:String,
    playerIds:string[],
    spectatorIds:string[],
    State:Number[][],
    currentPosition:Number
}

let gameMap = new Map<String,IGamesState>(); //gameUUID-->gameState

let clientMap = new Map<String,websocket.connection>();

const winState:Number[][] = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [2, 4, 6], [0, 4, 8]];

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

        if(result.Method == "connect"){
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

        if(result.Method == "create"){
            const state:Number[][]=[[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]];
            const gameId:String = generateGameUUID();
           
            const gamesState:IGamesState ={
                gameId : gameId,
                playerIds:[ClientId],
                spectatorIds:[],
                State:state,
                currentPosition:1
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

        if(result.Method == "requestAvailableGames"){
            let availableGames:String[] = [];
            gameMap.forEach(game => {
                if(game.playerIds.length == 1){
                    availableGames.push(game.gameId)
                }
            });

            connection.send(availableGames);
        }

        if(result.Method == "joinAsPlayer"){
            const selectedGameId = result.selectedId;
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
                    GeameState : gameState,

                }
                clientMap.get(ClientId)!.send(JSON.stringify(payload));
            }
        }

        if(result.Method == "makeMove"){
            const gameId = result.GameId;
            const position = result.position;
            const gameState = gameMap.get(gameId)!;

            if(!checkValidPosition(position,gameState?.State)){
                const payload = {
                    GameId:gameId,
                    ClientId:ClientId,
                    State:gameState,
                    Valid:false
                }

                gameState.playerIds.forEach(c=> {
                    clientMap.get(c)!.send(JSON.stringify(payload))
                });
                gameState.spectatorIds.forEach(s=>{
                    clientMap.get(s)!.send(JSON.stringify(payload))
                });
            }
            else{
                let newState = gameState.State;
                const coordinates = givePositionOnGrid(position);
                const playerNumber = gameState.playerIds[0] == ClientId ? 0 : 1;
                newState[coordinates[0]][coordinates[1]] = gameState.playerIds[0] == ClientId ? 0 : 1;

                const isWin = checkWinState(playerNumber,newState);
                let isDraw = false; 
                
                if(!isWin){
                   isDraw = checkDraw(playerNumber,newState);
                }
                    
                const payload = {
                    GameId:gameId,
                    ClientId:ClientId,
                    State:newState,
                    Valid:true,
                    Win:{
                        Value:isWin,
                        PlayerNumber:playerNumber
                    },
                    Draw:isDraw,
                }

                gameState.playerIds.forEach(p=> {
                    clientMap.get(p)!.send(JSON.stringify(payload))
                })
            }
        }
    });
});

function givePositionOnGrid(position:number){
    let pos = [-1,-1];
    switch (position) {
        case 1:
            pos = [0,0];
        case 2:
            pos = [0,1];
        case 3:
            pos = [0,2];
        case 4:
            pos = [1,0];
        case 5:
            pos = [1,1];
        case 6:
            pos = [1,2];
        case 7:
            pos = [2,0];
        case 8:
            pos = [2,1];
        case 9:
            pos = [2,2];
    }
    return pos;
}

function checkValidPosition(position:number,gameState:Number[][]){
    const pos:number[] = givePositionOnGrid(position);
    const firstIndex:number = pos[0];
    const secondIndex:number  = pos[1];
    if(position < 0 || position > 10 || gameState[firstIndex][secondIndex]){
        return false;
    }
    return true;
}

function checkDraw(player:Number,gameState:Number[][]){
    for(let i = 0 ;i<winState.length;i++){
        for (let j=0 ; j<winState[i].length;j++) {
            if (gameState[i][j] != -1) {
                return false;
            }
        }
    }
    return false;
}

function checkWinState(player:Number,gameState:Number[][]){
    for(let i = 0 ;i<winState.length;i++){
        let flag = 1;
        for (let j=0 ; j<winState[i].length;j++) {
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

function generateClientId(httpServer:string,name:string){
    return httpServer+name;
}

function generateGameUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}