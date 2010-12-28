var sys = require('sys'),
	mongo = require('deps/node-mongodb-native/lib/mongodb');

var Aggregator = function(){
	if(!this instanceof Aggregator) {
		return new Aggregator();
	}
};

Aggregator.prototype = {
	// initialize the Aggregator object
	init: function(db, callback) {
		this.setupDb(db, function() {
			callback();
		});
	},
	
	// create the visits collection if it doens't already exist
	setupDb: function(db, callback) {
		var self = this;
    	db.createCollection('visits', function(err, collection) {
      		db.collection('visits', function(err, collection) {
        		self.collection = collection;
        		callback();
      		});
    	});
  	},

	// receive client request and run the map/reduce query
	// TODO: handle error parsing JSON string better. currently it fails silently.
	receiveRequest: function(data, client) {
		if(!data) return; // just return if we got null data
				
		var request = {};
		try {
			// convert JSON string into Object
			request = JSON.parse(data);
		} catch(e) {
			console.log("Bad request received from client.");
			console.log("Error message: " + e.message);
			return;
			// maybe handle this error better by sending an error message back to the client?
		}
		
		// send the request object to the map/reduce function
		this.runQuery(request, function(result) {
			// when map/reduce is done, send the data to the requesting client
			client.send(JSON.stringify(result));
		});
	},

	// map the client's requested measure to its name in the DB
	// TODO: this depends on known actionname values (i.e. not flexible)
	mapMeasure: function(measure) {
		switch(measure) {
			case "Actions":
				return /.*/; // wildcard regex
			case "Page Views":
				return "view";
			case "Clicks":
				return "click";
			case "Video Starts":
				return "videostart";
		}
	},
	
	// given some parameters, return a series over time configuration object
	// for a Highcharts chart.
	// client will use this to generate a chart
	// TODO: make chart xAxis labels based on aggregation level (e.g. by minute, by hour, etc)
	// TODO: fix problem with "by minute" not showing any data
	createChartOverTime: function(data, dataName, yAxisTitle, chartTitle, startDate, endDate) {
		var dataArray = [];
		for(var i=0; i < data.length; i++) {
			dataArray[i] = [Date.parse(data[i]._id.date), data[i].value.recs];
		}
		chart = new Object({
	         chart: {
	            renderTo: 'chart-container-1',
				defaultSeriesType: 'column'
	         },
	         title: {
	            text: chartTitle // 'Actions'
	         },
			 xAxis: {
				type: 'datetime',
				/*labels: {
					formatter: function() {
						return Highcharts.dateFormat('%a %d %b', this.value);
					}
				},*/
				tickInterval: 24 * 3600 * 1000
			 },
	         yAxis: {
	            title: {
	               text: yAxisTitle // 'count'
	            }
	         },
			 series: [{
				data: dataArray,
				name: dataName
			}]
	      });
		return chart;
	},
	
	// run map/reduce and send response to client
	runQuery: function(request, dataCallback) {
		
		// grab the details of the request
		var agg = request.aggregation;
		var measure = this.mapMeasure(request.measure);
		var startDate = new Date(request.startDate);
		var endDate = new Date(request.endDate);

		// define "map" function
		// TODO: this runs once for every record. is there a more efficient way to do this?
		var map = function() {
			// roll up timestamps depending on the aggregation requested
			this.timestamp.setMilliseconds(0);
			this.timestamp.setSeconds(0);
			if (agg == "Hour" || agg == "Day" || agg == "Month" || agg == "Year") this.timestamp.setMinutes(0);
			if (agg == "Day" || agg == "Month" || agg == "Year") this.timestamp.setHours(0);
			if (agg == "Month" || agg == "Year") this.timestamp.setDate(1);
			if (agg == "Year") this.timestamp.setMonth(0);
			emit (
				 { date: this.timestamp },
				 { recs: 1 }
				 );
		};
		// define the "reduce" function
		var reduce = function(key, vals) {
			var ret = { recs: 0 };
			for(var i = 0; i < vals.length; i++) {
				ret.recs += vals[i].recs;
			}
			return ret;			
		};

		// use self so that "this" can be used in the callback below
		var self = this;
		
		// run map/reduce, convert result to array, send to client
		var result = this.collection.mapReduce( map, reduce, { query: {ext4: measure, timestamp: {$lte: endDate, $gte: startDate} }, scope : { agg : agg }, verbose: true }, function(err, mrCollection) {
				mrCollection.find({}, { 'sort':[['timestamp', 1]] }, function(err, cursor) {
					cursor.toArray(function(err, items) {
						dataCallback(self.createChartOverTime(items, request.measure, "Count", request.measure + " by " + agg, startDate, endDate));
					});
				});
			}
		);		
	},
	
	// an unfinished attempt at handling errors and sending an alert to the client
	// TODO: use websocket instead of request/response (client.send("blah"))
	// TODO: update client to distinguish error from data and act appropriately
	handleError: function(req, res, e) {
    	res.writeHead(500, {});
    	res.write("Server error");
    	res.close();

    	e.stack = e.stack.split('\n');
    	e.url = req.url;
    	sys.log(JSON.stringify(e, null, 2));
	}
};

exports.Aggregator = Aggregator;