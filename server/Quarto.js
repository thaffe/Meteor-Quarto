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

	startGame: function(userId, gameId) {
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

			var playerTurn = Math.round(Math.random());
			updateAttrs.turn = playerTurn;

			Players.update(oponent._id, {
				gameId:updateAttrs.gameId,
				searching: 0,
				oponent: player._id,
				index: 0,
				turn: playerTurn
			});
		} else {
			updateAttrs.searching = 1;
		}


		Players.update(userId, updateAttrs);

	},

	restart: function(userId) {
		var player = Players.findOne(userId);
		if (!player || !player.oponent) return;

		if (player.doRestart) {
			var playerTurn = Math.round(Math.random()),
				update = {
					doRestart: 0,
					turn: playerTurn,
					selectedPiece: -1,
					selectedPos: -1
				};
			playerUpdate(userId, update);
			playerUpdate(player.oponent, update);
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
			Meteor.Error(500, 'Its not your turn');
			return;
		}

		playerUpdate(player.oponent, {
			turn: bitShift(player.turn),
			selectedPos: placePos,
			selectedPiece: selectedPiece
		});
	},

	exit: function(userId) {
		playerUpdate({
			oponent: userId
		}, {
			oponent: 0
		});
		Players.remove(userId);
	},

	joinGame: function(id) {
		var g = Games.findOne(id);
		if (g) {
			if (g.playerCount < 2) {
				updateGame(id, {
					playerCount: 2,
				});

				return 1;

			} else {
				updateGame(id, {
					playerCount: 1,
					readyCount: 0
				})
			}

		} else {

			Games.insert({
				_id: id,
				playerCount: 1,
				readyCount: 0,
			});

		}

		return 0;
	}
});

function updateGame(id, updateAttrs) {
	Games.update(id, {
		$set: updateAttrs
	});
}

function playerUpdate(id, updateAttrs) {
	updateAttrs.last = new Date().getTime();
	Players.update(id, {
		$set: updateAttrs
	});
}