"use strict";

var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var jade = require('jade');
var r = require('rethinkdb');

// get assets files
// TODO serve statically
var index = jade.compileFile(__dirname + '/assets/index.jade');
var indexjs = fs.readFileSync(__dirname + '/assets/index.js');
var indexhbs = fs.readFileSync(__dirname + '/assets/index.hbs');
var indexcss = fs.readFileSync(__dirname + '/assets/index.css');
var loadingSpinner = fs.readFileSync(__dirname + '/assets/ajax-loader.gif');

// load config
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

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
      res.end(index({
        host: [config.host, ':', config.port].join(''),
        gamesTemplate: indexhbs
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
