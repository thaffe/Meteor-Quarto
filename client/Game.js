/*****
GAME PLAY
******/
var game, currentPlayer, selectedPiece, currentRound;
var board = [],
  pieces = [],
  type, simulations, simCount = 0;

var winInfo = {}, hasWon = false;
var ignore = {}

  function startGame() {
    if (!game) game = Session.get("g");

    currentPlayer = 0;
    currentRound = 0;

    board = getList(false);
    pieces = getList(true);

    ignore = {};
    winInfo = {};

    hasWon = false;
    selectPiece();
  }

  function getNextPlayer() {
    //Bit shifts the player so it toggles between 0 and 1;
    return (!currentPlayer) >> 0
  }

  function setNextPlayer() {
    currentPlayer = getNextPlayer();
  }

  function getPlayerType() {
    return game["type" + currentPlayer];
  }

  function getNameOfPlayer(index) {
    var type = game["type" + index];
    switch (type) {
      case 1:
        return game.type0 == game.type1 ? "Player " + (index + 1) : "Your";
      case 2:
        return "Random Computer";
      case 3:
        return "Novice Computer";
      default:
        return "Minmax-" + game["minmax" + index] + " Computer";
    }
  }

  function selectPiece() {
    var type = getPlayerType();
    if (type == 1) {
      setInfo(getNameOfPlayer(currentPlayer) + " turn! Select piece for " + getNameOfPlayer(getNextPlayer()));
      setHoverable(false, true);
    } else {
      setSelected(type == 2 || currentRound < 3 ? getRandomPiece() : type == 3 ? getNovicePiece() : getMinMaxPiece());

      if (game.type1 == 1 || game.type2 == 1) {
        setInfo("Computer selected this piece for you to place");
      }

      findBoardPlace();
    }
  }

  function getRandomPiece() {
    return getRandom(pieces, false)
  }

  function getRandomBoard() {
    return getRandom(board, true);
  }

  function getRandom(list, isEmpty) {
    var j = 1000;
    while (j--) {
      var i = Math.round(Math.random() * 15);
      if (!list[i] == isEmpty) {
        return i;
      }
    }
  }

  function getNovicePiece() {

    var i = 16;
    while (i--) {
      if (pieces[i] !== false && firstWinBoardPos(pieces[i]) === false) {
        return i;
      }
    }
    return getRandomPiece();
  }

  function firstWinBoardPos(piece) {
    var j = 16;
    while (j--) {
      if (board[j] === 0) {
        board[j] = piece;
        if (checkBoardPiecesWin(true)) {
          board[j] = 0;
          return j;
        }

        board[j] = 0;

      }
    }

    return 0;
  }

  function getMinMaxPiece() {
    var time = new Date().getTime();
    var depth = game["minmax" + currentPlayer],
      i = 16,
      bestValue = -10000,
      bestPiece = null;

    while (i--) {
      if (pieces[i]) {
        var p = pieces[i];
        pieces[i] = 0;

        var newVal = doMinmaxBoard(depth, false, bestValue, 10000, p);
        pieces[i] = p;
        if (newVal > bestValue) {
          if (bestValue >= 1000) return i;
          bestPiece = i;
          bestValue = newVal;
        }
      }
    }

    console.log("TIME:"+(new Date().getTime() - time));

    return bestPiece;
  }

  function getMinMaxBoard() {
    var depth = game["minmax" + currentPlayer],
      i = 16,
      bestValue = -10000,
      bestPiece = null;

    p = toBinary(selectedPiece);

    while (i--) {
      if (!board[i]) {
        board[i] = p;

        if (checkBoardPiecesWin(true)) {
          board[i] = false;
          return i;
        }

        var newVal = doMinmaxPieces(depth, true, bestValue, 10000);
        board[i] = false;

        if (newVal > bestValue) {
          if (bestValue == 1000) return i;
          bestPiece = i;
          bestValue = newVal;
        }
      }
    }

    return bestPiece;
  }

  function doMinmaxBoard(depth, isMax, alpha, beta, placePiece) {
    if (!depth) return getHeuristicValue(isMax);
    var i = 16;

    while (i--) {
      if (!board[i]) {
        board[i] = placePiece;
        if (checkBoardPiecesWin(true)) {
          board[i] = 0;
          return (isMax ? 1 : -1) * depth * 1000;
        } else {
          if (isMax) {
            alpha = Math.max(alpha, doMinmaxPieces(depth, isMax, alpha, beta));
            if (beta <= alpha) {
              board[i] = 0;
              return alpha;
            }
          } else {
            beta = Math.min(beta, doMinmaxPieces(depth, isMax, alpha, beta));
            if (beta <= alpha) {
              board[i] = 0;
              return beta;
            }

          }
        }
        board[i] = 0;
      }
    }

    return isMax ? alpha : beta;

  }

  function doMinmaxPieces(depth, isMax, alpha, beta) {
    var i = 16;
    if (isMax) {
      while (i--) {
        var p = pieces[i];
        pieces[i] = 0;

        alpha = Math.max(alpha, doMinmaxBoard(depth - 1, !isMax, alpha, beta, p));
        pieces[i] = p;
        if (beta <= alpha) return alpha;
      }
    } else {
      while (i--) {
        var p = pieces[i];
        pieces[i] = 0;

        beta = Math.min(beta, doMinmaxBoard(depth - 1, !isMax, alpha, beta, p));
        pieces[i] = p;
        if (beta <= alpha) return beta;
      }
    }

    return isMax ? alpha : beta;
  }

  function getHeuristicValue(isMax) {
    var row = 4;
    var res = 0;
    while(row--){
      var col = 4;
      var countRow = 0;
      var countCol = 0;
      while(col--){
        if(board[row*4+col]) countRow++;
        if(board[row+4*col]) countCol++
      }

      if(countRow == 3){
        res+=10;
      }
      if(countCol == 3){
        res+=10;
      }
    }
    return (isMax ? 1 : -1) * 10;
  }

  /**
   * Sets the selected piece on the piece board
   * @param {item} piece from the piece collection
   */

  function setSelected(piece) {
    selectedPiece = piece;
    Session.set("selected", piece);
  }


  function findBoardPlace() {
    setNextPlayer();

    var type = getPlayerType();
    if (type == 1) {
      setInfo(getNameOfPlayer(currentPlayer) + " turn. Place piece on the board");
      setHoverable(true, false);
    } else {
      if (currentRound >= 3) {
        var p;
        if (type == 3) {

          if (currentRound >= 3) {
            p = firstWinBoardPos(toBinary(selectedPiece));
          }

        } else if (type == 4) {
          p = getMinMaxBoard();
        }
      }
      placePiece(p || getRandomBoard());
    }
  }
  /**
   * Places a piece on the board = b
   * if not b is set then then check wheter the computer should place the piece,
   *   if so then which AI level it should use to place the piece
   * @param  {[board]} b (optional) where to place the piece
   */

  function placePiece(b) {
    board[b] = pieces[selectedPiece];
    pieces[selectedPiece] = false;
    nextRound();
  }

  function setHoverable(board, pieces) {
    Session.set("hoverableBoard", board);
    Session.set("hoverablePieces", pieces);
  }

  function setInfo(text) {
    Session.set("infoText", text);
  }

  function setWinInfo(indexes, bitIndex) {
    var isTrue = board[indexes[0]][bitIndex] == 1;
    winInfo = {
      indexes: indexes,
      bitIndex: bitIndex,
      winner: getNameOfPlayer(currentPlayer),
      winnerIndex: currentPlayer,
      reason: "4 " + (bitIndex == 0 ? (isTrue ? "blue pieces" : "red pieces") :
        bitIndex == 1 ? (isTrue ? "square pieces" : "round pieces") :
        bitIndex == 2 ? (isTrue ? "big pieces" : "small pieces") :
        isTrue ? "pieces with hole" : "pieces without hole") + " in a row"
    };
    setInfo(winInfo.winner + " wins! Has " + winInfo.reason);
  }

  function nextRound() {
    currentRound++;
    if (!checkForWin()) {
      Session.set("selected", null);
      selectPiece();
    } else {
      hasWon = true;
      setHoverable(false, false);

      if (game.runSimulations) {
        simCount++;
        console.log("SIM");
        if (simCount < game.runSimulations) {
          simulations.insert(winInfo, startGame);
        } else {
          Session.set("simulationDone", true);
        }
      }
    }
  }

  /**
   * Checks the board for a winning combination
   * by selecting all the board places with a piece set
   * and looping over theese checing the piece attributes
   * @return {int} 1 if win else 0
   */

  function checkForWin() {
    //If theres is no pieces left (all the pieces is set to null), then tell the player the game ended in a draw
    if (currentRound == 16) {
      winInfo = {
        winner: "Draw",
        reason: "Game ended in a draw"
      };
      setInfo("Game ended in a draw");
      return 1;
    }

    if (currentRound >= 4) {
      return checkBoardPiecesWin();
    }

    return 0;
  }

  function checkBoardPiecesWin(isTemp) {
    var i = 4;
    while (i--) {
      if (checkAttrs(i * 4, 1, isTemp)) return 1;
      if (checkAttrs(i, 4, isTemp)) return 1;
    }

    if (checkAttrs(0, 5, isTemp)) return 1;
    if (checkAttrs(3, 3, isTemp)) return 1;

    return 0;
  }

  function checkAttrs(from, jump, isTemp) {
    if (ignore[from + "" + jump]) {
      return 0;
    }
    var i = 4,
      i2 = from + jump,
      i3 = i2 + jump,
      i4 = i3 + jump;

    if (!board[from] || !board[i2] || !board[i3] || !board[i4])
      return 0;

    while (i--) {
      if (board[from][i] == board[i2][i] && board[i2][i] == board[i3][i] & board[i2][i] == board[i4][i]) {
        if (!isTemp) setWinInfo([from, i2, i3, i4], i);
        return 1;
      }
    }
    if (!isTemp) {
      ignore[from + "" + jump] = true;
    }
    return 0;
  }


Template.game.events({
  'click #board.hoverable td': function() {
    if (!this.val) {
      placePiece(this.i);
    }
  },
  'click #pieces.hoverable td': function() {
    if (this.val) {
      setSelected(this.i);
      findBoardPlace();
    }
  }
});


Template.game.gameType = function() {
  game = Session.get("g");
  if (Session.get("newGame")) {
    simulations = new Meteor.Collection(null);
    simCount = 0;
    Session.set("newGame", false);
    startGame();
  }

  var string = "";
  if (game.type0 == 1) string += "Human";
  else string += getNameOfPlayer(0);

  string += " vs ";

  if (game.type1 == 1) string += "Human";
  else string += getNameOfPlayer(1);

  return string;
}

function getPrintFormat(list) {
  var b = [];
  for (var row = 0; row < 4; row++) {
    b.push([]);
    for (var col = 0; col < 4; col++) {
      var i = row * 4 + col;
      b[row][col] = {
        i: i,
        val: list[i],
        row: row,
        col: col
      }
    }
  }

  return b;
}

Template.game.board = function() {
  return getPrintFormat(board);
}

Template.game.pieces = function(row) {
  return getPrintFormat(pieces);
}

Template.game.boardClass = function() {
  return Session.get("hoverableBoard") ? "hoverable" : "disabled"
}

Template.game.piecesClass = function() {
  return Session.get("hoverablePieces") ? "hoverable" : "disabled";
}

Template.game.bgColor = function(e) {
  if (hasWon && winInfo.indexes.indexOf(this.i) >= 0)
    return "win";
  return (isEven(this.col + this.row) ? "dark" : "") + (this.p ? " notHoverable" : "");
}

Template.game.selected = function() {
  return !this.val ? "empty" : Session.get("selected") === this.i ? "selected" : "";
}

Template.game.getPiece = function() {
  var i = typeof this.val != "boolean" ? parseInt(this.val, 2) : this.i;
  return this.val ? "<img alt='' src='" +
    (i >= 8 ? "black" : "white") + "_" +
    (i % 4 >= 2 ? "tall" : "short") + "_" +
    (i >= 4 && i <= 7 || i >= 12 ? "square" : "circle") +
    (i % 2 != 0 ? "_hole" : "") + ".png' >" : "";
}

Template.game.info = function() {
  return Session.get("infoText");
}

Template.game.runSimulations = function() {
  return game.runSimulations;
}

Template.simulations.items = function() {
  return simulations.find();
}