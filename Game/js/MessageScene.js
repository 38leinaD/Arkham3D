var MessageScene = (function() {
	return Scene.extend({
		init: function(manager, message, textColor, bgColor, nextScene) {
			this._super(manager);
            this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			this.font = G.assetManager.get('assets/fonts/04.json');
			

			this.t = 0;
			this.message = message;
			this.bgColor = bgColor;
			this.textColor = textColor;
			this.nextScene = nextScene;

		},

		didAppear: function() {

		},

		didHide: function() {

		},

		tick: function() {
			this.t++;
		

			if (G.input.wasJustPressed('A')) {
				G.sceneManager.pop();
    			G.sceneManager.push(this.nextScene);
			}

		},


		render: function() {
            gl.clearColor(this.bgColor[0], this.bgColor[1], this.bgColor[2], this.bgColor[3]);

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var width = 100;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

            mat4.ortho(this.pMatrix, 0.0, width, 0.0, height, 0.0, 10.0);
            mat4.identity(this.mvMatrix);


           	G.texShader.use();

			G.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.texShader.setUniformMatrix('uPMatrix', this.pMatrix);

			G.texShader.setUniformf('uColor', this.textColor);


      		gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			this.font.texture.bind();

			G.texVB.begin();
			this.font.setScale(8.0);
			this.font.renderStringCentered(G.texVB, this.message, 100, 60);
			this.font.setScale(4.0);

			this.font.renderStringCentered(G.texVB, "Press SPACE/A to continue", 100, 20);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);


      		gl.disable(gl.BLEND);

        }
	});
})();