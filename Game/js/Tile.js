var Tile = (function() {
	return Class.extend({
		init: function(world, x, y, floorTextureRegion) {
			this.x = x;
			this.y = y;
			this.world = world;
			this.floorTextureRegion = floorTextureRegion;
			this.blocksVisibility = false;
			this.blocking = false;
			this.center = vec3.fromValues(x + 0.5, y + 0.5, 0.5);
			// Raycaster Attachement
			this.rc = {
				visible: false
			};				

			this.residentEntities = [];
		},

		putVertexData: function(vb) {

		},

		putFloorVertexData: function(vb) {
			if (this.floorTextureRegion === null) return;
            if (this.floorTextureRegion === undefined) {
                 console.log("lets see");   
            }
			var uvs = this.floorTextureRegion.uvs;

			vb.addData([ this.x,  this.y,  0.0,    0.0, 0.0, 1.0,  	uvs.u1, uvs.v1]);
	        vb.addData([ this.x + 1.0, this.y,  0.0,  0.0, 0.0, 1.0,     	uvs.u2, uvs.v1]);
	        vb.addData([ this.x, this.y + 1,  0.0,      0.0, 0.0, 1.0, 	uvs.u1, uvs.v2]);

	        vb.addData([ this.x, this.y + 1.0,  0.0,    0.0, 0.0, 1.0,   	uvs.u1, uvs.v2]);
	        vb.addData([ this.x + 1.0, this.y,  0.0,     0.0, 0.0, 1.0,   uvs.u2, uvs.v1]);
	        vb.addData([ this.x + 1.0, this.y + 1.0,  0.0,   0.0, 0.0, 1.0,     uvs.u2, uvs.v2]);

		}
	});
})();