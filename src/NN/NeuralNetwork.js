// import tf from '@tensorflow/tfjs';
import tf, { math } from '@tensorflow/tfjs-node-gpu'


console.log(tf.getBackend());

function randomGaussian(){
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function getAvg(arr){
    let sum = 0;
    for(let i = 0; i < arr.length; i++){
        sum += arr[i];
    }
    return sum / arr.length;
}

export default class NeuralNetwork {

    constructor(inputSize, hiddenLayers, outputSize) {

        this.inputSize = inputSize;
        this.hiddenLayers = hiddenLayers;
        this.outputSize = outputSize;

        const inputs = tf.input({shape: [inputSize]});

        let x = inputs;

        x = tf.layers.dense({
            units: hiddenLayers[0],
            activation: 'relu'
        }).apply(x);

        for (let i = 1; i < hiddenLayers.length; i++) {
            x = tf.layers.dense({
                units: hiddenLayers[i],
                activation: 'relu'
            }).apply(x);
        }

        const outputs = [];
        for (let i = 0; i < outputSize.length; i++) {
            outputs.push(tf.layers.dense({
                units: outputSize[i],
                activation: 'softmax'
            }).apply(x));
        }

        this.model = tf.model({
            inputs: inputs,
            outputs: outputs
        });
    }

    normalizeWeights() {
        const weights = this.model.getWeights();
        const normalizedWeights = weights.map((w) => {
            const shape = w.shape;
            const values = w.dataSync().slice();
            
            const mean = getAvg(values);

            for (let i = 0; i < values.length; i++) {
                values[i] = (values[i]) / mean;
            }
            return tf.tensor(values, shape);
        });
        this.model.setWeights(normalizedWeights);
    }

    copy() {
        return tf.tidy(() => {
            const modelCopy = new NeuralNetwork(this.inputSize, this.hiddenLayers, this.outputSize);
            modelCopy.model.setWeights(this.model.getWeights());
            return modelCopy;
        })
    }

    mutate(rate) {
        // mutate the weights of the model
        tf.tidy(() => {
            const weights = this.model.getWeights();
            const mutatedWeights = weights.map((w) => {
                const shape = w.shape;
                const values = w.dataSync().slice();
                //console.log("weights n=", values.length)
                for (let i = 0; i < values.length; i++) {
                    values[i] += values[i] * Math.random()*rate;
                    
                }
                return tf.tensor(values, shape);
            });
            this.model.setWeights(mutatedWeights);
        })
        this.normalizeWeights();
    }

    mate(partner) {

        return tf.tidy(() => {
            const child = new NeuralNetwork(this.inputSize, this.hiddenLayers, this.outputSize);
            const weights = this.model.getWeights();
            const partnerWeights = partner.model.getWeights();
            const childWeights = [];
            for (let i = 0; i < weights.length; i++) {
                const shape = weights[i].shape;
                const values = weights[i].dataSync().slice();
                const partnerValues = partnerWeights[i].dataSync().slice();
                for (let j = 0; j < values.length; j++) {
                    if (Math.random() < 0.5) {
                        values[j] = partnerValues[j];
                    }
                }
                childWeights.push(tf.tensor(values, shape));
            }
            child.model.setWeights(childWeights);
            return child;
        })
    }

    delete() {
        this.model.dispose();
    }

    predict(input) {
        return tf.tidy(() => {
            const xs = tf.tensor2d([input]);
            const ys = this.model.predict(xs);
            const outputs = ys.map((output) => output.dataSync());
            return outputs;
        })
    }
}
