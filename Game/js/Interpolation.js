var Interpolation = (function() {

	function smoothStep(x) {
		return ((x) * (x) * (3 - 2 * (x)));
	}
	return Class.extend({
		init: function(type, start, end, duration, onComplete) {
			this.ticker = 0;
			this.duration = duration;
			this.start = start;
			this.end = end;
			this.onComplete = onComplete;
			this.onCompleteCalled = false;
		},

		tick: function() {
			if (this.ticker < this.duration) {
				this.ticker ++;
			}
			else if (!this.onCompleteCalled) {
				this.onCompleteCalled = true;
				if (this.onComplete !== undefined) {
					this.onComplete();
				}
			}

			var v = this.ticker / this.duration;
		  	var v = smoothStep(v);
			return (this.end * v) + (this.start * (1.0 - v));
		},

		getValue: function() {
						var v = this.ticker / this.duration;
		  	var v = smoothStep(v);
			return (this.end * v) + (this.start * (1.0 - v));
		},

		reset: function() {			
			this.ticker = 0;
			this.onCompleteCalled = false;
		},

		isFinished: function() {
			return this.onCompleteCalled && this.ticker >= this.duration;
		}
	});
})();