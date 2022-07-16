var NPC = (function() {

	return Entity.extend({
		init: function(world, x, y, z, w, h) {
			this._super(world, x, y, z, w, h);
			this.playerLastSeen = 10000000;
			this.playerJustSeen = false;
		},

		tick: function() {
			this._super();
			var pVis = this.playerVisible();
			if (this.playerLastSeen >= 60 && pVis) {
				this.playerJustSeen = true;
			}
			else {
				this.playerJustSeen = false;
			}
			this.playerLastSeen++;

			if (pVis) {
				this.playerLastSeen = 0;
			}
		},

		playerVisible: function() {
			var angle = atan2(G.player.y - this.y, G.player.x - this.x);
			var wallDistance = G.raycaster.wallDistance(this.world, this.x, this.y, angle);
			var playerDistance = Math.sqrt((this.x - G.player.x) * (this.x - G.player.x) + (this.y - G.player.y) * (this.y - G.player.y));
			var visible = false;
			
			if (playerDistance < 8.0 && playerDistance < wallDistance) {
				visible = true;
			}
			if (this === G.debugSelected) {
				G.debug1 = visible;
				G.debug2 = angle;
				G.debug2 = angle;

			}
			return visible;
		}


	});
})();