
function RandomNumberGenerator (seed){
	if (seed === undefined) {
		var d = new Date();
		this.seed = 2345678901 + (d.getSeconds() * 0xFFFFFF) + (d.getMinutes() * 0xFFFF);
	}
	else {
		this.seed = seed;
	}
	this.A = 48271;
	this.M = 2147483647;
	this.Q = this.M / this.A;
	this.R = this.M % this.A;
	this.oneOverM = 1.0 / this.M;

	this.next = function() {
		var hi = this.seed / this.Q;
		var lo = this.seed % this.Q;
		var test = this.A * lo - this.R * hi;
		if(test > 0){
			this.seed = test;
		} else {
			this.seed = test + this.M;
		}
		return (this.seed * this.oneOverM);
	}
}

var RNG = null;

importScripts('lib/resig.js');
importScripts('WorldGenerator.js');



self.addEventListener('message', function(e) {
	try {
	  	var worldConfig = JSON.parse(e.data);
	  	var wrapper = {
	  		postMessage: function(msg) {
	  			var wrap = {
	  				type: "msg",
	  				data: msg
	  			}
	  			self.postMessage(JSON.stringify(wrap));
	  		}
	  	}

		var generator = new WorldGenerator(wrapper);
		generator.generate(worldConfig);
		var world = generator.export(worldConfig.template);

		var msg = {
			"type": "result",
			"data": world
		}

		self.postMessage(JSON.stringify(msg));
	}
	catch (err) {
			self.postMessage(JSON.stringify({"type": "error", "msg": err.message}));
	}

}, false);


