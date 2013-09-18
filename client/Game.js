/*****
GAME PLAY
  global var game: inited in Quarto.js startGame() contins info about game
    type0: type of player 1, 1=human, 2=random, 3=novice, 4=minmax 5=online player
    type1: same as over just for player 2
    minmax0: int minmax level of player 1
    minmax1: int minmax level of player 2
    runSimulations = int how many simuylations to run, 0 for regular game
    gameId: string if online game, to find a specific game with this id

  typeCount = array[10] keeping count of number of attributes on a row, col and diagonals
    each row = array[8] ints one for each attribute in this order (red,circle,smal,notHole,blue,square,big,hasHole)
  currentPlayer = the current player to place and select piece,
  board = array[16] is empty when game is started
  pieces = array[16] is filled with all the combinations of pieces when started (all combinations of 4bits).
    piece is represented by 4 bits, 
      1 bit 1 if blue else red
      2 bit 1 if square else circle
      3 bit 1 if big else smal
      4 bit 1 if hasHole else not hole
  timePlace,timePick is performance statistics
  winInfo is for printing winner information, and storing when multiple simulation
******/
window.typeCount = [];

var currentPlayer, selectedPiece, currentRound, lastBoardPos = -1;
var board = [],
  pieces = [],
  timePlace, timePick,
  type, simCount = 0,
  onlineStarted = false;
var winInfo = {}, hasWon = false;

/**
 * This methods starts the game by init
 * the board and pieces list, and the type count
 * when done init
 * it runs selectPiece to request the player to select piece
 */
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
  //if online game the game is started by the server monitor at the bottom of this file
  if (isOnlineGame(game)) {
    onlineStarted = false;
  } else {

    !isMonitor() && selectPiece();
  }
}

/**
 * Bit shifst the current player
 * @return {[int]} [next player]
 */
function getNextPlayer() {
  //Bit shifts the player so it toggles between 0 and 1;
  return bitShift(currentPlayer);
}

/**
 * Sets the next player
 */
function setNextPlayer() {
  currentPlayer = getNextPlayer();
}

/**
 * Gets the player type of current player from the global game (see top for details)
 * @return {[type]} [description]
 */
function getPlayerType() {
  return game["type" + currentPlayer];
}

/**
 * Gets a printable name for the player with the given index
 * @param  {[type]} index [description]
 * @return {[type]}       [description]
 */
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
      } else {
        var n = Players.findOne();
        if (n) return n.oponent;
      }
    default:
      return playerTypes[type - 1].name;
  }
}

/**
 * select piece for game
 * @return {[type]} [description]
 */
function selectPiece() {
  //Sets current selected to null
  Session.set("selected", null);
  var type = getPlayerType();
  //Looks over types to pick right action for player
  //default is if the comnputer shold pick piece
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
      //Register time start
      var time = new Date().getTime();
      setSelected(getPiece[type]());
      //Save time used to select piece
      timePick[currentPlayer].push(new Date().getTime() - time);
      //If against human, print info on screen
      if (game.type1 == 1 || game.type2 == 1) {
        setInfo("Computer selected this piece for you to place");
      }
      //run select board place 
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
//javascript hack for easy select of right type of player bot when selecting piece and board place
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

/**
 * get pice for novice player
 * @return {[type]} [description]
 */
function getNovicePiece() {
  //Returns random before round 3
  if (currentRound <= 3) return getRandomPiece();

  var i = 16;
  //Loops over pieces and check for first piece that does not give winning board
  //Else return random piece
  while (i--) {
    if (pieces[i] && firstWinBoardPos(i) === null) return i;
  }
  return getRandomPiece();
}

/**
 * Gets noveice board
 * @return {[type]} [description]
 */
function getNoviceBoard() {
  if (currentRound <= 3) return getRandomBoard();
  return firstWinBoardPos(selectedPiece) || getRandomBoard();
}

/**
 * Checks the board for a winning state given the piece parameter
 * @param  {[type]} piece indexOf piiece
 * @return {[type]} board index if found nul else
 */
function firstWinBoardPos(piece) {
  var i = 16;
  while (i--) {
    if (board[i]) continue;
    //Places piece temp
    //Check for win
    //reset temp
    board[i] = pieces[piece];
    updateTypeCount(i);
    if (checkBoardPiecesWin()) {
      updateTypeCount(i, true);
      board[i] = 0;
      return i;
    }
    updateTypeCount(i, true);

    board[i] = 0;
  }

  return null;
}

/**
 * Retrives the minmax piece
 * @return {[int]} [index of best piece selected by minmax]
 */
function getMinMaxPiece() {
  if (currentRound <= 3) return getRandomPiece();

  //gets minmax level from global game (see top for details)
  var depth = game["minmax" + currentPlayer],
  //Sets alpha level that will be improved
    alpha = -10000,
    beta = 100000,
    bestPiece = -1;
  //If depth greater than 4 and not round 6 reached set depht to 4 to not crash computer
  if (depth > 4 && currentRound < 6) depth = 4;

  //Loops over alle the pieces and runs min max on board with this piece as selected
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

/**
 * Gets minmax for board
 * @return {[int]} [boardIndex]
 */
function getMinMaxBoard() {
  //Returns a pice inside the center of the board if round less than 3
  if (currentRound <= 3) {
    for (var row = 1; row < 3; row++) {
      for (var col = 1; col < 3; col++) {
        if (!board[row * 4 + col]) return row * 4 + col;
      }
    }
  }

  //See getMinmaxPieces() for details
  var depth = game["minmax" + currentPlayer],
    alpha = -100000,
    beta = 100000,
    bestPos = -1;

  if (depth > 4 && currentRound < 6) depth = 4;

  //Loops over boardplaces and places the selected piece in it
  //Check for win, if not immediate win run minmax on pieces with htis board
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
/**
 * Temporary select a piece in a given board index
 * Also checkse for win, if win backwrite the temp select and return true
 * @param  {[type]} boardI [board index]
 * @param  {[type]} selI   [piece index]
 * @return {[type]}        [description]
 */
function tempSel(boardI, selI) {
  board[boardI] = pieces[selI];
  pieces[selI] = 0;
  //Update type count to keep this up to date
  updateTypeCount(boardI);

  if (checkBoardPiecesWin()) {
    tempUnSel(boardI, selI);
    return 1;
  }
  return 0;
}

/**
 * Write back the previous selected piece on the give board index
 * @param  {[type]} boardI [description]
 * @param  {[type]} selI   [description]
 * @return {[type]}        [description]
 */
function tempUnSel(boardI, selI) {
  //Revert type count
  updateTypeCount(boardI, true);
  pieces[selI] = board[boardI];
  board[boardI] = 0;
}

/**
 * Does minmax on the board
 * @param  {[type]}  depth    [depth left]
 * @param  {Boolean} isMax    [true if is max player]
 * @param  {[type]}  alpha    [curren alpha value]
 * @param  {[type]}  beta     [current beta value]
 * @param  {[type]}  selIndex [piece index]
 * @return {[type]}  alpha if ismax else beta
 */
function doMinmaxBoard(depth, isMax, alpha, beta, selIndex) {
  if (depth == 0) return getHeuristicValue(isMax);

  //Loops over board places and temporary select select pieces in board place
  //And does recursive call to doMinmaxPiece
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

//An array to check for sure wins on board with 3 pices in row of oposite types
var type3test = new Array(8);
/**
 * Retrives the heuristic value for the board
 * @param  {Boolean} isMax [description]
 * @return {[type]}        [description]
 */
function getHeuristicValue(isMax) {
  //Inits score at 0
  var res = 0;
  //Loops over alle the attribute counte
  //If count is 3 then 10 points, also check true ine the type3test to check for oposite types
  //if count is 2 then 1 point
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
  //Loops over half of teh oposite type chekc to check if ther is an oposite type that alsoe is true
  //That means if index i and i*2 is true then two of oposite type exists on board
  //example:if i = 0 then i+4 = 4, then red and blue attributes exists 3 of in a row on board which gice a garanted win
  for (var i = 0; i < 4; i++) {
    if (type3test[i] == 1 && type3test[i + 4] == 1) {
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
/**
 * When pieces is placed on board this function is run to update the type count for each row,column and diagonals
 * @param  {[int]} boardIndex [Selected board index]
 * @param  {[type]} doReverse  if true the typeCount is decreased by one isted of increased by one
 * @return {[type]}            [description]
 */
function updateTypeCount(boardIndex, doReverse) {
  var row = Math.floor(boardIndex / 4),
    col = boardIndex % 4,
    diag1 = boardIndex % 5 == 0,
    diag2 = boardIndex && boardIndex % 3 == 0 && boardIndex <= 12,
    pieceVal = board[boardIndex];

  for (var i = 0; i < 4; i++) {
    try {
      var type = i + 4 * parseInt(pieceVal[i]),
        val = doReverse ? -1 : 1;
      //if(typeCount[row][type]) debugger;

      typeCount[row][type] += val;
      typeCount[col + 4][type] += val;
      if (diag1) typeCount[8][type] += val;
      if (diag2) typeCount[9][type] += val;

      typeCount[10][type] += val;
    } catch (e) {
      console.log(pieceVal);
      //debugger;
    }
  }
}

/**
 * Checks the typeCoutn for a winning attribute (value >= 4)
 * @param  {[type]} array [description]
 * @return {[type]}       [description]
 */
function existsWinType(array) {
  var i = 8;
  while (i--)
    if (array[i] >= 4) return i;
  return -1;
}

/**
 * When game is run this function is run to check if more simulations is necessary
 * @return {[type]} [description]
 */
function updateSimulation() {
  simCount++;
  if (simCount < game.runSimulations) {

    if (isOnlineGame()) {
      Meteor.call("restart", Session.get("userId"));
    }

    setTimeout(startGame);
  } else {
    Session.set("simulationDone", true);
  }
}

/**
 * Makes the board or pieces hoverable in the gui
 * @param {[type]} board  [description]
 * @param {[type]} pieces [description]
 */
function setHoverable(board, pieces) {
  Session.set("hoverableBoard", board);
  Session.set("hoverablePieces", pieces);
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

/**
 * Checks the board for a winning combination by looping over the typeCount array 
 * looking for for value of 4 of an attribute
 * @return {[type]} [description]
 */
function checkBoardPiecesWin() {
  if (currentRound < 4) return 0;
  var i = 4;

  for (var i = 0; i < 10; i++) {
    if (existsWinType(typeCount[i]) > -1) return 1;
  }

  return 0
}

/**
 * Updates the info printed in the GUI
 * @param {[type]} text [description]
 */
function setInfo(text) {
  Session.set("infoText", text);
}

/**
 * Sets the winning info and saves if simulation is running
 * @param {[type]} indexes   [description]
 * @param {[type]} typeIndex [description]
 */
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
    setInfo(winInfo.reason);
  } else {
    winInfo.winner = getNameOfPlayer(currentPlayer);
    winInfo.winnerIndex = currentPlayer;
    winInfo.indexes = indexes;
    winInfo.reason = "4 " + getTypeName(typeIndex) + " in a row";
    setInfo(winInfo.winner + " wins! Has " + winInfo.reason);
  }

  if (game.runSimulations) {
    simulations.insert(winInfo);
  }
}


/*****************************
 * GUI UPDATING STUFF
 ***************************/

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

/******
SIMULATION STUFF
******/
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

      if (isMonitor()) {
        currentPlayer = g.turn;
        if (g.doRestart) {
          startGame();
        }

        if (g.selectPiece > -1) {
          selectedPiece = g.selectedPiece;
        }

        if (g.selectedPos > -1) {
          placePiece(g.selectedPos);
          if (checkBoardPiecesWin()) {
            simulations.insert({
              round: simulations.find().count() + 1,
              winner: getNameOfPlayer(g.turn),
              winnerIndex: g.turn,
              reason: "something cool"
            });
          }
        }

        return;
      }
      //console.log("Playerupdate", g);
      if (g.searching) {
        setInfo("Searching for other players");
        return;
      }
      if (g.doRestart || g.superRestart) {
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
        if (g.index == 0 && game.type0 == 5) {
          game.type0 = game.type1;
          game.type1 = 5;
          game.minmax0 = game.minmax1;
        } else if (g.index == 1 && game.type1 == 5) {
          game.type1 = game.type0;
          game.type0 = 5;
          game.minmax1 = game.minmax0;

        }
        Session.set("g", game);

        currentPlayer = g.turn;
        onlineStarted = true;
        if (g.turn == g.index)
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
/**
 * Used for playing with other games through the server
 * Monitor is to wach other games beeing played
 * @return {[type]} [description]
 */
Deps.autorun(function() {
  var monitor = Session.get("monitorGame");
  if (monitor) {
    console.log("monitorGame")
    Meteor.subscribe('monitor', Session.get("monitorGame"));
  } else {
    Meteor.subscribe("player", Session.get("userId"));
  }
});