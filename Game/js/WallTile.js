var WallTile = (function() {
	return Tile.extend({
		init: function(world, x, y, floorTextureRegion, wallTextureRegion) {
			this._super(world, x, y, floorTextureRegion);
			this.blocksVisibility = true;

			this.walls = new Array(4);
			this.walls[0] = new Wall(this.x + 1, this.y + 1, this.x, this.y + 1, wallTextureRegion); // North
			this.walls[1] = new Wall(this.x + 1, this.y, this.x + 1, this.y + 1, wallTextureRegion); // East
			this.walls[2] = new Wall(this.x, this.y, this.x + 1, this.y, wallTextureRegion); // South
			this.walls[3] = new Wall(this.x, this.y + 1, this.x, this.y, wallTextureRegion); // West

			this.blocking = true;

			// Raycaster Attachement
			this.rc = {
				visible: false
			};				
		},

		putVertexData: function(vb) {
			for (var i=0; i<this.walls.length; i++) {
				this.walls[i].putVertexData(vb);
			}
		}
	});
})();