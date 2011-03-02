var http        = require('http'),
    sys         = require('sys'),
    // npm  
    static      = require('node-static'),
    ws          = require('websocket-server');

// config
var fileServer  = new static.Server('./public')
    port        = parseInt(process.env.PORT) || 8888,
    debug       = true,
    rebroadcast = (process.ARGV[2] === '-r' || process.ARGV[2] === '-rebroadcast'),
    connections = {
      count: 0
    };

/**
 * Server
 */
var server = ws.createServer({ debug: true }, http.createServer());

server.on("listening", function() {
  console.log('Server listening on port :' + port);
  console.log("Listening for web socket connections on port :" + port);
  if (rebroadcast) {
    console.log('Rebroadcasting enabled');  }
});

server.on('request', function(request, response) {
  request.on('end', function() {
    //if (debug) console.dir(request);
    fileServer.serve(request, response);
  });
}).listen(port);

server.on('connection', function(connection) {
  console.log(connection.id + ' connected');
  connections[connection.id] = { messages: []};
  connections.count++;
  console.log(connections.length);
  server.send(connection.id, JSON.stringify({ action: 'welcome'}));
  server.broadcast(Date.now() + ' ' + connections.count + ' connections');

  connection.on('message', function(message) {
    connections[connection.id].messages.push(message);
    try {
      var msg = JSON.parse(message);
      if (msg.type === 'click') {
        msg.type = 'confirm';
        server.send(connection.id, JSON.stringify(msg));
        if (rebroadcast) {
          msg.type = 'rebroadcast';  
          server.broadcast(JSON.stringify(msg));
        }
      }
    } catch (e) {}
  });
});

server.on('close', function(connection) {
  console.log(connection.id + ' closed');
  delete connections[connection.id];
  connections.count--;
  console.log(connections.length)
});
