var AllViewsMetric = {
  name: 'all_views',
  initialData: {total: 0, cartAdds: 0, pvs: 0, clicks: 0, videostarts: 0},
  interval: 50, // ms
  incrementCallback: function(view) {
    this.data.total += 1;
    this.minuteData.total = (this.minuteData.total || 0) + 1;

    if(view.event() && view.event() === "cart_add") {
      this.data.cartAdds += 1;
      this.minuteData.cartAdds = (this.minuteData.cartAdds || 0) + 1;
    }

	// chris added the 3 event types below
	if(view.event() && view.event() === "pv") {
		this.data.pvs += 1;
	}
	if(view.event() && view.event() === "click") {
		this.data.clicks += 1;
	}
	if(view.event() && view.event() === "videostart") {
		this.data.videostarts += 1;
	}
  }
};

for (var i in AllViewsMetric)
  exports[i] = AllViewsMetric[i];