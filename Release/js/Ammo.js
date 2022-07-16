var Ammo = (function() {

	return Entity.extend({
		init: function(world, x, y, name) {
			this._super(world, x, y, 0.15, 0.4, 0.3);


			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(0, 57, 10, 7).uvs
			];

			this.name = "Ammo";
			this.power = 10;
		},

		tick: function() {
			if (this.residentTile === G.player.tile) {
				var pistol = G.player.getWeapon('pistol');
				if (pistol !== null) {
					pistol.shots += this.power;
				}
				else {
					var pis = {name: "pistol", shots: 10, attackDelay: 30};
					G.player.weapons.push(pis);
					G.player.selectedWeaponIdx++;
				}
				G.audioManager.playSound('pick_up_pistol.ogg');
				this.world.removeEntity(this);
			}
		}
	});
})();