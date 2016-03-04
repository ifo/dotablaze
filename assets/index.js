window.onload = function() {
  "use strict";

  var gamesTemplateSource = document.getElementById('games-template').innerHTML;
  var gamesTemplate = Handlebars.compile(gamesTemplateSource);
  var gamesElement = document.getElementById('games');
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
    gamesElement.innerHTML = gamesTemplate({games: games});
  });
}
