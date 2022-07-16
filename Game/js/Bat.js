var Bat = (function() {

	return NPC.extend({
		init: function(world, x, y) {
			this._super(world, x, y, 0.55, 0.3, 0.25);

			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(0, 88, 11, 8).uvs,
				G.textureAtlas.getCustomTextureRegion(11, 88, 11, 8).uvs
			];

			this.frameDuration = 15;
			this.blocking = false;
			this.attackDelay = 0;
			this.radius = 0.15;
			this.health = 1;
			this.name = "Bat";
		},

		tick: function() {
			this._super();
			if (this.playerLastSeen >= 500) return;

			this.moveForward();
			
			this.rx = this.x + 0.01 * Math.sin(this.ticker/50.0 * 2 * Math.PI);
			this.ry = this.y + 0.01 * Math.cos(this.ticker/50.0 * 2 * Math.PI);
			this.rz = this.z + 0.01 * Math.cos(this.ticker/50.0 * 2 * Math.PI);

			this.attackDelay--;
			if (this.attackDelay <= 0 && distance(this.x, this.y, G.player.x, G.player.y) <= this.radius + G.player.radius + 0.01) {
				G.player.hurt();
				this.attackDelay = 60;
				G.audioManager.playSound('bat_attack.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))
			}
		},

		hurt: function() {
			this._super();
			G.audioManager.playSound('bat_hit.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))
		}
	});
})();