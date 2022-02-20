# Tic-Tac-Toe_WS - Multiplayer TIC-TAC-TOE game made over WebSocket.
## Steps to run the game.
1. Clone the repo.
2. Make sure you have node and npm installed 
3. Go to root.
4. Run following commands.<br>
`npm install`<br>
`tsc`<br>
5. If you get message as `tsc is not recognized as an internal or external command` then you need to run `npm install -g typescript` test by running command `tsc --version`
6. To run the server run 
`npm run srun`
7. To run client run
`npm run crun`.

### ENJOY!!!

# Features
1. Number of maximum games limited to 10.
2. Spectator mode.
3. Unique client Id check.
4. Handles ubrupt disconnections gracefully.
5. Handles games status and game map in the server efficiently.
