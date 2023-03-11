import NeuralNetwork from "./NeuralNetwork.js";
import CheckersGame from "../CheckersGame.js";

import cliProgress from 'cli-progress';

//we need to create a neural network that can take in a board state and output a move
//the board state will be a 8x8 array of 0s and 1s
//plus a 1 for the current player

//the output will be a 8*2*2 array of 0s and 1s to represent the from and to positions of the move

//the neural network will be trained by playing games against itself

function makePopulation(size) {
    let population = [];
    for (let i = 0; i < size; i++) {
        population.push(new NeuralNetwork( 8*8 + 1, [30, 30, 30], [8,8,8] ));
    }
    return population;
}



function getMove(game, player, playerIndex){
    let input = game.getBoardState();
    input = [...input, playerIndex]
    let output = player.predict(input);
    //output is a 3*8 array where [0,1,2,3] are the from row, from col, to row, to col respectively
    // the last 8 elements are the probabilities of each possible move 1-4 directions are for single moves, 5-8 are for double moves
    let fromRow = output[0].indexOf(Math.max(...output[0]));
    let fromCol = output[1].indexOf(Math.max(...output[1]));
    
    let move = output[2].indexOf(Math.max(...output[2]));

    output = [fromRow, fromCol, move];

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

     
    return {fromRow, fromCol, toRow, toCol};
}

function makeMove(game, player, playerIndex){
    let move = getMove(game, player, playerIndex);
    let result = game.move(move.fromRow, move.fromCol, move.toRow, move.toCol);
    return result;
}
let n = 100

function matePlayers(players){
    //randomly combine multiple players to create a new player until we have 200 players
    let newPlayers = [];
    while(newPlayers.length < n){
        let player1 = players[Math.floor(Math.random() * players.length)];
        let player2 = players[Math.floor(Math.random() * players.length)];
        let newPlayer = player1.mate(player2);
        newPlayers.push(newPlayer);
    }
    return newPlayers;
}

let players = makePopulation(n); //make 2 players
let maxRounds = 0;
let maxRoundsPlayer = null;
let topPlayers = [];



let j=0;
while (true) {
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar1.start(n, 0);
    for (let player of players) {

        bar1.update(j++);
    
        let game = new CheckersGame(); //create a game with the players
        let currentPlayer = 0;
        let rounds = 0;
        let maxIterations = 500;
        for (let i = 0; i < maxIterations; i++) {
            let result = makeMove(game, player, currentPlayer);
            if (result.success) {
                currentPlayer = (currentPlayer + 1) % 2;
                rounds++;
            }else{
                player.mutate(0.5);
            }
            if(game.state == "finished"){
                break;
            }
        }
        if (rounds > maxRounds) {
            maxRounds = rounds;
            maxRoundsPlayer = player
        }
        if (rounds >= 2) {
            topPlayers.push(player);
        }
        console.log("rounds: ", rounds)
      
    }
    console.log("finished round")
    console.log(maxRounds);
    console.log(topPlayers)
    bar1.stop();
    players = matePlayers(topPlayers);
}




game.board.printBoard();

