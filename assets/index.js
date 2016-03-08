window.onload = function() {
  "use strict";

  var tournamentTemplateSource = document.getElementById('tournament-template').innerHTML;
  var teamTemplateSource = document.getElementById('team-template').innerHTML;
  var socketSource = document.getElementById('socket-source').innerHTML;
  var tournamentElements = document.getElementsByClassName('games');

  var tournamentTemplate = Handlebars.compile(tournamentTemplateSource);
  var teamTemplate = Handlebars.compile(teamTemplateSource);
  var socket = io(socketSource);

  var games = {};

  // setup handlebars
  Handlebars.registerPartial('team', teamTemplate);

  Handlebars.registerHelper("printTimer", function(time) {
    if (!time) {
      return "0:00";
    }
    var seconds = Math.floor(time) % 60;
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    var minutes = Math.floor(time / 60);
    return `${minutes}:${seconds}`;
  });

  // setup socket.io
  socket.on('load', function(startingGames) {
    games = startingGames;
    updateDisplay(games);
  });

  socket.on('game', function (game) {
    games = updateGame(game, games);
    updateDisplay(games);
  });

  function updateGame(game, games) {
    games[game.match_id] = _.merge(games[game.match_id], game);
    return games;
  }

  function updateDisplay(games) {
    tournamentElements[0].innerHTML = tournamentTemplate({games: games});
  }
}
