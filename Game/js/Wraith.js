var Wraith = (function() {

	return NPC.extend({
		init: function(world, x, y) {
			this._super(world, x, y, 0.45, 0.5, 0.9);

			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(0, 72, 8, 8).uvs,
				G.textureAtlas.getCustomTextureRegion(8, 72, 8, 8).uvs
			];

			this.frameDuration = 25;
			this.blocking = true;

			this.attackDelay = 0;
			this.health = 3;
			this.speed = 0.023;
			this.name = "Wraith";
		},

		tick: function() {
			this._super();
			if (this.playerLastSeen >= 300) return;
			if (this.playerJustSeen) {
				G.audioManager.playSound('wraith_appear.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))
			}

			this.moveForward();
			
			this.rx = this.x + 0.01 * Math.sin(this.ticker/50.0 * 2 * Math.PI);
			this.ry = this.y + 0.01 * Math.cos(this.ticker/50.0 * 2 * Math.PI);
			this.rz = this.z + 0.01 * Math.cos(this.ticker/50.0 * 2 * Math.PI);

			this.attackDelay--;

			var d = distance(this.x, this.y, G.player.x, G.player.y);
			if (this.attackDelay <= 0 && d <= this.radius + G.player.radius + 0.01) {
				G.player.hurt();
				this.attackDelay = 60;
			}
		},

		hurt: function() {
			this._super();
			G.audioManager.playSound('wraith_hit.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))
		}
	});
})();