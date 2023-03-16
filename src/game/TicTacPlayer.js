class TicTacPlayer {

    constructor(id) {
        if (id !== 0 && id !== 1) throw new Error("Invalid player id");
        let symbol = (id === 0) ? "X" : "O"
        this.symbol = symbol;
        this.id = id; // 0 or 1
    }

}


class RandomTicTacPlayer extends TicTacPlayer {

    makeMove(game) {
        let possibleMoves = game.getPossibleMoves();
        //conver to array of indices where possibleMoves[i] is true
        let possibleIndices = [];
        for (let i = 0; i < possibleMoves.length; i++) if (possibleMoves[i]) possibleIndices.push(i);
        //choose random index
        let index = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        let [row, col] = game.getRowCol(index);
        return game.place(this.id, row, col);
    }

}

export { TicTacPlayer, RandomTicTacPlayer };
