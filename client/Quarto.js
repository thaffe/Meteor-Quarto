var playerTypes = [
  {id:1, name:"Human"},
  {id:2, name:"Random Computer"},
  {id:3, name:"Novice Computer"},
  {id:4, name:"Minmax-D Computer"}
];

function startGame(){
  var g = {
    type0:Session.get("type0"),
    type1:Session.get("type1"),
    minmax0 : getMinMax(0),
    minmax1 : getMinMax(1),
    runSimulations : Session.get("runSimulations") ? parseInt($("#simulationsCount").val()) : false
  };
  Session.set("newGame", true);
  if(g.type0 && g.type1){
    console.log(g);
    Session.set("g",g);
  }else{
    alert("Both player 1 and 2 level is required");
  }
}

function restartGame(){
  Session.set("newGame", true);
  Session.set("selected",null);
}

function endGame(){
  console.log("HELOOOOOOO")
  Session.set("g",null);
  Session.set("selected",null);
  Session.set("runSimulations",false);
}

function getMinMax(playerId){
  return parseInt($("#minmax"+playerId).val());
}


/******************
GAME SELECT UI
*******************/

Template.body.events({
  'click #changeGame' : endGame,
  'click #restartGame':restartGame
});

Template.body.showGame = function(){
  return Session.get("g");
}

Template.gameSelect.events({
  'click #startBtn' : startGame,

  'click #player0 .btn':function(){
    Session.set("type0",this.id);
  },

  'click #player1 .btn':function(){
    Session.set("type1",this.id);
  },

  'click #yesBtn' : function(){
    Session.set("runSimulations", true);
  },
  'click #noBtn' : function(){
    Session.set("runSimulations", false);
  }
});

Template.gameSelect.playerTypes = function(){
  return playerTypes;
}

Template.gameSelect.players = function(){
  return [{id:0, name:1},{id:1, name:2}];
}

Template.gameSelect.isActive = function(player){
  return Session.get("type"+player.id) == this.id ? "btn-success active" : "btn-primary";
}

Template.gameSelect.showVS = function(){
  return this.id ==0;
}

Template.gameSelect.showMinMax = function(){
  return Session.get("type"+this.id) == 4;
}

Template.gameSelect.showMultiple = function(){
  return Session.get("type0") > 1 && Session.get("type1") > 1;
}