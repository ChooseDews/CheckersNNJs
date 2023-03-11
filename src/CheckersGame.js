import { assert } from "@vue/compiler-core";
import * as deepcopy from 'deepcopy';
import fs from 'fs';

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

    printBoard(currentId=null) {
        let symbols = ["X", "0"]
        let output = ""
        if (currentId != null) output = "Current Player: " + symbols[currentId] + "\n";
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

        if(player == null) player = this.currentPlayer;

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
        if (checker.player !== player) return {success: false, message: 'Not your checker. Other player\'s turn'};

        //check if move is forward if not kinged
        if (!checker.kinged) {
            if (player.id === 0 && r2 < r1) return {success: false, message: 'Cannot move backwards'};
            if (player.id === 1 && r2 > r1) return {success: false, message: 'Cannot move backwards'};
        }

        //check if move is a jump
        if (jump) {
            dr = r2 - r1;
            dc = c2 - c1;
            let r3 = r1 + dr / 2;
            let c3 = c1 + dc / 2;
            let jumped = this.getCell(r3, c3);
            if (jumped === null) return {success: false, message: 'No checker to jump'};
            if (jumped.player === player) return {success: false, message: 'Cannot jump your own checker'};
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
        if (r2 === 0 && player.id === 1) checker.kinged = true;
        if (r2 === boardSize - 1 && player.id === 0) checker.kinged = true;

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
        this.board.printBoard(this.currentPlayer.id);
    }

    getState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer
        }
    }

    getBoardState(){
        //gives NN input of the board state
        let boardState = [];
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if ((i + j) % 2 === 0) continue;
                //check if possible cell
                let checker = this.board.getCell(i, j);
                if (checker === null) {
                    boardState.push(0);
                    boardState.push(0);
                }else{
                    boardState.push(checker.player.id === 0 ? 1 : 0);
                    boardState.push(checker.player.id === 1 ? 1 : 0);

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
            let state = game.getBoardState();
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

let randomData = runRandomGame();

console.time("generateAndSaveData");
generateAndSaveData(300);
console.timeEnd("generateAndSaveData");

export default CheckersGame;