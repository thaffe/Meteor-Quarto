Meteor.startup(function() {
	Players.remove({
		last: {
			$lt: (new Date().getTime() - 180000)
		}
	})
});

Meteor.publish('player', function(id, resetPlayer) {
	if (!Players.findOne(id)) {
		Players.insert({
			_id: id
		});
	} else if (resetPlayer) {
		Players.update(id, {})
	}
	return Players.find({
		_id: id
	});
});

Meteor.publish('monitor', function(gameId) {
	console.log("monitor");
	return Players.find({
		gameId: gameId
	});
});


Meteor.methods({
	count: function(id) {
		console.log(Players.find({
			gameId: id
		}).count());
		return Players.find({
			gameId: id
		}).count();
	},

	resetPlayer: function(id) {
		Players.update(id, {});
	},

	resetPlayersGame: function(gameId) {
		Players.update({
			gameId: gameId
		}, {
			selectedPiece: -1,
			selectedPos: -1
		});
		return Players.find({
			gameId: gameId
		}).fetch();
	},

	startGame: function(userId, gameId) {
		console.log(userId, gameId);
		var player = Players.findOne(userId);
		if (!player) return;
		var oponent, updateAttrs = {
				gameId: gameId || 0,
				selectedPos: -1,
				selectedPiece: -1,
				last: new Date().getTime()
			};

		if (gameId) {
			oponent = Players.findOne({
				_id: {
					$ne: userId
				},
				gameId: gameId
			});
		} else {
			oponent = Players.findOne({
				_id: {
					$ne: userId
				},
				searching: 1,
				gameId: 0
			});
		}

		if (oponent) {
			updateAttrs.oponent = oponent._id;
			updateAttrs.index = 1;
			updateAttrs.searching = 0;
			//var playerTurn = //Math.round(Math.random());
			updateAttrs.turn = 0;
			updateAttrs.startTurn = 0;

			Players.update(oponent._id, {
				gameId: updateAttrs.gameId,
				searching: 0,
				oponent: player._id,
				index: 0,
				turn: 0
			});
		} else {
			updateAttrs.searching = 1;
		}


		Players.update(userId, updateAttrs);

	},

	restartBoth: function(gameId) {
		console.log("restartBooth");
		var p = Players.find({
			gameId: gameId
		}).fetch();

		playerUpdate(p[1]._id, {
			doRestart: 1,
			turn:-1
		});

		playerUpdate(p[0]._id, {
			superRestart: 1,
			turn:-1
		});
		
		//Players.update({gameId:gameId},{$set:{doRestart:1}});
	},

	restart: function(userId) {
		var player = Players.findOne(userId);
		if (!player || !player.oponent) return;

		if (player.doRestart) {
			var turn = player.startTurn ? 0 : 1;
			//var playerTurn = Math.round(Math.random()),
			update = {
				superRestart: 0,
				startTurn: turn,
				doRestart: 0,
				turn: turn,
				selectedPiece: -1,
				selectedPos: -1
			};

			var pT = Players.findOne({
				index: turn,
				gameId: player.gameId
			});
			console.log("REEESTEART, playerTostart: " + (pT ? pT._id : "ERRROR") + " index:" + turn);

			playerUpdate(userId, update, function() {
				playerUpdate(player.oponent, update);

			});

		} else {
			Players.update(userId, {
				oponent: player.oponent,
				index: player.index,
				gameId: player.gameId
			});
			playerUpdate(player.oponent, {
				doRestart: 1
			});
		}
	},

	doMove: function(userId, placePos, selectedPiece) {
		var player = Players.findOne(userId);
		if (!player || !player.oponent) return;
		if (player.turn != player.index) {
			//Meteor.Error(500, 'Its not your turn');
			return;
		}

		console.log("Place:" + placePos + " Sel:" + selectedPiece + " userId:" + userId);
		Meteor.setTimeout(function() {
			playerUpdate(player.oponent, {
				turn: bitShift(player.turn),
				selectedPos: placePos,
				selectedPiece: selectedPiece
			});
		}, 50);

	},

	exit: function(userId) {
		playerUpdate({
			oponent: userId
		}, {
			oponent: 0
		});
		Players.remove(userId);
	}
});

function updateGame(id, updateAttrs) {
	Games.update(id, {
		$set: updateAttrs
	});
}

function playerUpdate(id, updateAttrs, callback) {
	updateAttrs.last = new Date().getTime();
	Players.update(id, {
		$set: updateAttrs
	}, callback);
}