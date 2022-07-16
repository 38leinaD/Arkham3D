var Wall = (function() {
	return Class.extend({
		init: function(xStart, yStart, xEnd, yEnd, textureRegion) {
			this.xStart = xStart;
			this.yStart = yStart;
			this.xEnd = xEnd;
			this.yEnd = yEnd;
			
			this.textureRegion = textureRegion;

			this.normal = vec3.fromValues(yEnd - yStart, xStart - xEnd, 0.0);
			vec3.normalize(this.normal,this.normal);

			// Raycaster Attachement
			this.rc = {
				visible: false
			};				
		},

		putVertexData: function(vb) {
			var uvs = this.textureRegion.uvs;

	       	vb.addData([ this.xStart,  this.yStart,  0.0,   this.normal[0], this.normal[1], this.normal[2],   	uvs.u1, uvs.v1]);
	        vb.addData([ this.xEnd, this.yEnd,  0.0,       	this.normal[0], this.normal[1], this.normal[2],	uvs.u2, uvs.v1]);
	        vb.addData([ this.xStart, this.yStart,  1.0,    this.normal[0], this.normal[1], this.normal[2],   	uvs.u1, uvs.v2]);

	        vb.addData([ this.xStart, this.yStart,  1.0,    this.normal[0], this.normal[1], this.normal[2],   	uvs.u1, uvs.v2]);
	        vb.addData([ this.xEnd, this.yEnd,  0.0,        this.normal[0], this.normal[1], this.normal[2],	uvs.u2, uvs.v1]);
	        vb.addData([ this.xEnd, this.yEnd,  1.0,        this.normal[0], this.normal[1], this.normal[2],	uvs.u2, uvs.v2]);
	        
		}
	});
})();