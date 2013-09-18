(function() {
	this.isEven = function(n) {
		return n % 2 === 0;
	}

	this.bitShift = function(i) {
		return (!i) >> 0
	}

	this.createList = function(len, value) {
		var res = new Array(len);
		while (len--) {
			res[len] = typeof value == "function" ? value(len) : value;
		}

		return res;
	}

	this.getList = function(isFull) {
		return createList(16, isFull ? toBinary : 0);
	}

	/**
	 * Gjør om booleans value til 4bits tall som er indexen til piecen
	 * @param  {Boolean} isBlack  [if 4bit is 1 then black else white, when index >= 8]
	 * @param  {Boolean} isSquare [if 3bit is 1 then square else round, when index >= 4 & index <= 7 || index >= 12]
	 * @param  {Boolean} isBig    [if 2bit is 1 then big else small, when index n%4 >= 2]
	 * @param  {Boolean} hasHole  [if 1bit is 1 then has hole else not, when index n%2!=0 (notEven)]
	 * @return {[type]}           [int index of the number in the list]
	 */
	this.pieceToInteger = function(isBlack, isSquare, isBig, hasHole) {
		return (isBlack << 3) | (isSquare << 2) | (isBig << 1) | (hasHole << 0);
	}

	this.toBinary = function(i) {
		var s = i.toString(2);
		while (s.length < 4) {
			s = "0" + s;
		}

		return s;
	}

	this.Players = new Meteor.Collection("players");
	this.game = {};

	if (Meteor.isClient) {
		this.simulations = new Meteor.Collection.ObjectID(null);
		this.isOnlineGame = function() {
			return (game.type0 == 5 || game.type1 == 5) && game.type1 != game.type0;
		}

		this.isMonitor = function() {
			return game.type0 == 5 && game.type1 == 5
		}

		this.playerTypes = [{
			id: 1,
			name: "Human"
		}, {
			id: 2,
			name: "Random Computer"
		}, {
			id: 3,
			name: "Novice Computer"
		}, {
			id: 4,
			name: "Minmax-D Computer"
		}, {
			id: 5,
			name: "Online Computer"
		}];

		this.getTypeName = function(typeIndex) {
			switch (typeIndex) {
				case 0:
					return "red pieces";
				case 1:
					return "circle pieces";
				case 2:
					return "small pieces";
				case 3:
					return "pieces without hole";
				case 4:
					return "blue pieces";
				case 5:
					return "square pieces";
				case 6:
					return "big pieces";
				case 7:
					return "pieces with hole";
			}
		}

		this.getAvg = function(times) {
			var avg = 0;
			for (var i = 0; i < times.length; i++) {
				avg += times[i];
			}

			return Math.round(avg / times.length);
		}
	}

}).call(this);