var sys = require('sys');

var View = function(env) {
  if(!this instanceof View) {
    return new View(env);
  }

  this.env = env;

}

// this is used to mark a tracking request (i.e. View) as
// cart add or a purchase.
// cart_add or purchase are determined by the "event" query string variable
View.prototype = {
  event: function() {
    if(this.env.events) {
      if(this.env.events.match(/scAdd/)) {
        this._event = "cart_add";
      } else if(this.env.events === "purchase") {
        this._event = "purchase";
      }
    }

	if(this.env.ext4) {
		if(this.env.ext4 === "view") {
			this._event = "pv";
		} else if(this.env.ext4 === "click") {
			this._event = "click";
		} else if(this.env.ext4 === "videostart") {
			this._event = "videostart";
		}
	}

    this.event = function() { return this._event; }
    return this._event;
  }
};

exports.View = View;
