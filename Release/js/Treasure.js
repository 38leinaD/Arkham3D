var Treasure = (function() {

	return Entity.extend({
		init: function(world, x, y, type) {
			this._super(world, x, y, 0.3, 0.4, 0.6);

			var index;
			this.fullName;
			if (type === 'skull') {
				index = 0;
				this.fullName = 'Christal Skull';
			}
			else if (type === 'gold') {
				index = 1;
				this.fullName = 'David\'s Treasure';
			}
			else if (type === 'goblet') {
				index = 2;
				this.fullName = 'Last Supper Goblet';
			}
			else if (type === 'cross') {
				index = 3;
				this.fullName = 'Holy Cross';
			}
			else if (type === 'spear') {
				index = 4;
				this.fullName = 'Spear of Destiny';
			}
			else if (type === 'medal') {
				index = 5;
				this.fullName = 'Medal of Eternity';
			}
			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(57 + 9 * index, 65, 8, 8).uvs
			];

			this.name = "Treasure " + type;
			this.type = type;
		},

		tick: function() {
			if (this.residentTile === G.player.tile) {
				this.world.removeEntity(this);
				G.player.treasures.push(this);
				G.player.treasureTicker = 90;
				G.audioManager.playSound('pick_up_treasure.ogg');

				if (G.player.treasures.length === 6) this.world.won();
			}
		}
	});
})();