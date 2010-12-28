HummingbirdTracker = {};

HummingbirdTracker.track = function(env) {
  delete env.trackingServer;
  delete env.trackingServerSecure;
  env.u = document.location.href;
  env.bw = window.innerWidth;
  env.bh = window.innerHeight;
  env.ext3 = "awesome video" // a string specifying the location or page name
  env.ext4 = "view" // a string specifying the user's action, like a page view
  env.ext5 = "videos" // a string specifying the section or a group that several pages roll-up to
  
  // the below 3 lines show how a cookie value could be captured
  // side note: a cookie can be set with each tracking pixel in the writePixel method
  //env.guid = document.cookie.match(/guid=([^\_]*)_([^;]*)/)[2];
  //env.gen = document.cookie.match(/gender=([^;]*);/)[1];
  //env.uid = document.cookie.match(/user_id=([^\_]*)_([^;]*)/)[2];

  // if there is a referring url, capture it
  if(document.referrer && document.referrer != "") {
    env.ref = document.referrer;
  }

  // make the tracking request.
  // the $ function assumes jQuery is being used
  $('body').append('<img src="http://localhost:8000/tracking.gif?' + jQuery.param(env) + '"/>');
};
