var Health = (function() {

	return Entity.extend({
		init: function(world, x, y, name) {
			this._super(world, x, y, 0.15, 0.4, 0.3);


			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(40, 48, 8, 8).uvs
			];

			this.name = "Health";
			this.power = 1;
		},

		tick: function() {
			if (this.residentTile === G.player.tile && G.player.health < 4) {
				this.world.removeEntity(this);
				G.player.health += this.power;
				G.audioManager.playSound('pick_up_health.ogg');
			}
		}
	});
})();