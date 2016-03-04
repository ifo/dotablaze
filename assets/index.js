window.onload = function() {
  "use strict";

  var gamesTemplateSource = document.getElementById('games-template').innerHTML;
  var gamesTemplate = Handlebars.compile(gamesTemplateSource);
  var gamesElements = document.getElementsByClassName('games');
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
    gamesElements[0].innerHTML = gamesTemplate({games: games});
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
