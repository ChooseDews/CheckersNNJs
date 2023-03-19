
//import this way to avoid webpack bundling tfjs-node with other code. Kinda hacky but it works
const { RandomTicTacPlayer, NNPlayer, ConditionalTicTacPlayer } = await import("./TicTacPlayer.js");

import TicTacToe from "./TicTacToeGame.js";
import * as consoleTable from "console-table-printer";
import * as asciichart from "asciichart";


const printTable = consoleTable.printTable

let fitnessFunction = (game, playerId) => {
    //return 1 if player wins, 0.5 if draw, 0 if loss
    if (game.winner === playerId) return 1;
    if (game.winner === null) return 0;
    return -1;
}


let scorePlayers = (players, game_count = 5) => {
    if (players.length !== 2) throw new Error("Invalid number of players");
    let scores = new Array(players.length).fill(0);
    let wins = new Array(players.length).fill(0);
    let loses = new Array(players.length).fill(0);
    let ties = 0;
    for (let i = 0; i < game_count; i++) {
        let game = new TicTacToe();
        let p1_index = (i % 2 === 0) ? 0 : 1;
        let p2_index = (i % 2 === 0) ? 1 : 0;
        let p1 = players[p1_index];
        let p2 = players[p2_index];
        let game_players = [p1, p2];
        p1.setId(0); p2.setId(1); //set id of players
        while (!game.gameOver) {
            let currentPlayer = game.currentPlayer;
            let player = game_players[currentPlayer];
            player.makeMove(game);
        }
        if (game.winner === null) ties++;
        else if (game.winner === 0) { wins[p1_index]++; loses[p2_index]++ }
        else if (game.winner === 1) { wins[p2_index]++; loses[p1_index]++ }
        let p1_score = fitnessFunction(game, 0);
        let p2_score = fitnessFunction(game, 1);
        scores[p1_index] += p1_score;
        scores[p2_index] += p2_score;
    }
    scores = scores.map(score => score / game_count);
    scores = scores.map(score => score.toFixed(2));
    let tiePercentage = (100 * ties / game_count).toFixed(2);

    console.log("Game Results n=", game_count)
    printTable([
        { title: "Player[0]", score: scores[0], wins: wins[0], loses: loses[0], ties: ties },
        { title: "Player[1]", score: scores[1], wins: wins[1], loses: loses[1], ties: ties },
    ])

    return scores;
}

let scorePlayerAgainstRandom = (player, game_count = 5) => {
    let randomPlayer = new RandomTicTacPlayer();
    return scorePlayers([player, randomPlayer], game_count);
}


let playGame = async (player1, player2) => {

    //set id of players
    player1.setId(0)
    player2.setId(1)

    let players = [player1, player2];



    let game = new TicTacToe();
    while (!game.gameOver) {
        let currentPlayer = game.currentPlayer;
        let player = players[currentPlayer];
        await player.makeMove(game);
    }

    let player1_fitness = fitnessFunction(game, 0);
    let player2_fitness = fitnessFunction(game, 1);
    let was_tie = (game.winner === null);

    return { player1_fitness, player2_fitness, was_tie };

}


function generateData(player1, player2, gameCount = 1000, swapPlayers = false, dontRecordPlayer1 = false) {
    let moves = [];

    console.log("Generating data for " + gameCount + " games")

    let player_X_wins = 0;
    let player_O_wins = 0;
    let ties = 0;

    for (let i = 0; i < gameCount; i++) {
        for (let swap = 0; swap < 2; swap++) {
            let game = new TicTacToe(true);

            let players = [player1, player2];
            if (swap === 1) players = [player2, player1];

            players[0].setId(0);
            players[1].setId(1);

            while (!game.gameOver) {
                let currentPlayer = game.currentPlayer;
                let player = players[currentPlayer];
                player.makeMove(game);
            }
            if (game.winner === null) {
                if (i % 8 !== 0) { continue; } //skip most ties
            }; //skip ties
            if (game.winner === 0 && player_X_wins > player_O_wins) { i--; continue; }; //skip games where X wins too much
            if (game.winner === 0) player_X_wins++;
            if (game.winner === 1) player_O_wins++;
            if (game.winner === null) ties++;

            let history = game.history; //keep winning player's history
            for (let j = 0; j < history.length; j++) {
                let move = history[j];
                if (dontRecordPlayer1 && move[0] === player1.id) continue;
                if (move[0] === game.winner || game.winner === null) moves.push(move); //dont record a losing games moves
            }
            if (swapPlayers === false) break; //only play one game
        }
    }
    console.log("Generated X_wins: " + player_X_wins + " O_wins: " + player_O_wins + " Ties: " + ties)
    console.log("Generated " + moves.length + " moves")
    return moves;
}

async function testNNPlayer(player, name = "") {
    //showdown best player vs conditional player
    console.log(name + "Showdown: NN player vs Conditional player 2000 games")
    let score = scorePlayers([player, new ConditionalTicTacPlayer()], 2000);
    //showdown NN player vs NN player
    console.log(name+"Showdown: NN player vs NN player 2000 games")
    score = scorePlayers([player, await player.copy()], 2000);
    //showdown Conditional vs Random player
    console.log(name+"Showdown: Conditional player vs Random player 2000 games")
    score = scorePlayers([new ConditionalTicTacPlayer(), new RandomTicTacPlayer()], 2000);
    //showdown NN player vs random player
    console.log(name + "Showdown: NN player vs Random player 2000 games")
    score = scorePlayers([player, new RandomTicTacPlayer()], 2000);
    return
}


//train NN from results of games
async function trainNN() {
    let NN = new NNPlayer(0);
    console.time("Training NN");
    let moves = generateData(new ConditionalTicTacPlayer(0), new ConditionalTicTacPlayer(1), 9000, true);
    //moves = moves.concat(generateData(new ConditionalTicTacPlayer(0), new RandomTicTacPlayer(1), 300, true));
    console.log("Training NN with " + moves.length + " moves");
    let info = await NN.train(moves, 50);
    console.timeEnd("Training NN");
    //plot loss
    let loss = info.history.loss;
    console.log("## TRAINING LOSS ##")
    console.log(asciichart.plot(loss, { height: 20 }))
    //plot accuracy
    let accuracy = info.history.acc;
    console.log("## TRAINING ACCURACY ##")
    console.log(asciichart.plot(accuracy, { height: 20 }))

    //save model if node.js
    if (typeof window === 'undefined') await NN.model.model.save("file:///home/john/projects/CheckersNNJs/public/models/tictactoe"); //use tfjs-node to save model

    await testNNPlayer(NN, "Trained 1: ")

    return NN;
}


function test() {
    for (let i = 0; i < game_count; i++) {
        let game = new TicTacToe();
        let player1 = new RandomTicTacPlayer(0);
        let player2 = new NNPlayer(1);
        let players = [player1, player2];
        while (!game.gameOver) {
            let currentPlayer = game.currentPlayer;
            let player = players[currentPlayer];
            player.makeMove(game);
        }
        let player1_fitness = fitnessFunction(game, 0);
        let player2_fitness = fitnessFunction(game, 1);
    }
}

export default { trainNN }