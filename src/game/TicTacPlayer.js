import tfjs from '@tensorflow/tfjs-node';
import assert from 'node:assert/strict';
import deepcopy from 'deepcopy';


function genId(n=10){
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for(let i = 0; i < n; i++){
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

class TicTacPlayer {
    constructor(id=0) {
        if (id !== 0 && id !== 1) throw new Error("Invalid player id");
        this.setId(id);
        this.uniqueId = genId();
    }
    
    setId(id) {
        this.id = id;
        this.symbol = (id === 0) ? "X" : "O"
        return
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





//NNPlayer

class NNPlayer extends TicTacPlayer {
    constructor(id=0, model=null) {
        super(id);
        if (model) {
            this.model = model;
            return;
        }
        this.model = new NNModel();
    }

    makeMove(game) {
        let state = game.state(this.id);
        let moveProbs = this.model.predict(state); //array of probabilities for each move

        let possibleMoves = game.getPossibleMoves(); //array of booleans row by row
        let possibleIndices = [];
        for (let i = 0; i < possibleMoves.length; i++) if (possibleMoves[i]) possibleIndices.push(i);

        //choose move with highest probability that is possible
        let maxProb = -100;
        let maxIndex = -1;
        for (let i = 0; i < possibleIndices.length; i++) {
            let index = possibleIndices[i];
            if (moveProbs[index] > maxProb) {
                maxProb = moveProbs[index];
                maxIndex = index;
            }
        }

        //console.log("NNPlayer move: ", maxIndex, maxProb)

        if (maxIndex === -1 && possibleIndices.length === 0) throw new Error("No possible moves");
        if (maxIndex === -1) maxIndex = possibleIndices[0]

        let [row, col] = game.getRowCol(maxIndex);
        return game.place(this.id, row, col);

    }

    static population(n) {
        let population = [];
        for (let i = 0; i < n; i++) {
            population.push(new NNPlayer()); //initialize all players as player 0
        }
        return population;
    }

    async copy(){
        return new NNPlayer(this.id, await this.model.copy());
    }

}

function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}


function checkFloatEqual(a, b) {
    return Math.abs(a - b) < 0.0001;
}

function randomGaussian(mean=0, stdev=1) {
    let u = 1 - Math.random(); // Converting [0,1) to (0,1]
    let v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

class NNModel {

    constructor(model=null, hiddenLayers=[20, 20]) {

        if (model) {
            this.model = model;
            return;
        }

        //create model with 9 input nodes, middle layers, and 9 output nodes with softmax activation
        this.model = tfjs.sequential();
        this.model.add(tfjs.layers.dense({ units: 9, inputShape: [9], activation: 'relu' }));

        //add hidden layers
        for (let i = 0; i < hiddenLayers.length; i++) {
            this.model.add(tfjs.layers.dense({ units: hiddenLayers[i], activation: 'relu' }));
        }

        //add output layer
        this.model.add(tfjs.layers.dense({ units: 9, activation: 'softmax' }));
        this.model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });
    }

    predict(state) {
        //predict the probability of each move
        let input = tfjs.tensor([state]);
        let output = this.model.predict(input);
        return output.dataSync();
    }

    async mutate() { //mutate the weights of the model
        let weights = this.model.getWeights();
        for (let layer in weights) {
            let layer_data = await weights[layer].data();
            for (let i = 0; i < layer_data.length; i++) layer_data[i] += randomGaussian(0, 0.1);
        }
        this.model.setWeights(weights);
    }

    async copy() {
        let tf_model = await new Promise(resolve => this.model.save({ save: resolve }))
        tf_model = await tfjs.loadLayersModel({ load: () => tf_model })
        return new NNModel(tf_model);
    }

    static population(size) {
        //create a population of models
        let population = new Array(size);
        for (let i = 0; i < size; i++) population[i] = new NNModel();
        return population;
    }

    static areWeightsEqual(model_1, model_2, verbose=false) {
        let weights_1 = model_1.model.getWeights()
        let weights_2 = model_2.model.getWeights();
        let first = true;
        let count = 0;
        for (let [layer_1, layer_2] of zip([weights_1, weights_2])) {
            let layer_1_data = layer_1.dataSync();
            let layer_2_data = layer_2.dataSync(); //2 refers to the second model not the second layer
            if (layer_1_data.length < 21) continue; //skip bias layer as it is initialized to 0
            if (first && verbose) {
                first = false;
                console.log(layer_1_data, layer_2_data);
            }
            for (let i = 0; i < layer_1_data.length; i++) {
                if (checkFloatEqual(layer_1_data[i], layer_2_data[i])) {
                    count++;
                    if (count > 3){
                        if(verbose) console.log("Weights are equal!!");
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static async test(verbose=false) {
        //we want to check if the weights are initialized randomly
        if(verbose) console.log("Initialization test");
        let models = NNModel.population(2);
        assert(NNModel.areWeightsEqual(...models) === false, "Weights should not be equal after initialization");

        //we want to check if the weights are copied correctly
        if(verbose) console.log("Copying weights test");
        let model = models[0];
        let model_copy = await model.copy();
        assert(NNModel.areWeightsEqual(model, model_copy) === true, "Weights should be equal after copying");

        //we want to check if the weights are mutated correctly and model_copy is not mutated
        if(verbose) console.log("Mutating weights test");
        await model.mutate();
        assert(NNModel.areWeightsEqual(model, model_copy) === false, "Weights should not be equal after mutation");
    
    }
}

NNModel.test(); //runs silently if everything is working








export { TicTacPlayer, RandomTicTacPlayer, NNPlayer };
