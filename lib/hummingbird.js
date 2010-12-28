var sys = require('sys'),
  fs = require('fs'),
  View = require('view').View,
  Metric = require('metric').Metric,
  Aggregates = require('aggregates').Aggregates,
  Buffer = require('buffer').Buffer,
  io = require('deps/node-socket.io'),
  arrays = require('deps/arrays'),
  querystring = require('querystring'),
  cookie = require('cookie-node');

try {
  var configJSON = fs.readFileSync(__dirname + "/../config/app.json");
} catch(e) {
  sys.log("File config/app.json not found.  Try: `cp config/app.json.sample config/app.json`");
}
var config = JSON.parse(configJSON.toString());

var Hummingbird = function(db, callback) {
  var pixelData = fs.readFileSync(__dirname + "/../images/tracking.gif", 'binary');
  this.pixel = new Buffer(43);
  this.pixel.write(pixelData, 'binary', 0);

  this.metrics = [];
};

Hummingbird.prototype = {
  init: function(db, callback) {
    this.setupDb(db, function() {
      callback();
    });
  },

  setupDb: function(db, callback) {
    var self = this;
    db.createCollection('visits', function(err, collection) {
      db.collection('visits', function(err, collection) {
        self.collection = collection;
        callback();
      });
    });
  },

  addAllMetrics: function(socket, db) {
    var self = this;

    Metric.allMetrics(function(metric) {
      metric.init(db);
      metric.socket = socket;
      self.metrics.push(metric);
    });
  },

  serveRequest: function(req, res) {
	var cookieId = this.getOrSetCookie(req, res)
    this.writePixel(res);

    var env = this.splitQuery(req.url.split('?')[1]);
    env.timestamp = new Date();
	env.cookieId = cookieId;
    // sys.log(JSON.stringify(env, null, 2));

	// add the requestor ip address as a property
    env.ip = req.connection.remoteAddress;

	// create an object of type View
    var view = new View(env);

	// these two are set as null now because the following query string parameters are not defined
	// u, the URL of the page the pixel is on
	// product_id is some sort of Gilt specific product id in the query string
    env.url_key = view.urlKey;
    env.product_id = view.productId;

	// insert the associative array "env" into the visits collection
	// this effectively records a single tracking request
    this.collection.insertAll([env]);

	// for each metric (in the metrics folder) call the "incrementCallback" function
	// and provide it the "view" object
	// guessing that isDirty means that the metrics are in a state of update meaning
	// reading from the metrics collection might return inaccurate data
    for(var i = 0; i < this.metrics.length; i++) {
      this.metrics[i].incrementCallback(view);
      this.metrics[i].isDirty = true;
    }
  },

  // return associative array with query string name values
  splitQuery: function(query) {
    var queryString = {};
    (query || "").replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) { queryString[$1] = querystring.unescape($3.replace(/\+/g, ' ')); }
    );

    return queryString;
  },

  writePixel: function(res) {
    res.writeHead(200, { 'Content-Type': 'image/gif',
                         'Content-Disposition': 'inline',
                         'Content-Length': '43',
						 'Set-Cookie': 'abc=yo! joe!'});
    res.end(this.pixel);
  },

  getOrSetCookie: function(req, res) {
	var cookieName = "vnc";
	var c = req.getCookie( cookieName );
	var cookieValue = null;
	
	if (c) {
		cookieValue = c;
	} else {
		date = new Date().getTime(); // milliseconds since 1/1/1970
		random = Math.random().toString().slice(2,7); // random 5 digit number
		cookieValue = date + "-" + random;
	}
	
	res.setCookie( cookieName, cookieValue , {"expires": "June 4, 2020 11:59:59"});
	return cookieValue;
  },

  handleError: function(req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.close();

    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  }
};

exports.Hummingbird = Hummingbird;
