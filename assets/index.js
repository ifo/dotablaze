window.onload = function() {
  "use strict";

  var tournamentTemplateSource = document.getElementById('tournament-template').innerHTML;
  var tournamentTemplate = Handlebars.compile(tournamentTemplateSource);
  var teamTemplateSource = document.getElementById('team-template').innerHTML;
  var teamTemplate = Handlebars.compile(teamTemplateSource);
  var tournamentElements = document.getElementsByClassName('games');
  var socketHost = document.getElementById('socket-host').innerHTML;
  var socket = io(socketHost);
  var games = [];

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
  socket.on('games', function (data) {
    games = mergeInGame(data, games);
    tournamentElements[0].innerHTML = tournamentTemplate({games: games});
  });

  function mergeInGame(update, games) {
    var i = _.findIndex(games, function(g) {
      return g.match_id === update.match_id;
    });
    if (i === -1) {
      games.push(update);
      return games;
    } else {
      _.merge(games[i], update);
      return games;
    }
  }
}
