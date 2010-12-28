// globally accessible
var chart = null;
var chartOptions = new Object();

// initialize date pickers
$(function() {
	var dates = $( "#from, #to" ).datepicker({
		defaultDate: "-1m",
		changeMonth: true,
		numberOfMonths: 2,
		onSelect: function( selectedDate ) {
			var option = this.id == "from" ? "minDate" : "maxDate",
				instance = $( this ).data( "datepicker" );
				date = $.datepicker.parseDate(
					instance.settings.dateFormat ||
					$.datepicker._defaults.dateFormat,
					selectedDate, instance.settings );
			dates.not( this ).datepicker( "option", option, date );
			//dates.not( this ).datepicker( "show" );
			
			chartOptions.startDate = new Date($("#from").datepicker("getDate"));
			chartOptions.endDate = new Date($("#to").datepicker("getDate"));
		}
	});
});

$(function() {
	// initialize measure picker
	$( "#measure" ).selectable({
		selected: function() {
			var result = $( "#measure .ui-selected").text();
			chartOptions.measure = result;
		}
	});
	// initialize aggregation picker
	$( "#aggregation" ).selectable({
		selected: function() {
			result = $( "#aggregation .ui-selected").text();
			chartOptions.aggregation = result;
		}
	});
});

// initialize Redraw button
$(function() {
	$( "button" ).button();
	$( "button" ).click(function() {
		
		// check if inputs are (mostly) valid
		if (!chartOptions.startDate instanceof Date) return;
		if (!chartOptions.endDate instanceof Date) return;
		if (!chartOptions.measure instanceof String) return;
		if (!chartOptions.aggregation instanceof String) return;

		if (chart) chart.showLoading();
		sendRequest($.toJSON(chartOptions));
	});
});

// initialize web socket
var socket = new io.Socket()
socket.on('connect', function() {
	// websocket connected
});
socket.on('message', function(JSONdata) {
	data = $.parseJSON(JSONdata);
	receiveData(data);
});
socket.on('disconnect', function() {
	// websocket disconnected
});
socket.connect();

// send request details to server
function sendRequest(requestString) {
	socket.send(requestString);
}

// create a new chart with received chart data
function receiveData(returnedChart) {
	Highcharts.setOptions({
		global: {
			useUTC: false
		}
	})
	
	if (chart) { chart.destroy(); }
	chart = new Highcharts.Chart(returnedChart);
}
