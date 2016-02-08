"use strict";

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var jade = require('jade');
var r = require('rethinkdb');

// get assets file
var index = jade.compileFile('assets/index.jade');
var indexjs = fs.readFileSync(__dirname + '/assets/index.js');
var indexhbs = fs.readFileSync(__dirname + '/assets/index.hbs');

// TODO load config from a file
var config = {
  rethinkdb: {
    host: 'localhost',
    port: 28015,
  },
  table: 'test',
  port: 3000
};

// allow no database initial setup testing
var hasDatabase = process.argv.indexOf('nd') === -1;

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
      res.end(index({host: 'http://localhost:3000', gamesTemplate: indexhbs}));
      break;
    case '/index.js':
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end(indexjs);
      break;
    default:
      res.writeHead(404);
      res.end();
      break;
  }
}

io.on('connection', function (socket) {
  if (hasDatabase) {
    gamesQuery().run(conn, function(err, cursor) {
      if (err) {
        console.log(err);
      } else {
        cursor.each(function(err, game) {
          socket.emit('games', game.new_val);
        });
      }
    });
  }
});

function gamesQuery() {
  var pluckPredicate = {
    match_id: true,
    scoreboard: {
      duration: true,
      radiant: {tower_state: true},
      dire: {tower_state: true}
    }
  };
  return r.table(config.table).pluck(pluckPredicate).changes().pluck('new_val');
}
