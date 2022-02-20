import {WebSocket} from 'ws';
import * as readline from 'readline';
import { client } from 'websocket';
import { isShorthandPropertyAssignment, NumericLiteral } from 'typescript';
import {IGamesState} from './server';

let clientId:String ;
let gameId:String;
let playerNumber:Number;
let state:Number[][];
let gameState:IGamesState ;
let currentPlayer:Number;
let availableGames:String[];

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

let  ws = new WebSocket("ws://localhost:9090"); 
connect();

ws.close = event=>{
    console.log("Server has closed the connection");
}

ws.onmessage = message => {
    const response = JSON.parse(message.data.toString());
    //connect
    if(response.Method == "idExists"){
        console.log("Id already Exists!!!");
        ws.close(); 
    }

   if(response.Method == "connect"){
        clientId = response.ClientId;
        console.log(`Connected successfully, your Client Id is \n ${clientId}\n`);
        enterChoice();     
    }

    if(response.Method === "create"){
        gameId = response.GameId;
        playerNumber = response.PlayerPosition;
        gameState = response.gamesState;

        console.log("\nGame created successfully...");
        console.log(`\nGame Id : ${gameId}`);
        console.log("\nYou are Player1 \n Waiting for Player2...")
    }

    if(response.Method === "requestAvailableGames" ){
        availableGames = response.GameIds;
        if(availableGames.length == 0 || !availableGames){
            console.log("\nNo ongoing games available!!! \n");
            console.log("\nPlease create your own game or wait for someone to create one\n");
            enterChoice();
        }
        console.log("Available Game Ids are :\n--------------------------\n");
        availableGames.forEach(gameId => {
            console.log(gameId,"\n");
        });
        rl.question("\n\nEnter game Id you want to join : \n-------------------------------\n",(id)=>{
            joinAsPlayer(id);
        })
    }

    if(response.Method === "joinAsPlayer" ){
        if(response.Message == "NoSlots"){
            console.log("\nSorry the gameId you have entered is either incorrect or there are no slots available...\n");
            console.log("Please select another option...\n");
            enterChoice();
        }else{
            gameId = response.GameState.gameId;
            playerNumber = response.PlayerPosition
            console.log("You are Player-2");
            startGame(); 
        }      
    }

    if(response.Method === "startGame" ){
        currentPlayer = response.GameState.currentMove;
        gameState = response.GameState;
        console.log("Starting The game...\n");
        createEmptyGrid();
        drawReferences();

        makeMove();
    }

    if(response.Method === "makeMove"){
        if(!response.Valid){
            console.log("\nNot a valid move...");
            console.log("Make a move again.");
            renderState(response.GameState.State);
            makeMove();
        }else{
            renderState(response.GameState.State);
            if(response.Win.Value){
                console.log(`PLAYER-${response.Win.PlayerNumber} HAS WON!!!\n\n\n`);
                if(playerNumber == currentPlayer){
                    endGame(gameId);
                }
            }
            else if(response.Draw){
                console.log("ITS A DRAW!!!\n\n\n");
                if(playerNumber == currentPlayer){
                    endGame(gameId);
                }
            }else{
                gameState = response.GameState;
                currentPlayer = response.GameState.currentMove;
                makeMove();
            }
        }       
    }

    if(response.Method === "requestAllGames" ){
        availableGames = response.GameIds;
        if(availableGames.length == 0 || !availableGames){
            console.log("NO ONGOING GAME AVAILABLE!!! \n");
            console.log("Please create your own game or wait for someone to create one\n");
            enterChoice();
        }
        console.log("Available Game Ids are :\n-------------------------\n");
        availableGames.forEach(gameId => {
            console.log(gameId);
        });
        rl.question("Enter game Id you want to join as spectator : \n",(id)=>{
            joinAsSpectator(id);
        })
    }

    if(response.Method === "joinAsSpectator"){
        playerNumber = response.PlayerPosition;
        gameState = response.GameState;
        console.log("\nJoined game as spectator...");
        renderState(gameState.State);
    }

    if(response.Method == "gameOverload"){
        console.log("\nToo many games!!!");
        ws.close();
    }
}

function endGame(gameId:String){
    const payload = {
        Method:"endGame",
        GameId : gameId
    }
    ws.send(JSON.stringify(payload));
}

function connect(){
    rl.question("Enter your name : ",(name)=>{
        const payload = {
            Name:name,
            Method:"connect"
        }
        ws.send(JSON.stringify(payload))
        console.log("Initiated Connection. Please wait...")
    });   
}

function create(){
    const payload = {
        Method:"create",
        ClientId : clientId
    }
    ws.send(JSON.stringify(payload));
}

function getAvailablegames(){
    const payload = {
        Method : "requestAvailableGames",
        ClientId : clientId
    }
    ws.send(JSON.stringify(payload));
}

function joinAsPlayer(gameId:String){
    const payload = {
        Method : "joinAsPlayer",
        ClientId : clientId,
        GameId : gameId
    }
    ws.send(JSON.stringify(payload));
}

function getAllGames(){
    const payload = {
        Method : "requestAllGames",
        ClientId : clientId
    }
    ws.send(JSON.stringify(payload));
}

function joinAsSpectator(gameId:string){
    const payload = {
        Method : "joinAsSpectator",
        ClientId : clientId,
        GameId : gameId
    }
    ws.send(JSON.stringify(payload));
}

function startGame(){
    const payload = {
        Method : "startGame",
        ClientId : clientId,
        GameId : gameId
    }
    ws.send(JSON.stringify(payload));
}

function makeMove(){
    if(playerNumber === currentPlayer){
        rl.question("\nPlease select an empty slot : ",(pos)=>{
            
            const payload = {
                Method : "makeMove",
                ClientId : clientId,
                GameId : gameId,
                Position : parseInt(pos)
            }
            ws.send(JSON.stringify(payload));
        });
    }else{
        console.log(`\nWait untill Player-${currentPlayer} makes a move\n`);
    }
}

function enterChoice(){
    console.log("\nEnter From any of the below choices : \n1. Create new game\n2. Join existing game\n3. Spectate ")
    rl.question("Enter your choice as 1,2,3 : \n",(choice)=>{
        if(choice === "1"){
            create();
        }
        else if(choice === "2"){
            getAvailablegames();
        }
        else if(choice === "3"){
            getAllGames();
        }
        else{
            console.log("Invalid choice");
            enterChoice();
        }
    });
}

function createEmptyGrid(){
    console.log("Initial State");
    console.log(" | | \n | | \n | | ");
}

function renderState(state:Number[][]){
    for(let i = 0;i < 3;i++){
        for(let j = 0;j < 3; j++){
            if(state[i][j] == -1){
                process.stdout.write(" ");
            }else{
                process.stdout.write(state[i][j].toString());
            }
            if(j != 2){
                process.stdout.write("|");
            }
        }
        console.log("");
        if(i!=2){
            console.log("---------");
        }
    }
    console.log();
}

function drawReferences(){
    console.log("Reference States");
    console.log("1|2|3\n4|5|6\n7|8|9\n");
}