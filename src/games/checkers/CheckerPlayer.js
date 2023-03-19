import brain from 'brain.js';

const config = {
    inputSize: 8*8 + 1,
    hiddenLayers: [20, 20, 20],
    outputSize: 8*2*2 
}



const net = new brain.NeuralNetwork(config)

function testInput(){
    let length = 8*8 + 1
    let input = new Array(length).fill(0)
    input[0] = 1
    input[1] = 1
    input[2] = 1
    return input
}
console.log(net)

net.run(testInput())

