

import { RandomTicTacPlayer } from "./TicTacPlayer.js";
import TicTacToe from "./TicTacToeGame.js";



let game_count = 10;

for(let i = 0; i < game_count; i++){
    let game = new TicTacToe();
    let player1 = new RandomTicTacPlayer(0);
    let player2 = new RandomTicTacPlayer(1);
    let players = [player1, player2];
    while(!game.gameOver){
        let currentPlayer = game.currentPlayer;
        let player = players[currentPlayer];
        game.print()
        player.makeMove(game);
    }
}