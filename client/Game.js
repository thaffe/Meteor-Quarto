/*****
GAME PLAY
******/

// window.test = function() {
//   for (var i = 0; i < 3; i++) {
//     setSelected(i);
//     placePiece(i);
//   }

//   for (var i = 9; i < 11; i++) {
//     setSelected(i);
//     placePiece(i);
//   }
// };

Deps.autorun(function() {
  var monitor = Session.get("monitorGame");
  console.log("monitorGame")
  if (monitor) {
    Meteor.subscribe('monitor', Session.get("monitorGame"));
  } else {
    Meteor.subscribe("player", Session.get("userId"));
  }
});

var currentPlayer, selectedPiece, currentRound, lastBoardPos = -1;
var board = [],
  pieces = [],
  typeCount = {}, timePlace, timePick,
  type, simulations, simCount = 0,
  onlineStarted = false;
var winInfo = {}, hasWon = false;

function startGame() {
  currentPlayer = 0;
  currentRound = 0;

  board = getList(0);
  pieces = getList(1);

  typeCount = [];
  for (var i = 0; i < 11; i++) {
    typeCount.push(createList(8, 0));
  }

  timePlace = [
    [],
    []
  ];
  timePick = [
    [],
    []
  ];

  selectedPiece = -1;
  lastBoardPos = -1;

  winInfo = {};

  hasWon = false;

  if (isOnlineGame(game)) {
    onlineStarted = false;
  } else {
    selectPiece();
  }
}

function getNextPlayer() {
  //Bit shifts the player so it toggles between 0 and 1;
  return bitShift(currentPlayer);
}

function setNextPlayer() {
  currentPlayer = getNextPlayer();
}

function getPlayerType() {
  return game["type" + currentPlayer];
}

function getNameOfPlayer(index) {
  var type = game["type" + index];
  if (!type) return;
  switch (type) {
    case 4:
      return "Minmax-" + game["minmax" + index] + " Computer";
    case 5:
      if (isMonitor()) {
        return Players.find().count() < 2 ? "Unknown" : Players.findOne({
          index: index
        })._id;
      }else{
        var n = Players.findOne().oponent;
        if(n) return n;
      }
    default:
      return playerTypes[type - 1].name;
  }
}

function selectPiece() {
  Session.set("selected", null);
  var type = getPlayerType();
  switch (type) {
    case 1:
      setInfo(getNameOfPlayer(currentPlayer) + " turn! Select piece for " + getNameOfPlayer(getNextPlayer()));
      setHoverable(false, true);
      break;
    case 5:
      setInfo("Waiting for " + getNameOfPlayer(currentPlayer) + " to select piece");
      setHoverable(false, false);
      break;
    default:

      var time = new Date().getTime();
      setSelected(getPiece[type]());
      timePick[currentPlayer].push(new Date().getTime() - time);

      if (game.type1 == 1 || game.type2 == 1) {
        setInfo("Computer selected this piece for you to place");
      }

      selectBoardPlace();
  }
}

function selectBoardPlace() {
  setNextPlayer();

  var type = getPlayerType();
  switch (type) {
    case 1:
      setInfo(getNameOfPlayer(currentPlayer) + " turn. Place piece on the board");
      setHoverable(true, false);
      break;
    case 5:
      listenForChange = true;
      setInfo(getNameOfPlayer(currentPlayer) + " turn. Place piece on the board");
      setHoverable();
      break;
    default:
      var time = new Date().getTime();
      var p = getBoard[type]();
      timePlace[currentPlayer].push(new Date().getTime() - time);
      placePiece(p);

  }
}

var getPiece = [0, 0, getRandomPiece, getNovicePiece, getMinMaxPiece];
var getBoard = [0, 0, getRandomBoard, getNoviceBoard, getMinMaxBoard];

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
  if (currentRound <= 3) return getRandomPiece();

  var i = 16;
  while (i--) {
    if (pieces[i] && firstWinBoardPos(pieces[i]) !== null) {
      return i;
    }
  }
  return getRandomPiece();
}

function getNoviceBoard() {
  if (currentRound <= 3) return getRandomBoard();
  return firstWinBoardPos(pieces[selectedPiece]) || getRandomBoard();
}

function firstWinBoardPos(piece) {
  var i = 16;
  while (i--) {
    if (!board[i]) {
      board[i] = piece;
      updateTypeCount(i);

      if (checkBoardPiecesWin()) {
        updateTypeCount(i, true);
        board[i] = 0;
        return i;
      }
      updateTypeCount(i, true);

      board[i] = 0;

    }
  }

  return null;
}

function getMinMaxPiece() {
  if (currentRound <= 3) return getRandomPiece();

  var depth = game["minmax" + currentPlayer],
    alpha = -10000,
    beta = 100000,
    bestPiece = -1;

  if (depth > 4 && currentRound < 6) depth = 4;

  for (var i = 0; i < 16; i++) {
    if (!pieces[i]) continue;
    var newVal = doMinmaxBoard(depth, 0, alpha, beta, i);
    if (newVal > alpha) {
      if (newVal >= 1000) return i;
      alpha = newVal;
      bestPiece = i;
    }
  }
  return bestPiece;
}

function getMinMaxBoard() {
  //Returns a pice inside the center of the board if round less than 3
  if (currentRound <= 3) {
    for (var row = 1; row < 3; row++) {
      for (var col = 1; col < 3; col++) {
        if (!board[row * 4 + col]) return row * 4 + col;
      }
    }
  }


  var depth = game["minmax" + currentPlayer],
    alpha = -100000,
    beta = 100000,
    bestPos = -1;

  if (depth > 4 && currentRound < 6) depth = 4;

  for (var i = 0; i < 16; i++) {
    if (board[i]) continue;
    if (tempSel(i, selectedPiece)) return i;
    var newVal = doMinmaxPiece(depth, 1, alpha, beta);

    tempUnSel(i, selectedPiece);
    if (newVal > alpha) {
      if (newVal >= 1000) return i;
      bestPos = i;
      alpha = newVal;
    }
  }

  return bestPos;
}

function tempSel(boardI, selI) {
  board[boardI] = pieces[selI];
  pieces[selI] = 0;
  updateTypeCount(boardI);

  if (checkBoardPiecesWin()) {
    tempUnSel(boardI, selI);
    return 1;
  }
  return 0;
}

function tempUnSel(boardI, selI) {
  updateTypeCount(boardI, true);
  pieces[selI] = board[boardI];
  board[boardI] = 0;
}

function doMinmaxBoard(depth, isMax, alpha, beta, selIndex) {
  if (depth == 0) return getHeuristicValue(isMax);

  if (isMax) {
    for (var i = 0; i < 16; i++) {
      if (board[i]) continue;
      if (tempSel(i, selIndex)) {
        return depth * 1000;
      }

      alpha = doMinmaxPiece(depth, isMax, alpha, beta);
      tempUnSel(i, selIndex);

      if (beta <= alpha) return alpha;
    }

    return alpha;
  } else {

    for (var i = 0; i < 16; i++) {
      if (board[i]) continue;
      if (tempSel(i, selIndex)) {
        return -1000;
      }

      beta = doMinmaxPiece(depth, isMax, alpha, beta);
      tempUnSel(i, selIndex);

      if (beta <= alpha) return beta;
    }

    return beta;
  }
}

function doMinmaxPiece(depth, isMax, alpha, beta) {
  depth--;
  if (isMax) {
    for (var j = 0; j < 16; j++) {
      if (!pieces[j]) continue;
      alpha = Math.max(alpha, doMinmaxBoard(depth, !isMax, alpha, beta, j));
      if (beta <= alpha) return alpha;
    }

    return alpha;
  } else {
    for (var j = 0; j < 16; j++) {
      if (!pieces[j]) continue;
      beta = Math.min(beta, doMinmaxBoard(depth, !isMax, alpha, beta, j));
      if (beta <= alpha) return beta;
    }

    return beta;
  }
}

var type3test = new Array(8);

function getHeuristicValue(isMax) {

  var res = 0;
  //types3 = new Array(8);
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 8; j++) {
      switch (typeCount[i][j]) {
        case 3:
          res += 10;
          type3test[j] = 1;
          break;
        case 2:
          res += 1;
          break;
      }
    }
  }

  for (var i = 0; i < 4; i++) {
    if (type3test[i] == 1 && type3test[i * 2] == 1) {
      res += 100;
      break;
    }

    type3test[i] = 0;
    type3test[i * 2] = 0;
  }
  return (isMax ? 1 : -1) * res;
}

/**
 * Sets the selected piece on the piece board
 * @param {item} piece from the piece collection
 */

function setSelected(piece, notOnline) {
  selectedPiece = piece;
  Session.set("selected", piece);

  if (isOnlineGame(game) && !notOnline) {
    Meteor.call("doMove", Session.get("userId"), lastBoardPos, selectedPiece);
  }
}

/**
 * Places a piece on the board = b
 * if not b is set then then check wheter the computer should place the piece,
 *   if so then which AI level it should use to place the piece
 * @param  {[board]} b (optional) where to place the piece
 */

function placePiece(b, notOnline) {
  lastBoardPos = b;
  board[b] = pieces[selectedPiece];
  updateTypeCount(b);
  pieces[selectedPiece] = 0;
  currentRound++;

  if (checkForWin()) {
    hasWon = true;
    setHoverable(false, false);

    if (isOnlineGame()) {
      var p = Players.findOne();
      if (!notOnline) {
        Meteor.call("doMove", Session.get("userId"), lastBoardPos, -1);
      }
    }

    if (game.runSimulations) {
      updateSimulation();
    }

  } else {
    selectPiece();
  }
}

function updateTypeCount(boardIndex, doReverse) {
  var row = Math.floor(boardIndex / 4),
    col = boardIndex - row * 4,
    diag1 = boardIndex % 5 == 0,
    diag2 = boardIndex && boardIndex % 3 == 0 && boardIndex <= 12,
    pieceVal = board[boardIndex];

  for (var i = 0; i < 4; i++) {
    var type = i + 4 * parseInt(pieceVal[i]),
      val = doReverse ? -1 : 1;
    typeCount[row][type] += val;
    typeCount[col + 4][type] += val;
    if (diag1) typeCount[8][type] += val;
    if (diag2) typeCount[9][type] += val;

    typeCount[10][type] += val;
  }
}

function existsWinType(array) {
  var i = 8;
  while (i--)
    if (array[i] >= 4) return i;
  return -1;
}

function updateSimulation() {
  simCount++;
  if (simCount < game.runSimulations) {

    if (isOnlineGame()) {
      Meteor.call("restart", isMonitor() ? Players.findOne()._id : Session.get("userId"));
    }
    setTimeout(startGame);
  } else {
    Session.set("simulationDone", true);
  }
}

function setHoverable(board, pieces) {
  Session.set("hoverableBoard", board);
  Session.set("hoverablePieces", pieces);
}

function setInfo(text) {
  Session.set("infoText", text);
}

function setWinInfo(indexes, typeIndex) {
  var avgSel = [getAvg(timePick[0]), getAvg(timePick[1])],
    avgPlace = [getAvg(timePlace[0]), getAvg(timePlace[1])];

  winInfo = {
    timeRound0: avgSel[0] + avgPlace[0],
    timeRound1: avgSel[1] + avgPlace[1],
    round: simCount + 1
  };

  if (currentRound == 16) {
    winInfo.draw = 1;
    winInfo.winner = "Draw";
    winInfo.winInfo = "NaN";
    winInfo.reason = "Game ended in a draw";
    setInf(winInfo.reason);
  } else {
    winInfo.winner = getNameOfPlayer(currentPlayer);
    winInfo.winnerIndex = currentPlayer;
    winInfo.indexes = indexes;
    winInfo.reason = "4 " + getTypeName(typeIndex) + " in a row";
    setInfo(winInfo.winner + " wins! Has " + winInfo.reason);
  }

  if (simulations) {
    simulations.insert(winInfo);
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
    setWinInfo();
    //setInfo("Game ended in a draw");
    return 1;
  }

  if (currentRound >= 4 && checkBoardPiecesWin()) {
    var typeIndex, indexes;
    for (var i = 0; i < 10; i++) {
      typeIndex = existsWinType(typeCount[i]);
      if (typeIndex > -1) break;
    }
    if (i < 4) {
      var row = i * 4;
      indexes = [row, row + 1, row + 2, row + 3];
    } else if (i < 8) {
      col = i - 4;
      indexes = [col, col + 4, col + 8, col + 12];
    } else if (i == 8) {
      indexes = [0, 5, 10, 15];
    } else {
      indexes = [3, 6, 9, 12];
    }

    setWinInfo(indexes, typeIndex);
    return 1;
  }

  return 0;
}

function checkBoardPiecesWin() {
  if (currentRound < 4) return 0;
  var i = 4;

  for (var i = 0; i < 10; i++) {
    if (existsWinType(typeCount[i]) > -1) return 1;
  }

  return 0
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
      selectBoardPlace();
    }
  }
});

Template.game.gameType = function() {
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
  if (hasWon && !winInfo.draw && winInfo.indexes.indexOf(this.i) >= 0)
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
  return game.runSimulations || isMonitor();
}

Template.simulations.items = function() {
  return simulations.find();
}

Template.simulations.nameOf = getNameOfPlayer;

Template.simulations.stats = function() {
  var win0 = 0,
    win1 = 0,
    avg0 = 0,
    avg1 = 0,
    count = 0,
    draws = 0;
  simulations.find().forEach(function(s) {
    if (!s.draw) {
      if (s.winnerIndex) {
        win1++;
      } else {
        win0++;
      }

    } else {
      draws++
    }
    avg0 += s.timeRound0;
    avg1 += s.timeRound1;
    count++;
  });

  return [{
    name: getNameOfPlayer(0),
    wins: win0,
    loss: win1,
    draw: draws,
    timeRound: Math.round(avg0 / (count)),
    percent: Math.round((win0 / count) * 100)
  }, {
    name: getNameOfPlayer(1),
    wins: win1,
    loss: win0,
    draw: draws,
    timeRound: Math.round(avg1 / (count)),
    percent: Math.round((win1 / count) * 100)
  }];
}

/**
 * NETWORK STUFF
 */
Meteor.startup(function() {
  Players.find().observe({
    changed: function(g, oldG) {
      console.log("Playerupdate", g);
      if (g.searching) {
        setInfo("Searching for other players");
        return;
      }
      if (g.doRestart) {
        Session.set("newGame", true);
        Meteor.call("restart", Session.get("userId"));
        return;
      }

      if (g.turn === undefined) {
        setInfo("Wating for other player");
        return;
      }

      if (!onlineStarted) {
        console.log("Starting online game");

        //Swapper indexer for type 
        //hvis man ser at man har fått motsatt player index online
        if (!Session.get("monitorGame")) {
          if (g.index == 0 && game.type0 == 5) {
            game.type0 = game.type1;
            game.type1 = 5;
            game.minmax0 = game.minmax1;
          } else if (g.index == 1 && game.type1 == 5) {
            game.type1 = game.type0;
            game.type0 = 5;
            game.minmax1 = game.minmax0;

          }
        }
        Session.set("g", game);

        currentPlayer = g.turn;
        onlineStarted = true;
        selectPiece();
        return;
      }

      if (g.index === g.turn) {

        if (g.selectedPos > -1) placePiece(g.selectedPos, true);

        if (g.selectedPiece > -1) {
          setSelected(g.selectedPiece, true);
          selectBoardPlace();
        }
      }

    }
  });
});