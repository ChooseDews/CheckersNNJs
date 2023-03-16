
const boardSize = 3;


class TicTacToe {

    constructor() {
        this.board = new Array(boardSize);
        for (let i = 0; i < boardSize; i++) this.board[i] = new Array(boardSize);
        
        this.players = [0, 1]
        this.currentPlayer = this.players[0];
        this.gameOver = false;
        this.winner = null;
        this.turns = 0;
    }

    place(player, x, y) {
        if (this.gameOver) return false;
        if (player !== this.currentPlayer) return false;
        if (this.board[x][y] !== undefined) return false;
        this.board[x][y] = player;
        this.turns++;
        this.currentPlayer = this.players[(this.players.indexOf(player) + 1) % 2];
        this.checkWin();
    }

    state(player){
        //1 is current player marker
        //-1 is opponent marker
        //0 is empty space
        let state = new Array(boardSize*boardSize);
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                let val = this.board[i][j];
                if(val === undefined) val = 0;
                else if(val === player) val = 1;
                else val = -1;
                state[i*boardSize + j] = val;
            }
        }

        return state;
    }

    print() {
        console.log("Current Player: " + this.currentPlayer + " | Turn: " + this.turns);
        let board = this.board;
        let output = "";
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                let v = board[i][j];
                if (v === undefined) v = "_";
                if (v === 0) v = "X";
                if (v === 1) v = "O";
                output += " | " + v + " ";
            }
            
            output += "| \n----------------\n";
        }
        console.log(output);
    }

    getPossibleMoves(){
        //returns an array of boardSize*boardSize booleans where true means the corresponding move is possible
        let moves = [];
        for(let i = 0; i < boardSize; i++){
            for(let j = 0; j < boardSize; j++){
                if(this.board[i][j] === undefined) moves.push(true)
                else moves.push(false);
            }
        }
        return moves;
    }

    getRowCol(index){
        let row = Math.floor(index/boardSize);
        let col = index % boardSize;
        return [row, col];
    }

    checkWin() {
        let win = false;
        let board = this.board;
        let winner = null;

        //check rows
        for (let i = 0; i < boardSize; i++) {
            let player_counts = [0, 0];
            for (let j = 0; j < boardSize; j++) {
                let val = board[i][j];
                if (val !== undefined) player_counts[val]++;
            }
            if (player_counts[0] === boardSize) {
                win = true;
                winner = 0;
            }
            if (player_counts[1] === boardSize) {
                win = true;
                winner = 1;
            }
        }

        //check columns
        for (let i = 0; i < boardSize; i++) {
            let player_counts = [0, 0];
            for (let j = 0; j < boardSize; j++) {
                let val = board[j][i];
                if (val !== undefined) player_counts[val]++;
            }
            if (player_counts[0] === boardSize) {
                win = true;
                winner = 0;
            }
            if (player_counts[1] === boardSize) {
                win = true;
                winner = 1;
            }
        }

        //check both diagonals
        let player_counts = [0, 0];
        for (let i = 0; i < boardSize; i++) {
            let val = board[i][i];
            if (val !== undefined) player_counts[val]++;
        }
        if (player_counts[0] === boardSize) {
            win = true;
            winner = 0;
        }
        if (player_counts[1] === boardSize) {
            win = true;
            winner = 1;
        }

        player_counts = [0, 0];
        for (let i = 0; i < boardSize; i++) {
            let val = board[i][boardSize - i - 1];
            if (val !== undefined) player_counts[val]++;
        }
        if (player_counts[0] === boardSize) {
            win = true;
            winner = 0;
        }
        if (player_counts[1] === boardSize) {
            win = true;
            winner = 1;
        }
        
        if(win) console.log("Player " + winner + " wins!");
        if(this.turns === boardSize*boardSize && !win){
            console.log("Tie!");
            win = true;
            winner = null;
        }
        
        this.winner = winner;
        this.gameOver = win;
    }

    static test(){
        let game = new TicTacToe();
        game.place(0, 0, 0);
        game.print()
        let state = game.state(0);
        console.log(state);
        state = game.state(1);
        console.log(state);
        game.place(1, 0, 1);
        game.place(0, 1, 0);
        game.place(1, 1, 1);
        game.place(0, 2, 0);
        game.print();
        console.log(game.winner);
    }

}

TicTacToe.test();

export default TicTacToe;