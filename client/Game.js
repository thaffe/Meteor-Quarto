/*****
GAME PLAY
******/
var game, currentPlayer, selectedPiece, currentRound;
var board = [], pieces = [], type, simulations, simCount = 0;

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
    setSelected(type == 2 || currentRound < 4 ? getRandomPiece(pieces, {
      $not: null
    }) : type == 3 ? getNovicePiece() : getMinMaxPiece());

    if (game.type1 == 1 || game.type2 == 1) {
      setInfo("Computer selected this piece for you to place");
    }

    findBoardPlace();
  }
}

function getRandomPiece() {
  return getRandom(pieces, true)
}

function getRandomBoard() {
  return getRandom(board, false);
}

function getRandom(list, exists) {
  while (true) {
    var i = Math.round(Math.random() * 15);
    if (list[i] == exists) {
      return i;
    }
  }
}

function getNovicePiece() {
  var b = board.find({
    p: {
      $exists: true
    }
  });
  if (b.count() >= 3) {

    var empty = board.find({
      p: {
        $exists: false
      }
    }).fetch(),
      notEmpty = b.fetch(),
      _pieces = getPiecesLeft();

    var nextIndex = notEmpty.length;
    var len = _pieces.length;
    while (len--) {
      if (!firstWinBoardPos(_pieces[len].p, empty, notEmpty)) {
        return _pieces[len];
      }
    }

  }

  return getRandomPiece();
}

function firstWinBoardPos(piece, emptyPlaces, notEmptyPlaces) {
  var i = emptyPlaces.length,
    l = notEmptyPlaces.length;
  while (i--) {
    emptyPlaces[i].p = piece;
    notEmptyPlaces[l] = emptyPlaces[i];

    if (checkBoardPiecesWin(notEmptyPlaces, true)) {
      notEmptyPlaces.pop();
      emptyPlaces[i].p = null;
      return emptyPlaces[i];
    }
    notEmptyPlaces[l] = 0;
    emptyPlaces[i].p = null;
  }

  return 0;
}

function getMinMaxPiece(levels) {
  var minmaxLevels = game["minmax" + player];

  var pieces = getPiecesLeft();
  var emptyPlaces = getEmptyBoard();
  var places = getFilledBoard();

  var a = 0;
  b = 0;
  while (pieces.length) {
    var pi = pieces.pop();

  }
  while (minmaxLevels--) {
    var p = pieces.pop();
    var len = emptyPlaces.length;
    while (len--) {
      emptyPlaces[len].i
    }
  }

}

function placeMinMax(piece, emptyPlaces, places, levels) {

}

function selectMinMax(piece, emp) {

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
    var p;
    if (type == 3) {
      var f = getFilledBoard();
      if (f.length >= 3) {
        var e = getEmptyBoard();
        p = firstWinBoardPos(_p, getEmptyBoard(), f);
      }

    } else if (type == 4) {

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
  board[b] = toBinary(selectedPiece);
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

function setWinInfo(from, jump, bitIndex) {
  var isTrue = board[from][bitIndex] == 1;
  winInfo = {
    from: from,
    jump: jump,
    bitIndex: bitIndex,
    winner: getNameOfPlayer(currentPlayer),
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
    return checkBoardPiecesWin(board);
  }

  return 0;
}

function checkBoardPiecesWin(boardPlaces, isTemp) {
  var i = 4;
  while (i--) {
    for (var row = 0; row < 4; row++) {
      if (checkAttrs(row * 4, 1)) return 1;
    }

    for (var col = 0; col < 4; col++) {
      if (checkAttrs(col, 4)) return 1;
    }

    if (checkAttrs(0, 5)) return 1;
    if (checkAttrs(3, 3)) return 1;
  }

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
      console.log("win")
      if (!isTemp)
        setWinInfo(from, jump, i);
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
  if(hasWon && this.i%winInfo.jump == winInfo.from && 
    this.i < winInfo.jump*4+winInfo.from) 
    return "win";
  return (isEven(this.col + this.row) ? "dark" : "") + (this.p ? " notHoverable" : "");
}

Template.game.selected = function() {
  return !this.val ? "empty" : Session.get("selected") === this.i ? "selected" : "";
}

Template.game.getPiece = function() {
  var i = typeof this.val != "boolean" ? parseInt(this.val, 2) : this.i;
  return this.val !== false ? "<img alt='' src='" +
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

Template.game.simulations = function() {
  return simulations.find();
}