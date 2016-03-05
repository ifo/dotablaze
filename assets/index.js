window.onload = function() {
  "use strict";

  var tournamentTemplateSource = document.getElementById('tournament-template').innerHTML;
  var tournamentTemplate = Handlebars.compile(tournamentTemplateSource);
  var teamTemplateSource = document.getElementById('team-template').innerHTML;
  var teamTemplate = Handlebars.compile(teamTemplateSource);
  Handlebars.registerPartial('team', teamTemplate);
  var tournamentElements = document.getElementsByClassName('games');
  var games = [];

  function mergeInGame(update) {
    var i = _.findIndex(games, function(g) {
      return g.match_id === update.match_id;
    });
    if (i === -1) {
      games.push(update);
    } else {
      _.merge(games[i], update);
    }
  }

  socket.on('games', function (data) {
    mergeInGame(data);
    tournamentElements[0].innerHTML = tournamentTemplate({games: games});
  });

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
}
