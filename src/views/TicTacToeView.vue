<template>
  <div class="container">
    <div class="grid">

        <div>

    <h1>Neural Network Tic-Tac-Toe</h1>

    <p> 
        Simple Demo of a NN training using game data from random intermediate players which can look ahead a single play.
        Tic-Tac-Toe is considered a solved game read more <a href="https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy">here</a>. 
        However the NN is able to learn from the game data and beat the "non-expert" conditional player.
    </p>

    <h2>You Are Player:    <span class="symbol">{{ (humanPlayer==0) ?  "X" : "O"  }}</span>  </h2>

    <div class="grid">
        <button @click="newGame">New Game</button>
        <button @click="switchPlayer">Switch Player</button>
    </div>
    <div class="grid">
        <button @click="modelMove">Play Move</button>
        <button @click="trainNN">Train NN</button>
    </div>


</div>

      <div
        ref="gameboard"
        class="board unselectable"
        v-if="game"
        :class="{ gameOver: game.gameOver }" :style="{height: boardHeight}">

        <div class="cell" v-for="cell in boardSize * boardSize" @click="select(cell - 1)">
          <span class="cellNum">{{ cell - 1 }} </span>
          <div class="markerHolder">
            <div class="marker" v-if="getMarker(cell - 1)">
              {{ getMarker(cell - 1) }}
            </div>
          </div>
        </div>



      </div>
   
    </div>
  </div>
</template>

<script>
import TicTacToe from "../games/tictactoe/TicTacToeGame.js";
import * as Players from "../games/tictactoe/TicTacPlayer.js";
import Trainer from "../games/tictactoe/trainNN.js";

let NNPlayer = await Players.NNPlayer.load();
//let NNPlayer = new Players.ConditionalTicTacPlayer()

export default {
  data() {
    return {
      board: new Array(3 * 3).fill(null),
      boardSize: 3,
      selected: null,
      game: null,
      boardHeight: "0px",
      humanPlayer: 0,
    };
  },
  async mounted() {
    let game = new TicTacToe();
    let board = game.state();
    this.newGame();
    await this.$nextTick();
    window.addEventListener('resize', this.setBoardHeight);
    this.setBoardHeight();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.setBoardHeight);
  },
  methods: {
    async trainNN(){

        NNPlayer = await Trainer.trainNN();
        console.log("NN Trained Successfully!")
        this.newGame();
    
    },
    setBoardHeight() {
      if (!this.$refs.gameboard) return;
      this.boardHeight = this.$refs.gameboard.offsetWidth + "px";
    },
    getLoc(index) {
      return [Math.floor(index / this.boardSize), index % this.boardSize];
    },

    newGame() {
      this.game = new TicTacToe();
      this.board = this.game.state();
      this.select(null) //run first move if AI is first
    },

    switchPlayer() {
      if (this.humanPlayer == 1) {
        this.humanPlayer = 0;
      } else {
        this.humanPlayer = 1;
      }
      this.newGame();
    },

    getMarker(index) {
      let mark = this.board[index];
      if (mark === 0) return null;
      return mark == 1 ? "X" : "O";
    },

    modelMove(){
        NNPlayer.setId(this.game.currentPlayer);
        NNPlayer.makeMove(this.game);
        this.board = this.game.state();
    },

    select(index) {

      if (this.game.gameOver) return;

      if (this.game.currentPlayer == this.humanPlayer && index != null) {
        let [row, col] = this.getLoc(index);
        this.game.place(this.humanPlayer, row, col);
        this.board = this.game.state();
      }
      
      if(this.game.currentPlayer != this.humanPlayer && !this.game.gameOver) {
        this.modelMove()
      }

      if (this.game.gameOver) {
        console.log("Game Over");
        let self = this;
        //wait 2 seconds before starting a new game
        setTimeout(() => {
          self.newGame();
        }, 2000);
      }
    },
  },
};
</script>

<style lang="scss" scoped>

.container{
    padding-top: 5vh;
}

.symbol{
    font-size: 1.2em;
    font-weight: bold;
    vertical-align: middle;
    padding: 10px;
}

.unselectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.board {
  background: white;
  border: 1px solid black;
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  min-height: 200px;
  min-width: 200px;
}

.cell {
  width: calc(100% / 3);
  height: calc(100% / 3);
  border: 1px solid black;
  background: white;
}

.markerHolder {
  display: flex;
  vertical-align: middle;
  align-items: center;
  height: 100%;
}

.cellNum {
  float: left;
  display: inline;
  position: absolute;
  padding-left: 10px;
}

.marker {
  font-size: 4em;
  text-align: center;
  width: 100%;
  cursor: pointer;
}

.gameOver {
  background: red;
  opacity: 0.5;
}
</style>