Meteor.Router.add("/init/:id", function(id) {
	var res = {
		index: 0,
	}
	var q = Games.findOne(id);
	if (q) {
		res.index = 1;
		res.boardTurn = q.boardTurn;
	} else {
		res.boardTurn = Math.round(Math.random())
		Games.insert({
			_id: id,
			last: new Date().getTime(),
			select: 1,
			boardTurn: res.playerTurn,
			board: getEmptyBoard(),
			pieces: getPieces()
		});
	}

	return JSON.stringify(res);
});

Meteor.Router.add("/getPiece/:id/:playerIndex", function(id, playerIndex) {
	var g = Games.findOne(id);
	if (g && g.piece) {

	}
});

Meteor.Router.add("/getBoard/:id/:playerIndex", function(id, playerIndex) {
	var g = Games.findOne(id);
	if (g && g.piece) {

	}
});

Meteor.Router.add("/piece/:id/:playerIndex/:isBlack/:isSquare/:isBig/:hasHole", function(id, playerIndex, isBlack, isSquare, isBig, hasHole) {
	var g = Games.findOne(id);
	if (g && g.boardTurn != playerIndex) {
		g.update(id, {
			$set: {
				piece:pieceToInteger(isBlack,isSquare,isBig,hasHole)
			}
		})
	}
});

Meteor.Router.add("/board/:id/:playerIndex/:row/:col", function(row, col) {

});

Meteor.Router.add("/exit/:id", function(id) {
	Games.remove({
		gameId: id
	});
	Pieces.remove({
		gameId: id
	});
	Board.remove({
		gameId: id
	});
});

var Games = new Meteor.Collection("onlineGames");
var Pieces = new Meteor.Collection("pieces");
var Board = new Meteor.Collection("board");

Meteor.startup(function() {
	Games.remove({});
});

function getGameIfTurn(id, index, doBoard) {
	var g = Games.findOne(id);
	return g && ((index == g.boardTurn && doBoard) ||
		(index != g.boardTurn && !doBoard)) ? g : null;
}

function getPieces() {
	var res = new Array(16);
	for (var row = 0; row < 4; row++) {
		for (var col = 0; col < 4; col++) {
			var index = row * 4 + col + "";
			res[pieceToInteger(col < 2, row < 2, isEven(col), isEven(row))] = 1;
		}
	}

	return res;

}

function getEmptyBoard() {
	var i = 16, res = new Array(16);
	while (i--) {
		res[i] = 0;
	}

	return res;
}

function pieceToInteger(isBlack, isSquare, isBig, hasHole) {
	return (isBlack << 3) | (isSquare << 2) | (isBig << 1) | (isBig << 0);
}