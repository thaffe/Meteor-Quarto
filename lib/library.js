(function() {
	this.isEven = function(n) {
		return n % 2 === 0;
	}

	this.getList = function(isFull){
		var i = 16, res = [];
		while(i--){
			res[i] = isFull ? toBinary(i) : false;
		}

		return res;
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

	this.toBinary = function(i){
		var s = i.toString(2);
		while(s.length < 4){
			s = "0"+s;
		}

		return s;
	}

	this.test = function(empty){
		var a = ["std",false,"std"];
		var i = a.length;
		while(i--){
			if(!a[i] == empty){
				console.log("REss",i);
			}
		}
	}

}).call(this);