var Acolyte = (function() {

	return NPC.extend({
		init: function(world, x, y) {
			this._super(world, x, y, 0.45, 0.5, 0.9);

			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(0, 80, 8, 8).uvs,
				G.textureAtlas.getCustomTextureRegion(8, 80, 8, 8).uvs
			];

			this.blocking = true;

			this.attackDelay = 0;
			this.health = 5;

			this.name = "Acolyte";
		},

		tick: function() {
			this._super();
						this.animate = false;

			if (this.playerLastSeen >= 300) return;

			this.attackDelay--;

			var d = distance(this.x, this.y, G.player.x, G.player.y);

			if (d <= this.radius + G.player.radius + 2.0) {
				this.moveBackward();
							this.animate = true;

			}
			else if (d > this.radius + G.player.radius + 3.0) {
				this.moveForward();
							this.animate = true;

			}

			if (this.attackDelay <= 0) {
				var dir = vec3.fromValues(G.player.x - this.x, G.player.y - this.y, 0.0);
				vec3.normalize(dir, dir);
				this.world.addEntity(new Fireball(this.world, this.x, this.y, dir));
				this.attackDelay = 180;
				G.audioManager.playSound('acolyte_attack.ogg', audioLevelForDistance(G.player.x, G.player.y, this.x, this.y));
			}
		},

		hurt: function() {
			this._super();
			G.audioManager.playSound('acolyte_hit.ogg');
		}
	});
})();