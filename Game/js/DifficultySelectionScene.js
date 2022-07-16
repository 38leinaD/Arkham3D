var DifficultySelectionScene = (function() {
	return Scene.extend({
		init: function(manager) {
			this._super(manager);
            this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			this.font = G.assetManager.get('assets/fonts/04.json');
			

			this.t = 0;
			this.pisTex = G.textureAtlas.getCustomTextureRegion(0, 57, 10, 7);
			this.selected = 0;

		},

		didAppear: function() {

		},

		didHide: function() {

		},

		tick: function() {
			this.t++;

			if (G.input.wasJustPressed('A')) {
				G.sceneManager.pop();
    			G.sceneManager.push(new GeneratorScene(this.manager, this.selected));
			}

			if (G.input.wasJustPressed('DOWN')) {
    			this.selected++;
    			this.selected %= 3;
			}

			if (G.input.wasJustPressed('UP')) {
    			this.selected--;
    			this.selected %= 3;
			}
		},


		render: function() {
            gl.clearColor(0.1, 0.1, 0.1, 1.0);

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var width = 100;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

            mat4.ortho(this.pMatrix, 0.0, width, 0.0, height, 0.0, 10.0);
            mat4.identity(this.mvMatrix);



			// 

           	G.texShader.use();

			G.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.texShader.setUniformMatrix('uPMatrix', this.pMatrix);

			G.texShader.setUniformf('uColor', [0.5, 0.5, 0.5, 1.0]);


      		gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			this.font.texture.bind();

			G.texVB.begin();
			this.font.setScale(6.0);
			this.font.renderStringCentered(G.texVB, "Select Difficulty", 100, 100);
			this.font.setScale(4.0);

			this.font.renderStringCentered(G.texVB, "Easy", 100, 80);
			this.font.renderStringCentered(G.texVB, "Medium", 100, 70);
			this.font.renderStringCentered(G.texVB, "Hard", 100, 60);

			this.font.setScale(2.0);

			this.font.renderStringCentered(G.texVB, "Your Goal: Find all the treasures.\n\nThe world is randomly generated.\nA higher difficulty means a larger world.\nBe warned: Hard, can be hard!", 100, 30);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);


      		gl.disable(gl.BLEND);

			G.textureAtlas.texture.bind();

			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);

			G.texVB.begin();

			renderQuad(G.texVB, 30, 37 - this.selected * 5, 6, 5, this.pisTex.uvs);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);
        }
	});
})();