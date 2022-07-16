var Fireball = (function() {

	return Entity.extend({
		init: function(world, x, y, dir) {
			this._super(world, x, y, 0.5, 0.2, 0.2);
			this.dir = dir;
			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(17, 82, 4, 4).uvs,
				G.textureAtlas.getCustomTextureRegion(22, 82, 4, 4).uvs
			];

			this.blocking = false;
		},

		tick: function() {
			this._super();

			this.x += this.dir[0] * 0.03;
			this.y += this.dir[1] * 0.03;
			this.z += this.dir[2] * 0.03;

			this.rx = this.x;
			this.ry = this.y;
			this.rz = this.z;

			this.updateResidency();

			var d = distance(this.x, this.y, G.player.x, G.player.y);

			if (d <= G.player.radius) {
				G.player.hurt();
				this.world.removeEntity(this);
			}

			var t = this.world.getTile(Math.floor(this.x), Math.floor(this.y));
			if (t == null || t.blocking) {
				this.world.removeEntity(this);
			}
		}
	});
})();