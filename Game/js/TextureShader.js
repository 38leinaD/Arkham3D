var TextureShader = (function() {

	return ShaderProgram.extend({
		init: function(vertexShaderId, fragementShaderId, uniforms, attributes) {
			this._super('tex-vs', 'tex-fs', ['uPMatrix', 'uMVMatrix', 'uTex', 'uColor'], ['aVertexPosition', 'aTextureCoord']);
	        this.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);
	    }	  
	});
})();