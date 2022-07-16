var DemoScene = (function() {

	return Scene.extend({
		init: function(manager) {
			this._super(manager);

			this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			this.texture = G.assetManager.get('assets/logo.png');

			this.font = G.assetManager.get('assets/fonts/04.json');

			var self = this;
			this.int = new Interpolation("smoothStep", 0.0, 1.0, 160.0, function() {
				self.int = new Interpolation("smoothStep", 1.0, 0.0, 160.0);
			});
		},

		didAppear: function() {
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		},

		didHide: function() {

		},

		render: function() {
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            mat4.ortho(this.pMatrix, 0.0, gl.viewportWidth, 0.0, gl.viewportHeight, -10.0, 10.0);
			mat4.identity(this.mvMatrix);

			this.font.texture.bind();
			this.font.setScale(100.0);

			G.texShader.use();

			G.texShader.setUniformMatrix('uPMatrix', this.pMatrix);
			G.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.texShader.setUniformi('uTex', 0);

			G.texVB.begin();
			this.font.renderStringCentered(G.texVB, "test123", gl.viewportWidth, gl.viewportHeight);
			G.texVB.end();

			G.texVB.render(G.texShader, gl.TRIANGLES);

		},

		tick: function() {
			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, this.int.tick()]);
		}
	});
})();