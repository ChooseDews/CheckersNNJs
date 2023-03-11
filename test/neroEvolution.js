const { Population } = require('neuroevolution')

console.log('Population: ', Population)

const population = new Population(50, 2, 1, false)
const xor = [
  [[0, 0], 0],
  [[0, 1], 1],
  [[1, 0], 1],
  [[1, 1], 0],
]

population.evolve(1000, genome => {
    console.log(genome)
  const network = genome.generateNetwork()
  let error = 0;
  for (const [input, output] of xor) {
    const [prediction] = network.predict(input)
    error += Math.abs(prediction - output)
  }
  return 1 - (error / xor.length)
})