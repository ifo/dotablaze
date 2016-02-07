"use strict";

window.onload = function() {
  var gamesTemplateSource = document.getElementById('games-template').innerHTML;
  var gamesTemplate = Handlebars.compile(gamesTemplateSource);

  var games = document.getElementById('games');

  socket.on('games', function (data) {
    games.innerHTML = gamesTemplate(data);
  });
}
