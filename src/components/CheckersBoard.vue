<script>
import CheckersGames from "./../CheckersGame.js";
import VueBarGraph from 'vue-bar-graph';

export default {
  name: "CheckersBoard",
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  mounted() {
    const game = new CheckersGames();
    //game.board.test_leaveTwoCheckers();
    this.game = game;
    this.board = game.board.board;
    console.log(this.board);

    this.runGame();
  },
  data() {
    return {
      boardSize: 8,
      cells: [],
      board: false,
      cellSelected: false,
      errorMsg: false,
      wins: [1, 1]
    };
  },
  methods: {
    gameOver(){
        return this.game.state == "finished";
    },
    getCellColor(row, col) {
      if (
        this.cellSelected &&
        this.cellSelected[0] === row &&
        this.cellSelected[1] === col
      )
        return "yellow";
      if ((row + col) % 2 === 0) return "white";
      return "grey";
    },
    getPiece(row, col) {
      return this.game.board.getCell(row, col);
    },
    getPieceColor(row, col) {
      let piece = this.getPiece(row, col);
      if (piece) {
        return piece.player.color;
      }
    },
    move(r1, c1, r2, c2) {
      let res = this.game.move(r1, c1, r2, c2);
      if (res) {
        this.board = this.game.board.board;
        if (res.success == false) this.errorMsg = res.message;
        else this.errorMsg = false;
      }
    },
    async runGame(){

        console.log("running game", this.game.state )
       
        if(this.game.state == "playing"){
          let moves = this.game.getPossibleMoves();
          if (moves.length == 0) {
            this.game.state = "finished";
            return this.runGame();
          }
          let move = moves[Math.floor(Math.random() * moves.length)];
          this.move(...move)
          //reload vue
          await this.$forceUpdate();
          //wait 1 second
          await new Promise(resolve => setTimeout(resolve, 100));
          this.runGame();
        }else{

            this.wins[this.game.winner.id]++;
            console.log("winner", this.wins)

            await new Promise(resolve => setTimeout(resolve, 100));
            this.game = new CheckersGames();
            this.board = this.game.board.board;
            this.runGame();

        }

    },
    selectCell(row, col) {
      console.log(row, col);
      if (this.cellSelected != false) {
        if (this.cellSelected[0] === row && this.cellSelected[1] === col) {
            this.cellSelected = false;
            return;
        }
        this.move(...this.cellSelected, row, col);
        this.cellSelected = false;
    } else {
        let piece = this.getPiece(row, col);
        if (piece) this.cellSelected = [row, col];
      }
    },
  },
  components: {
    VueBarGraph
  }
};
</script>

<template>
  <div class="game" v-if="board">
    <div class="stats">Current Player: {{ game.currentPlayer.color }}</div>
    <div v-if="gameOver()" class="gameOver">
        Game Over
    </div>
    <div class="board" v-if="board" :class="{'finished': gameOver()}">
      <div class="row" v-for="(n, row) in boardSize" :key="row">
        <div
          class="cell"
          :style="{ background: getCellColor(row, cell) }"
          v-for="(n, cell) in boardSize"
          :key="cell"
          @click="selectCell(row, cell)"
        >
          <div
            class="piece"
            v-if="getPiece(row, cell)"
            :class="{'kinged': getPiece(row, cell).kinged}"
            :style="{ background: getPieceColor(row, cell) }"
          >

          <div v-if="getPiece(row, cell).kinged">K</div>

        </div>
        </div>
      </div>
    </div>

    <div class="error" v-if="errorMsg">
      {{ errorMsg }}
    </div>

    <div class="stats">

      <vue-bar-graph
        :points="wins"
        :width="400"
        :height="200"
        :show-values="true"
      />
   
    </div>
  </div>
</template>

<style>
.board {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: 20px #966f33 solid;
}

.finished{
    filter: grayscale(100%);
    opacity: 0.5;
}

.row {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}

.gameOver{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 8rem;
    color: red;
    font-weight: bold;
    text-shadow: 0 0 0.1rem black;
    z-index: 10;
    text-align: center;
    text-transform: uppercase;
    
}

.error{
    color: red; 
}

.cell {
  width: 5vw;
  height: 5vw;
  border: 1px solid black;
  background: white;
}

.dark {
  background-color: rgb(48, 48, 48);
}

.piece {
  width: 90%;
  height: 90%;
  margin-left: 5%;
  margin-top: 5%;
  background-color: red;
  border-radius: 50%;
  filter: drop-shadow(0 0 0.1rem black);
  text-align: center;
  padding-top: 20%;
  color: gold;
  font-size: 1rem;
  font-weight: bold;
  text-shadow: 0 0 0.1rem black;
}

.kinged{
    border: 4px solid gold;    
}
</style>