Meteor.startup(function() {
  if (!document.cookie || document.cookie.length < 3) {
    document.cookie = "Awesome-"+(Math.round(new Date().getTime()/1000));
  }
  if (!Session.get("userId")) {
    Session.set("userId", document.cookie);
  }
  if (Session.get("g")) {
    game = Session.get("g");
  }
});


function startGame() {
  game = {
    type0: Session.get("type0"),
    type1: Session.get("type1"),
    minmax0: getMinMax(0),
    minmax1: getMinMax(1),
    runSimulations: Session.get("runSimulations") ? parseInt($("#simulationsCount").val()) : false,
    gameId: $("#gameId").val()
  };
  game.gameId = game.gameId && game.gameId.length >= 3 ? game.gameId : 0;
  if (!game.type0 || !game.type1) {
    alert("Both player 1 and 2 level is required");
  }

  Session.set("gameId", game.gameId);
  Session.set("newGame", true);
  if (isMonitor()) {
    if (!game.gameId) {
      alert("Game id is required to monitor game");
      return;
    }
    console.log("MONITOR GAME");
    Session.set("monitorGame", game.gameId);

  } else {
    Session.set("monitorGame", false);
    if (isOnlineGame()) {
      Meteor.call("startGame", Session.get("userId"), game.gameId);
    }
  }

  Session.set("g", game);
  Session.set("gameStarted", true);
}

window.restartGame = function() {
  Session.set("newGame", true);

  if (isOnlineGame(Session.get("g"))) {
    Meteor.call("restart", Session.get("userId"));
  }
}

function endGame() {
  Session.set("gameStarted", false);
  Session.set("selected", null);
  Session.set("runSimulations", false);
}

function getMinMax(playerId) {
  return parseInt($("#minmax" + playerId).val());
}


/******************
GAME SELECT UI
*******************/

Template.body.events({
  'click #changeGame': endGame,
  'click #restartGame': restartGame
});

Template.body.showGame = function() {
  return Session.get("gameStarted");
}

Template.gameSelect.events({
  'click #startBtn': startGame,

  'click #player0 .btn': function() {
    Session.set("type0", this.id);
  },

  'click #player1 .btn': function() {
    Session.set("type1", this.id);
  },

  'click #yesBtn': function() {
    Session.set("runSimulations", true);
  },
  'click #noBtn': function() {
    Session.set("runSimulations", false);
  },

  'click #changeNameBtn' : function(e,r){
    var val = r.find("#playerName").value;
    if(val && val.length > 4){
      document.cookie = val;
      Session.set("userId",val);
      console.log("name updated");
    }else{
      alert("player name must be at least 5 characters");
    }
  }
});

Template.gameSelect.playername = function(){
  return Session.get("userId");
}

Template.gameSelect.playerTypes = function() {
  return playerTypes;
}

Template.gameSelect.players = function() {
  return [{
    id: 0,
    name: 1
  }, {
    id: 1,
    name: 2
  }];
}

Template.gameSelect.isActive = function(player) {
  return Session.get("type" + player.id) == this.id ? "btn-success active" : "btn-primary";
}

Template.gameSelect.showVS = function() {
  return this.id == 0;
}

Template.gameSelect.showMinMax = function() {
  return Session.get("type" + this.id) == 4;
}

Template.gameSelect.showMultiple = function() {
  return Session.get("type0") > 1 && Session.get("type1") > 1;
}

Template.gameSelect.showGameId = function() {
  return Session.get("type0") == 5 || Session.get("type1") == 5;
}