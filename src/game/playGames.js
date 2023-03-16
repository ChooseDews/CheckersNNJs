

import { RandomTicTacPlayer, NNPlayer  } from "./TicTacPlayer.js";
import TicTacToe from "./TicTacToeGame.js";



let fitnessFunction = (game, playerId) => {
    //return 1 if player wins, 0.5 if draw, 0 if loss
    if (game.winner === playerId) return 1;
    if (game.winner === null) return 0;
    return -1;
}


let scorePlayers = (players, game_count=5) => {
    if (players.length !== 2) throw new Error("Invalid number of players");
    let scores = new Array(players.length).fill(0);
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
        let p1_score = fitnessFunction(game, 0);
        let p2_score = fitnessFunction(game, 1);
        scores[p1_index] += p1_score;
        scores[p2_index] += p2_score;
    }
    scores = scores.map(score => score / game_count);
    scores = scores.map(score => score.toFixed(2));
    let tiePercentage = (100 * ties / game_count).toFixed(2);
    console.log("Player[0] score: " + scores[0] + " | Player[1] score: " + scores[1] + " | Tie percentage: " + tiePercentage + "%");
    return scores;
}

let scorePlayerAgainstRandom = (player, game_count=5) => {
    let randomPlayer = new RandomTicTacPlayer();
    return scorePlayers([player, randomPlayer], game_count);
}

let evolve = async () => {
    
    let generations = 5;
    let populationSize = 100;
    let game_count = 10;
    let playRandom = false;
    //total number of games = game_count * populationSize * 2 * generations

    let population = NNPlayer.population(populationSize); //create a population of 100 NNPlayers
    let bestPlayer = null;

    for(let g = 0; g < generations; g++){

        let populationFitness = new Array(populationSize).fill(0);
        let gamesPlayed = new Array(populationSize).fill(0);
        let tieCount = 0;
        let gameCount = 0;
        if (playRandom) {
            population.push(new RandomTicTacPlayer());
            populationFitness.push(0);
            gamesPlayed.push(0);
        }

        //each player plays game_count games against random players as both player 1 and player 2
        for(let p = 0; p < populationSize; p++){
            for (let position = 0; position < 2; position++) {
                for(let i = 0; i < game_count; i++){
                    let p1_index = p;
                    let p2_index = Math.floor(Math.random() * population.length) 
                    if (p1_index === p2_index) p2_index = (p2_index + 1) % population.length; //make sure p1_index and p2_index are different add one or wrap around

                    if(playRandom) p2_index = population.length - 1; //play against random player

                    if(position === 1){ //swap player 1 and player 2
                        let temp = p1_index;
                        p1_index = p2_index;
                        p2_index = temp;
                    }

                    let player1 = population[p1_index];
                    let player2 = population[p2_index];
                    
                    let players = [player1, player2];
                    
                    //set id of players
                    player1.setId(0)
                    player2.setId(1)

                    let game = new TicTacToe();
                    while(!game.gameOver){
                        let currentPlayer = game.currentPlayer;
                        let player = players[currentPlayer];
                        player.makeMove(game);
                    }

                    if(game.winner === null) tieCount++;
                    gameCount++;

                    let player1_fitness = fitnessFunction(game, 0);
                    let player2_fitness = fitnessFunction(game, 1);
                    populationFitness[p1_index] += player1_fitness;
                    populationFitness[p2_index] += player2_fitness;
                    gamesPlayed[p1_index]++;
                    gamesPlayed[p2_index]++;
                }
            }
        }

        if(playRandom) {
            population.pop(); //remove random player
            populationFitness.pop();
            gamesPlayed.pop();
        }

        //normalize fitness
        let normalPopulationFitness = populationFitness.map((fitness, index) => fitness / gamesPlayed[index]);

        //sort population by fitness
        let sortedPopulation = population.map((player, index) => [player, normalPopulationFitness[index]]).sort((a, b) => b[1] - a[1]);

        //select top 10% of population
        let topPopulation = sortedPopulation.slice(0, Math.floor(populationSize * 0.1));

        bestPlayer = topPopulation[0][0];

        //print top 10% of population
        for (let i = 0; i < topPopulation.length; i++) {
            console.log("Score: " + topPopulation[i][1].toFixed(3), topPopulation[i][0].uniqueId); 
            if(i > 5) break; //only print top 5 players
        }

        //mutate top 10% of population round robin until we have 100 players minus the top 10%
        let newPopulation = topPopulation.map((player) => player[0]);
        while(newPopulation.length < populationSize){
            for(let i = 0; i < topPopulation.length; i++){
                let player = topPopulation[i][0];
                //copy player and mutate
                let newPlayer = await player.copy();
                await newPlayer.model.mutate(0.5);
                newPopulation.push(newPlayer);
            }
        }

        let avg_fitness = normalPopulationFitness.reduce((a, b) => a + b, 0) / normalPopulationFitness.length;
        let tie_percentage = (100 * tieCount / gameCount).toFixed(2);
        console.log("G"+g+") Average fitness: " + avg_fitness.toFixed(3) + " Ties: " + tie_percentage + "%");

        population = newPopulation;
    }

    //save best player
    await bestPlayer.model.model.save("file:///home/john/projects/CheckersNNJs/src/models"); //use tfjs-node to save model


    //test best player
    console.log("Showndown: Best player vs Random player 2000 games")
    let score = scorePlayerAgainstRandom(bestPlayer, 2000);
    console.log(score)

    //showndown random vs random
    console.log("Showndown: Random player vs Random player 2000 games")
    score = scorePlayerAgainstRandom(new RandomTicTacPlayer(), 2000);
    console.log(score)

}


evolve()



function test(){
    for(let i = 0; i < game_count; i++){
        let game = new TicTacToe();
        let player1 = new RandomTicTacPlayer(0);
        let player2 = new NNPlayer(1);
        let players = [player1, player2];
        while(!game.gameOver){
            let currentPlayer = game.currentPlayer;
            let player = players[currentPlayer];
            player.makeMove(game);
        }
        let player1_fitness = fitnessFunction(game, 0);
        let player2_fitness = fitnessFunction(game, 1);
    }
}