import { assert } from "@vue/compiler-core";
import * as deepcopy from 'deepcopy';
import fs from 'fs';
//import NeuralNetwork from "./NN/NeuralNetwork.js";
//import tf, { math } from '@tensorflow/tfjs-node'
import asciichart from "asciichart";
///import cliProgress from "cli-progress"

const boardSize = 8;


function array2d(a,b){
    let arr = new Array(a);
    for (let i = 0; i < a; i++) {
        arr[i] = new Array(b);
    }
    return arr;
}


class CheckersPlayer {
    constructor(id, color) {
        this.id = id
        this.color = color;
    }
}

class Checker {
    constructor(id, player, r, c) {
        this.id = id;
        this.player = player;
        this.row = r;
        this.col = c;
        this.kinged = false;
        this.captured = false;
    }

    capture() {
        this.captured = true;
        this.kinged = false;
        this.row = null;
        this.col = null;
    }
}

class CheckersBoard {

    constructor(players) {
        this.board = array2d(boardSize, boardSize);
        this.checkers = [];
        this.players = players;
        this.populate(players);
    }

    newChecker(player, r, c) {
        let id = this.checkers.length
        let checker = new Checker(id, player, r, c);
        this.checkers.push(checker);
        return id;
    }
    
    populate([p1, p2]) {
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (i < 3 && (i + j) % 2 === 1) {
                    this.board[i][j] = this.newChecker(p1, i, j);
                } else if (i > 4 && (i + j) % 2 === 1) {
                    this.board[i][j] = this.newChecker(p2, i, j);
                }else{
                    this.board[i][j] = null;
                }
            }
        }
    }

    getCell(r, c) {
        let cellIndex = this.board[r][c];
        if (cellIndex === null) {
            return null;
        }
        return this.checkers[cellIndex];
    }

    printBoard(currentId=null, moveCount=null) {
        let symbols = ["X", "0"]
        let output = ""
        if (currentId != null) output = "Current Player: " + symbols[currentId] + "\n";
        if (moveCount != null) output += "Move Count: " + moveCount + "\n";
        output += ("    0  1  2  3  4  5  6  7\n")
        output += ("  ##########################\n")
        for (let i = 0; i < boardSize; i++) {
            let row = i + ' #';
            for (let j = 0; j < boardSize; j++) {
                let cell = this.getCell(i, j);
                if (cell === null) {
                    row += ' - ';
                } else {
                    row += " " + symbols[cell.player.id] + " ";
                };
            }
            row += '#\n';
            output += (row);
        }
        output += ("  ##########################\n")
        console.log(output);
    }

       

    move(player, r1, c1, r2, c2, checkOnly = false) {

        if(player == null) player = this.currentPlayer.id;
        if(player.id != undefined) player = player.id;

        //check if move is within bounds
        if (r1 < 0 || r1 >= boardSize || c1 < 0 || c1 >= boardSize) return {success: false, message: 'Invalid source position'};
        if (r2 < 0 || r2 >= boardSize || c2 < 0 || c2 >= boardSize) return {success: false, message: 'Invalid target position'};

        //check move distance
        let dr = Math.abs(r2 - r1);
        let dc = Math.abs(c2 - c1);
        let length = Math.sqrt(dr * dr + dc * dc);
        let jump = length > 2; //jump if move is more than 2 diagonals length=2.8284
       
        //check if move is diagonal
        if (dr !== dc) return {success: false, message: 'Move must be diagonal'};
        
        //check if move is under 2 diagonals length
        if (length > 3) return {success: false, message: 'Move must be 1 or 2 diagonals with a jump'};
            
        //check if cell is empty
        let checker = this.getCell(r1, c1);
        if (checker === null) return {success: false, message: 'No checker at ' + r1 + ', ' + c1};
        if (checker.player.id !== player) return {success: false, message: 'Not your checker. Other player\'s turn'};

        //check if move is forward if not kinged
        if (!checker.kinged) {
            if (player === 0 && r2 < r1) return {success: false, message: 'Cannot move backwards'};
            if (player === 1 && r2 > r1) return {success: false, message: 'Cannot move backwards'};
        }

        //check if move is a jump
        if (jump) {
            dr = r2 - r1;
            dc = c2 - c1;
            let r3 = r1 + dr / 2;
            let c3 = c1 + dc / 2;
            let jumped = this.getCell(r3, c3);
            if (jumped === null) return {success: false, message: 'No checker to jump'};
            if (jumped.player.id === player) return {success: false, message: 'Cannot jump your own checker'};
            if (checkOnly == false) {
                this.board[r3][c3] = null;
                jumped.capture();
             }
        }

    
        //check if target cell is empty
        let target = this.getCell(r2, c2);
        if (target !== null) {
            return {success: false, message: 'Cannot move onto an occupied cell'};
        }

        //skip move if checkOnly
        if (checkOnly) return {success: true, message: 'Move successful'};

        //move checker
        this.board[r1][c1] = null;
        this.board[r2][c2] = checker.id;
        checker.row = r2;
        checker.col = c2;

        //king checker if at end of board
        if (r2 === 0 && player === 1) checker.kinged = true;
        if (r2 === boardSize - 1 && player === 0) checker.kinged = true;

        return {success: true, message: 'Move successful'};
    }

    checkWin() {
        let p1 = this.checkers.filter(c => c.player === this.players[0] && !c.captured);
        let p2 = this.checkers.filter(c => c.player === this.players[1] && !c.captured);
        if (p1.length === 0) return this.players[1];
        if (p2.length === 0) return this.players[0];
        return null;
    }

    getScore() {
        let p1 = this.checkers.filter(c => c.player === this.players[0] && !c.captured);
        let p2 = this.checkers.filter(c => c.player === this.players[1] && !c.captured);
        return [p1.length, p2.length];
    }

    test_leaveTwoCheckers() {
        for (let i = 0; i < boardSize-1; i++) {
            for (let j = 0; j < boardSize-1; j++) {
                let checker = this.getCell(i, j);
                if (checker !== null) {
                    checker.capture();
                }
                this.board[i][j] = null;
            }
        }
    }

}

function convertMoveInt(fromRow, fromCol, move){
    let toRow, toCol;
    if(move == 0){
        toRow = fromRow + 1;
        toCol = fromCol + 1;
    }else if(move == 1){
        toRow = fromRow -1
        toCol = fromCol + 1;
    }else if(move == 2){
        toRow = fromRow - 1;
        toCol = fromCol - 1;
    }else if(move == 3){
        toRow = fromRow + 1;
        toCol = fromCol - 1;
    }else if(move == 4){
        toRow = fromRow + 2;
        toCol = fromCol + 2;
    }else if(move == 5){
        toRow = fromRow - 2;
        toCol = fromCol + 2;
    }else if(move == 6){
        toRow = fromRow - 2;
        toCol = fromCol - 2;
    }else if(move == 7){
        toRow = fromRow + 2;
        toCol = fromCol - 2;
    }
    return [toRow, toCol];
}


function getMove(game, player, playerIndex){

    let input = game.getBoardState(playerIndex);
    let output = player.predict(input);
    //output is a 3*8 array where [0,1,2,3] are the from row, from col, to row, to col respectively
    // the last 8 elements are the probabilities of each possible move 1-4 directions are for single moves, 5-8 are for double moves
    

    //find highest valid probability from position
    let options = []
    for(let i in output[0]){
        let row = Math.floor(i/boardSize);
        let col = i%boardSize;
        if(game.board.getCell(row, col) == null) continue
        if(game.board.getCell(row, col).player.id == playerIndex)
            options.push({row: row, col: col, prob: output[0][i] });
    }
    //sort options by probability
    options.sort((a,b) => (a.prob > b.prob) ? -1 : ((b.prob > a.prob) ? 1 : 0));

    let fromRow = options[0].row;
    let fromCol = options[0].col;
    let toCol, toRow;


    let moveOptions = [];
    //find highest valid probability move from position
    for(let opt of options){
        fromRow = opt.row;
        fromCol = opt.col;
        for(let i in output[1]){
            let [toRow, toCol] = convertMoveInt(fromRow, fromCol, i);
            let res = game.board.move(playerIndex, fromRow, fromCol, toRow, toCol, true); //move(player, r1, c1, r2, c2, checkOnly = false)
            if(res.success){
                moveOptions.push({move: i, prob: output[1][i], fromCol, fromRow, toCol, toRow});
            }
        }
        if (moveOptions.length > 0) break;
    }
    //sort moveOptions by probability
    moveOptions.sort((a,b) => (a.prob > b.prob) ? -1 : ((b.prob > a.prob) ? 1 : 0));

    
    let final_move = moveOptions[0];

    if (final_move == null) return null;

    fromRow = final_move.fromRow;
    fromCol = final_move.fromCol;
    toRow = final_move.toRow;
    toCol = final_move.toCol;


    return {fromRow, fromCol, toRow, toCol};
}

class CheckersGame {

    constructor() {
        this.players = [new CheckersPlayer(0, 'red'), new CheckersPlayer(1, 'black')];
        this.currentPlayer = this.players[0];
        this.board = new CheckersBoard(this.players);
        this.moveCount = 0;
        this.state = "playing"
        this.winner = null;
    }

    checkWin() {
        let winner = this.board.checkWin();
        if (winner === null) return false;
        this.state = "finished";
        this.winner = winner;
        return true;
    }

    move(r1, c1, r2, c2) {
        let result = this.board.move(this.currentPlayer, r1, c1, r2, c2);
        if (result.success) {
            this.currentPlayer = this.currentPlayer === this.players[0] ? this.players[1] : this.players[0];
            this.moveCount++;
            //console.log("Move count: " + this.moveCount);
        }
        if (this.checkWin()) {
            console.log("Game over. Winner: " + this.winner.color);
        }
        return result;
    }

    copy() {
        return deepcopy(this);
    }

    print(){
        this.board.printBoard(this.currentPlayer.id, this.moveCount);
    }

    getState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer
        }
    }

    getBoardState(playerIndex){
        //gives NN input of the board state
        let boardState = [];
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                //check if possible cell
                let checker = this.board.getCell(i, j);
                //1 if player 1, -1 if player 2, 0 if empty
                //if kinged, 2 or -2
                if (checker === null) {
                    boardState.push(0);
                }else if(checker.player.id === playerIndex){
                    boardState.push(checker.kinged ? 2 : 1);
                }else{
                    boardState.push(checker.kinged ? -2 : -1);
                }
            }
        }
        return boardState;
    }

    score() {
        return this.board.getScore();
    }

    getPossibleMoves() {
        let moves = [];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                let checker = this.board.getCell(r, c);
                if (checker === null) continue;
                if (checker.player !== this.currentPlayer) continue;

                for(let s = 1; s < 3; s++){ //s=1 for single jump, s=2 for double jump
                    for (let i = 0; i < 2; i++) {
                        for(let j = 0; j < 2; j++){
                            let r = checker.row + (j === 0 ? 1 : -1)*s;
                            let c = checker.col + (i === 0 ? 1 : -1)*s;
                            let res = this.board.move(this.currentPlayer, checker.row, checker.col, r, c, true);
                            let rr = [checker.row, checker.col, r, c];
                            if (res.success) {
                                if (s === 2) return [rr]
                                else moves.push(rr);
                            }
                        }
                    }
                }
            }
        }

        if (moves.length === 0) {
            //declare winner
            this.state = "finished";
            this.winner = this.currentPlayer === this.players[0] ? this.players[1] : this.players[0];
        }

        return moves;
    }


    
}


function runRandomGame(n=1){
    let data = {
        states: [],
        moves: [],
        player: [],
        game: []
    }
    for (let i = 0; i < n; i++) {
        let game = new CheckersGame();
        while(game.state == "playing"){
            let moves = game.getPossibleMoves();
            if (moves.length === 0) break;
            let state = game.getBoardState(game.currentPlayer.id);
            let move = moves[Math.floor(Math.random() * moves.length)];
            data.states.push(state);
            data.moves.push([...move]);
            data.player.push(game.currentPlayer.id);
            data.game.push(i);
            game.move(...move)
        }
    }
    return data;
}

function generateAndSaveData(n=1){
    if (typeof window === 'undefined') {
        let data = runRandomGame(n);
        let filename = "data/data_" + Date.now() + ".json";
        let d = JSON.stringify(data);
        fs.writeFileSync(filename, d);
        let size = fs.statSync(filename).size / (1024*1024);
        console.log("Saved data to " + filename, "Size: " + size.toFixed(2) + " MB");
    }
}

function test()
{
    let game = new CheckersGame();
    console.log(game.getState());
    game.board.printBoard();

    //test non-diagonal move
    let res = game.move(0, 1, 1, 1)
    assert (res.success==false, "Non-diagonal move should fail");
    game.board.printBoard();
    
    //test move onto occupied cell
    res = game.move(1, 1, 2, 1)
    assert (res.success==false, "Expected move to fail"); 

    //move p1 forward
    res = game.move(2, 1, 3, 2)
    assert (res.success==true, "Expected move to succeed");
    game.board.printBoard();

    //move p2 forward
    res = game.move(5, 2, 4, 1)
    assert (res.success==true, "Expected move to succeed");
    game.board.printBoard();

    //try to move p1 backwards
    res = game.move(3, 2, 2, 1)
    assert (res.success==false, "Expected move to fail");

    //move p1 forward
    res = game.move(3, 2, 4, 3)
    assert (res.success==true, "Expected move to succeed");
    game.board.printBoard();

    game.print()
    //check board state
    console.log("Player 1 board state:")
    let state = game.getBoardState(0);
    //print by rows and columns for easier reading
    for (let i = 0; i < boardSize; i++) {
        let row = "";
        for (let j = 0; j < boardSize; j++) {
            row += state[i*boardSize + j] + ", ";
        }
        console.log(row);
    }
    console.log("Player 2 board state:")
    state = game.getBoardState(1);
    //print by rows and columns for easier reading
    for (let i = 0; i < boardSize; i++) {
        let row = "";
        for (let j = 0; j < boardSize; j++) {
            row += state[i*boardSize + j] + ", ";
        }
        console.log(row);
    }

    //p2 will jump onto its own checker
    res = game.move(7, 6, 5, 4)
    assert (res.success==false, "Expected move to fail");

    //p2 will jump over p1 at 4,3
    res = game.move(5, 4, 3, 2)
    assert (res.success==true, "Expected move to succeed");
    game.print()

    //p1 will try to move 2 without jumping
    res = game.move(2, 3, 4, 5)
    assert (res.success==false, "Expected move to fail");

    //p1 will try to move 3 diagonals
    res = game.move(2, 3, 5, 6)
    assert (res.success==false, "Expected move to fail");
    game.print()

    let possibleMoves = game.getPossibleMoves();
    console.log(possibleMoves);
    
}

test()

const oneHotEncoder = (v, size) => {
    let oneHot = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
        if(i == v) oneHot[i] = 1;
    }
    return oneHot;
}

// function trainModel(){
//     let NN = new NeuralNetwork( 8*8, [60, 60, 60], [8*8,8] )
//     let data = runRandomGame(100);
//     let states = data.states; //X
//     let moves = data.moves; //Y [r1, c1, r2, c2]
//     let player = data.player; //player id


//     //convert moves to radial directions 16->8
//     let encodedMoves = moves.map(m => {

//         //map r1,c1 to 64 length array
//         let m1 = oneHotEncoder(m[0]*8 + m[1], 64);

//         let r = m[2] - m[0];
//         let c = m[3] - m[1];
//         let move = 0;
//         //convert to radial directions 0-7
//         if(r == 1 && c == 1) move = 0;
//         else if(r == -1 && c == 1) move = 1;
//         else if(r == -1 && c == -1) move = 2;
//         else if(r == 1 && c == -1) move = 3;
//         else if(r == 2 && c == 2) move = 4;
//         else if(r == -2 && c == 2) move = 5;
//         else if(r == -2 && c == -2) move = 6;
//         else if(r == 2 && c == -2) move = 7;

//         let m2 = oneHotEncoder(move, 8);

//         return [m1, m2];
//     })
    

//     //console.log(encodedMoves);

//     let X = tf.tensor(states);
//     console.log(X.shape)
    
//     let Y1 = tf.tensor(encodedMoves.map(m => m[0]));
//     let Y2 = tf.tensor(encodedMoves.map(m => m[1]));
//     console.log(Y1.shape, Y2.shape);
//     NN.model.compile({ 
//         optimizer: 'adam',
//         loss: 'binaryCrossentropy',
//         metrics: ['accuracy']
//     });

    
//     NN.model.fit(X, [Y1, Y2], { epochs: 5, batch_size: 200, shuffle: true }).then((info) => {
//         console.log("Training complete")
//         console.log(info);
//         //plot loss
//         let loss = info.history.loss;
//         let epochs = loss.length;
//         console.log(asciichart.plot(loss, { height: 20, colors: [ asciichart.blue] }));

//         evolve(NN)
//     })

// }

function sumArray(arr){
    return arr.reduce((a,b) => a+b, 0);
}

function scoreGame(game){
    let players = [0, 1]
    let scores = players.map(p => game.getBoardState(p));
    return scores.map(sumArray);
}


// async function makeACheckerPlayer(){

//     let populationSize = 20;
//     //create a random set of models
//     let models = new Array(populationSize).fill(0).map(() => new NeuralNetwork( 8*8, [60, 90], [8*8,8] ));
//     let scores = new Array(models.length).fill(0);

//     let max = 10;
//     let ii = 0;
//     while (ii < max ){ ii++;

//         console.log("Models:", models.length)
//         console.log(models)
//         // update the current value in your application..
//         console.log("Starting Game Round:", ii)
//         const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

//         //play games with each other and keep the top 5
//         //everyone will play against everyone
//         let plays = 0;
//         let playCombos = [];
//         for (let i = 0; i < models.length; i++){
//             for (let j = i+1; j < models.length; j++){
//                 //dont play against yourself
//                 if (i == j) continue;
//                 playCombos.push([i,j]);
//             }
//         }

//         bar1.start(playCombos.length, 0);

//         let results = playCombos.map((c, i) => {
//             bar1.update(i);
//             return playGameWithModels([models[c[0]], models[c[1]]])
//         })
     
//         console.log("Games finished")

//         results.forEach((r, i) => {
//             let c = playCombos[i];
//             scores[c[0]] += r[0];
//             scores[c[1]] += r[1];
//         })

//         bar1.stop();


//         //keep the top 50
//         let top = models.map((m, i) => [m, scores[i]]).sort((a,b) => b[1] - a[1]).slice(0, Math.floor(populationSize*0.5));

//         //print the top 5
//         console.log("Top 5 Scores:")
//         top.slice(0, 5).forEach(m => console.log(m[1]));

//         // //mate the top 5 models and mutate them
//         // let children = [];
//         // for (let i = 0; i < 5; i++){
//         //     for (let j = i+1; j < 5; j++){
//         //         children.push(top[i][0].mate(top[j][0]));
//         //     }
//         // }

//         //keep the top 5 and make 5 children each via mutation
//         let children = []
//         for (let i = 0; i < 5; i++){
//             for(let c = 0; c < 5; c++){
//                 children.push(top[i][0].copy().mutate(0.5));
//             }
//         }

//         //mute the top 5 
//         top.forEach(m => m[0].mutate(0.5));

//         //combine the top 5 and children
//         models = top.map(m => m[0]).concat(children);
//         scores = new Array(models.length).fill(0);
//          // stop the progress bar

//     }



// }


// function evolve(seedModel, models){

//         let relatives, scores;

//         if (seedModel){
//             relatives = new Array(10).fill(0).map(() => seedModel.copy());
//             relatives.forEach(r => r.mutate(0.1));
//             relatives.push(seedModel);
//             scores = new Array(relatives.length).fill(0);
//         }else{
//             relatives = models;
//             scores = new Array(relatives.length).fill(0);
//         }

//         //play games with each other and keep the top 5
//         for(let i = 0; i < 30; i++){
//             let random = Math.floor(Math.random() * relatives.length);
//             let random2 = Math.floor(Math.random() * relatives.length);
//             if (random == random2) continue; //don't play against yourself
//             let s = playGameWithModels([relatives[random], relatives[random2]]);
//             scores[random] += s[0];
//             scores[random2] += s[1];
//         }

//         //get top 5 from scores
//         let topRelativeIndexes = scores.map((s, i) => [s, i]).sort((a,b) => b[0] - a[0]).slice(0,5).map(i => i[1]);
//         let topRelatives = topRelativeIndexes.map(i => relatives[i]);

//         //mate the top 5
//         let newRelatives = [];
//         for(let i = 0; i < 5; i++){
//             for(let j = i+1; j < 5; j++){
//                 let child = topRelatives[i].mate(topRelatives[j]);
//                 newRelatives.push(child);
//             }
//         }

//         evolve(null, newRelatives);
// }

// function playGameWithModels(models){
//     let game = new CheckersGame();
//     //game.print()
//     let state = game.getState();
//     let i = 0;
//     while (game.state == "playing" && i < 150){
//         i++;
//         let model = models[game.currentPlayer.id];
//         let move = getMove(game, model, game.currentPlayer.id);
//         if(move == null) {
//             //console.log("No possible moves");
//             break;
//         }
//         let result = game.move(move.fromRow, move.fromCol, move.toRow, move.toCol);
//         //game.print();
//     }
//     let scores = scoreGame(game);

//     if (game.state != "playing") {
//         //we need to promote winning games
//         scores = scores.map(s => s + 100);
//     }else{
//         //we need to penalize long games and games that end in a draw
//         scores = scores.map(s => s - i*0.01);
//     }


//     //console.log("Final score: ", scores);
//     return scores
// }

// makeACheckerPlayer()

export default CheckersGame;