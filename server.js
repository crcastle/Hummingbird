require.paths.unshift(__dirname + '/lib');
require.paths.unshift(__dirname);

var http = require('http'),
  weekly = require('weekly'),
  fs = require('fs'),
  static = require('deps/node-static/lib/node-static'),
  router = require('node-router')
  io = require('deps/node-socket.io'),
  mongo = require('deps/node-mongodb-native/lib/mongodb'),
  Hummingbird = require('hummingbird').Hummingbird;
  Aggregator = require('aggregator').Aggregator;

// read in config info from app.json
try {
  var configJSON = fs.readFileSync(__dirname + "/config/app.json");
} catch(e) {
  console.log("File config/app.json not found.  Try: `cp config/app.json.sample config/app.json`");
}
var config = JSON.parse(configJSON.toString());

// create or get instance of mongdb
db = new mongo.Db('hummingbird', new mongo.Server(config.mongo_host, config.mongo_port, {}), {});

db.addListener("error", function(error) {
  console.log("Error connecting to mongo -- perhaps it isn't running?");
});

// create hummingbird object for real time data display
db.open(function(p_db) {
  var hummingbird = new Hummingbird();
  hummingbird.init(db, function() {
    var server = http.createServer(function(req, res) {
      try {
        hummingbird.serveRequest(req, res);
      } catch(e) {
        hummingbird.handleError(req, res, e);
      }
    });
    server.listen(config.tracking_port, "0.0.0.0");

    socket = io.listen(server);

    socket.on('connection', function(client){
      // new client is here!
      client.on('disconnect', function(){ console.log("Lost ws client"); })
    });

    hummingbird.socket = socket;
    hummingbird.addAllMetrics(socket, db);

    console.log('Web Socket server running at ws://*:' + config.tracking_port);
  });

  console.log('Tracking server running at http://*:' + config.tracking_port + '/tracking_pixel.gif');
});

// create web server to serve static HTML from public folder
if(config.enable_dashboard) {
  var file = new(static.Server)('./public');

  var dashboard_server = http.createServer(function (request, response) {
    request.addListener('end', function () {
      file.serve(request, response);
    });
  })

  dashboard_server.listen(config.dashboard_port);

  // initialize aggregator to listen to same port as static server
  var aggregator = new Aggregator();
  aggregator.init(db, function() {
	aggregator_socket = io.listen(dashboard_server);
	aggregator_socket.on('connection', function(client){
		console.log("Aggregator client connected");
		client.on('disconnect', function(){ console.log("Lost aggregator client"); });
		client.on('message', function(data) { aggregator.receiveRequest(data, this); });
	});
  });

  console.log('Dashboard server running at http://*:' + config.dashboard_port);
}