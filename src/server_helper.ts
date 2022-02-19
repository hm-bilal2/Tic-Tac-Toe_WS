export function givePositionOnGrid(position:number){
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

export function checkValidPosition(position:number,gameState:Number[][]){

    if(position < 0 || position > 9){
        return false;
    }
    const pos = givePositionOnGrid(position);
    if(gameState[pos.first][pos.second]!=-1){
        return false;
    }
    return true;
}

export function checkDraw(player:Number,gameState:Number[][]){
    for(let i = 0 ;i<gameState.length;i++){
        for (let j=0 ; j<gameState[i].length;j++) {
            if (gameState[i][j] != -1) {
                return true;
            }
        }
    }
    return true;
}

export function checkWinState(player:Number,gameState:Number[][],winState:number[][]){
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

export function generateClientId(httpServer:string,name:string){
    return httpServer+name;
}

export function generateGameUUID() { 
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