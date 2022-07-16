var SkyLayer = (function() {

	return Class.extend({
		init: function(scene) {
            this.scene = scene;

            this.mvMatrix = mat4.create();
            this.pMatrix = mat4.create();

            this.texVB = G.texVB;
            this.texShader = G.texShader;

		},

		tick: function() {

		},

		render: function() {
                  gl.viewport(0, 0, 512.0, 512.0 * (gl.viewportHeight/gl.viewportWidth));

                  var ratio = (gl.viewportHeight/gl.viewportWidth);

                  mat4.ortho(this.pMatrix, 0.0, 1, 0.0, 1.0, -10.0, 10.0);
                  mat4.identity(this.mvMatrix);
              
                  G.textureAtlas.texture.bind();

                  this.texShader.use();

                  this.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
                  this.texShader.setUniformMatrix('uPMatrix', this.pMatrix);
                  
                  this.texShader.setUniformi('uTex', 0);

                  this.texVB.begin();

                  var skyTR = G.textureAtlas.getCustomTextureRegion(0, 216, 256, 40);
                  var skyUVs = skyTR.uvs;
                  var uw = skyUVs.u2 - skyUVs.u1;
                  var vh = skyUVs.v2 - skyUVs.v1;

                  var fov = 45.0 * gl.viewportWidth/gl.viewportHeight;
              
                  var texWindow = fov/360.0;
                  var rot = G.player.r / (2.0 * Math.PI);

                  //this.renderQuad(0.0, 0.0, 1.0, 0.5, -rot, skyUVs.v1, texWindow, vh);
                  this.renderQuad(0.0, 0.5, 1.0, 0.5, -rot, skyUVs.v1, texWindow, vh);

                  this.texVB.end();
                  this.texVB.render(this.texShader, gl.TRIANGLES);
		},

        renderQuad:     function(x, y, w, h, u, v, uw, vh) {
            this.texVB.addData([ x, y,  0.0, u, v]);
            this.texVB.addData([ x + w, y,  0.0, u + uw, v]);
            this.texVB.addData([ x, y + h,  0.0, u, v + vh]);
            
            this.texVB.addData([ x, y + h,  0.0, u, v + vh]);
            this.texVB.addData([ x + w, y,  0.0, u + uw, v]);
            this.texVB.addData([ x + w, y + h,  0.0, u + uw, v+ vh]);
        }

	});
})();