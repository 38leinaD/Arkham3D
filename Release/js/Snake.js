var Snake = (function() {

	return NPC.extend({
		init: function(world, x, y) {
			this._super(world, x, y, 0.25, 0.5, 0.5);

			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(0, 64, 8, 8).uvs,
				G.textureAtlas.getCustomTextureRegion(8, 64, 8, 8).uvs
			];

			this.blocking = false;

			this.attackDelay = 0;

			this.radius = 0.18;
			this.health = 2;

			this.vz = 0.0;
			this.name = "Snake";
		},

		tick: function() {
			this._super();
			this.animate = false;

			if (this.playerLastSeen >= 180) return;
			this.animate = true;
			this.vz -= 0.004;
			
			this.moveForward();

			if (this.z - this.h/2.0 + this.vz >= 0.0) {
				this.z += this.vz;
				this.moveForward();
			}
			else {
				this.z = this.h/2.0;
			}

			this.attackDelay--;


			var d = distance(this.x, this.y, G.player.x, G.player.y);
			if (this.z - this.h/2.0 <= 0.0 && d > this.radius + G.player.radius + 0.8 && d <= this.radius + G.player.radius + 1.0) {
				this.vz = 0.07;
				G.audioManager.playSound('snake_jump.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))

			}
			else if (this.attackDelay <= 0 && d <= this.radius + G.player.radius + 0.01) {
				G.player.hurt();
				this.attackDelay = 60;
				G.audioManager.playSound('snake_attack.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))
			}
		},

		hurt: function() {
			this._super();
			G.audioManager.playSound('snake_hit.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y))
		}
	});
})();