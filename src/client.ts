import {WebSocket} from 'ws';
import * as readline from 'readline';
import { client } from 'websocket';
import { NumericLiteral } from 'typescript';

let clientId:String ;
let gameId:String;
let playerNumber:Number;
let state:Number[][];

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

let  ws = new WebSocket("ws://localhost:9090"); 
connect();



ws.onmessage = message => {
    const response = JSON.parse(message.data.toString());
    //connect

   if(response.Method == "connect"){
        clientId = response.ClientId;
        console.log(`Connected successfully, your Client Id is \n ${clientId}`);
        console.log("\nEnter From any of the below choices : \n1. Create new game\n2. Join existing game\n3. Spectate ")
       
        rl.question("Enter your choice as 1,2,3 : ",(choice)=>{
            if(choice === "1"){
                create();
            }
            else if(choice === "2"){

            }
            else if(choice === "3"){

            }
            else{
                console.log("Wrong choice");
            }
        });
    }

    if(response.Method === "create"){
        console.log(response);
        drawReferences();
        createEmptyGrid();
        gameId = response.GameId;
        playerNumber = response.PlayerNumber;
    }

    if(response.Method === "joinAsPlayer" ){
        if(response.Message == "NoSlots"){
            
        }
    }

}

function connect(){
    rl.question("Enter your name : ",(name)=>{
        const payload = {
            Name:name,
            Method:"connect"
        }
        ws.send(JSON.stringify(payload))
        console.log("Sent a payload...")
    });   
}

function create(){
    const payload = {
        Method:"create",
        ClientId : clientId
    }
    ws.send(JSON.stringify(payload));
}



function createEmptyGrid(){
    console.log("Current State");
    console.log(" | | \n | | \n | | ");
}

function createGrid(state:Number[][]){

}

function drawReferences(){
    console.log("Reference States");
    console.log("1|2|3\n4|5|6\n7|8|9");
}