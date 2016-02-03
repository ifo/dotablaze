var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var jade = require('jade');
var r = require('rethinkdb');

// get assets file
var index = jade.compileFile('assets/index.jade');
var indexjs = fs.readFileSync(__dirname + '/assets/index.js')
var indexhbs = fs.readFileSync(__dirname + '/assets/index.hbs');

// allow no database initial setup testing
var hasDatabase = process.argv.indexOf('nd') === -1;

// setup database connection
if (hasDatabase) {
  var conn;
  r.connect({host: 'localhost', port: 28015}, function(err, connection) {
    if (err) throw err;
    conn = connection;
  });
}

app.listen(3000);

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
  socket.emit('games', testData);
  if (hasDatabase) {
    r.table('games').changes().pluck('new_val').run(conn, function(err, cursor) {
      cursor.each(function(err, data) {
        socket.emit('games', data);
      });
    });
  }
});

// TODO remove test data
var testData = {'games': [
  {
    'scoreboard': {
      'duration': 500.12345,
      'radiant': {'tower_state': 2048},
      'dire': {'tower_state': 2048}
    }
  },
  {
    'scoreboard': {
      'duration': 1500.12345,
      'radiant': {'tower_state': 2000},
      'dire': {'tower_state': 2000}
    }
  }
]};
