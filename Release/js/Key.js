var Key = (function() {

	return Entity.extend({
		init: function(world, x, y, name) {
			this._super(world, x, y, 0.2, 0.4, 0.4);

			var uvs;
			if (name === "red") {
				uvs = G.textureAtlas.getCustomTextureRegion(24, 48, 8, 8).uvs;
			}
			else if (name === "blue") {
				uvs = G.textureAtlas.getCustomTextureRegion(32, 48, 8, 8).uvs;
			}
			else if (name === "gold") {
				uvs = G.textureAtlas.getCustomTextureRegion(0, 48, 8, 8).uvs;
			}

			this.uvs = [
				uvs
			];

			this.name = "Key " + name;
			this.keyId = name;
		},

		tick: function() {
			if (this.residentTile === G.player.tile) {
				this.world.removeEntity(this);
				G.player.keys.push(this);
				G.audioManager.playSound('pick_up_key.ogg');
			}
		}
	});
})();