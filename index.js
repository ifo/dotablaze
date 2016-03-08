"use strict";

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var jade = require('jade');
var r = require('rethinkdb');
var merge = require('lodash.merge');

// get assets files
// TODO serve statically
var index = jade.compileFile(__dirname + '/assets/index.jade');
var indexjs = fs.readFileSync(__dirname + '/assets/index.js');
var indexcss = fs.readFileSync(__dirname + '/assets/index.css');
var tournamenthbs = fs.readFileSync(__dirname + '/assets/handlebars/tournament.hbs');
var teamhbs = fs.readFileSync(__dirname + '/assets/handlebars/team.hbs');
var loadingSpinner = fs.readFileSync(__dirname + '/assets/ajax-loader.gif');

// load config
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

// allow no database initial setup testing
var hasDatabase = process.argv.indexOf('nd') === -1;

// make cache for quick game loading
var cache = {games: {}, timestamps: {}};

// setup database connection
if (hasDatabase) {
  var conn;
  r.connect(config.rethinkdb, function(err, connection) {
    if (err) throw err;
    conn = connection;
  });
}

app.listen(config.port);

function handler (req, res) {
  switch (req.url) {
    case '/':
      res.writeHead(200);
      res.end(index({
        host: [config.host, ':', config.port].join(''),
        tournamentTemplate: tournamenthbs,
        teamTemplate: teamhbs
      }));
      break;
    case '/index.js':
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(indexjs);
      break;
    case '/index.css':
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end(indexcss);
      break;
    case '/ajax-loader.gif':
      res.writeHead(200, {'Content-Type': 'image/gif'});
      res.end(loadingSpinner);
      break;
    default:
      res.writeHead(404);
      res.end();
      break;
  }
}

io.on('connection', function (socket) {
  if (hasDatabase) {
    if (Object.keys(cache.games).length !== 0) {
      socket.emit('load', cache.games);
    }
    gamesQuery().run(conn, function(err, cursor) {
      if (err) {
        console.log(err);
      } else {
        cursor.each(function(err, game) {
          cache.games = updateGame(game.new_val, cache.games);
          socket.emit('game', game.new_val);
          cache.timestamps = updateTimestamp(game.new_val.match_id, cache.timestamps);
        });
      }
    });
  } else {
    socket.emit('load', config.testGames);
  }
});

// every minute delete games that haven't been updated in the last 5 minutes
if (hasDatabase) {
  setInterval(function() {
    cache = cleanCache(cache, 5 * 60);
  }, 60 * 1000);
}

function gamesQuery() {
  var pluckPredicate = {
    match_id: true,
    scoreboard: {
      duration: true,
      radiant: {
        score: true,
        players: {
          hero_id: true
        }
      },
      dire: {
        score: true,
        players: {
          hero_id: true
        }
      }
    }
  };
  return r.table(config.table).pluck(pluckPredicate).changes().pluck('new_val');
}

function updateGame(game, games) {
  games[game.match_id] = merge(games[game.match_id], game);
  return games;
}

function removeGame(matchId, games) {
  delete games[matchId];
  return games;
}

function updateTimestamp(matchId, timestamps) {
  timestamps[matchId] = Math.floor(Date.now() / 1000);
  return timestamps;
}

// remove games and timestamps with timestamps older than maxAge seconds
function cleanCache(cache, maxAge) {
  var gamesToRemove = getOldGames(cache.timestamps, maxAge);
  gamesToRemove.forEach(function(matchId) {
    cache.games = removeGame(matchId, cache.games);
    delete cache.timestamps[matchId];
  });
  return cache;
}

function getOldGames(timestamps, maxAge) {
  var now = Math.floor(Date.now() / 1000);
  var oldTimes = [];
  Object.keys(timestamps).forEach(function(matchId) {
    if (timestamps[matchId] + maxAge < now) {
      oldTimes.push(matchId);
    }
  });
  return oldTimes;
}
