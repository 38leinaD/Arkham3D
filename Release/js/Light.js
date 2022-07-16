var Light = (function() {

	return Class.extend({
		init: function(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
		},

        getIntensity: function() {
            return 1.0;
        }
	});
})();