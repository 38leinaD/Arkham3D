var HedgeTile = (function() {
	return Tile.extend({
		init: function(world, x, y, floorTextureRegion, wallTextureRegions) {
			this._super(world, x, y, floorTextureRegion);
			this.blocksVisibility = false;
			this.blocking = true;
			this.walls = new Array(4);
			this.walls[0] = new Wall(this.x + 1.0, this.y + 0.8, this.x, this.y + 0.8, wallTextureRegions[0]); // North
			this.walls[1] = new Wall(this.x + 0.8, this.y, this.x + 0.8, this.y + 1.0, wallTextureRegions[1]); // East
			this.walls[2] = new Wall(this.x, this.y + 0.2, this.x + 1.0, this.y + 0.2, wallTextureRegions[2]); // South
			this.walls[3] = new Wall(this.x + 0.2, this.y + 1.0, this.x + 0.2, this.y, wallTextureRegions[0]); // West

			// Raycaster Attachement
			this.rc = {
				visible: false
			};				

			this.health = 4;
		},

		putVertexData: function(vb) {
			for (var i=0; i<this.walls.length; i++) {
				this.walls[i].putVertexData(vb);
			}
		},

		putFloorVertexData: function(vb) {
			this._super(vb);
		}
	});
})();