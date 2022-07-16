var IntroScene = (function() {
	return Scene.extend({
		init: function(manager, assetManager) {
			this._super(manager);
            this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			this.font = G.assetManager.get('assets/fonts/04.json');
			
			this.batTex = [
				G.textureAtlas.getCustomTextureRegion(0, 88, 11, 8),
				G.textureAtlas.getCustomTextureRegion(11, 88, 11, 8)
			];

			this.bloodTex = G.textureAtlas.getCustomTextureRegion(228, 163, 26, 51);
			this.logoTex = G.textureAtlas.getCustomTextureRegion(171, 161, 55, 55);

			this.bats = [];

			for (var i=0; i<100; i++) {
				this.bats.push({
					x: Math.random() * 100,
					y: Math.random() * 100,
					vx: Math.random() - 0.5,
					vy: Math.random() - 0.5,
					d: Math.floor(Math.random() * 10)
				});
			}

			this.t = 0;
		},

		didAppear: function() {

		},

		didHide: function() {

		},

		tick: function() {
			this.t++;
			
			for (var i=0; i<this.bats.length; i++) {
				var bat = this.bats[i];
				bat.x += bat.vx;
				bat.y += bat.vy;

				if (bat.x < -20 || bat.x > 200 || bat.y < -20 || bat.y > 200) {
					this.bats.splice(i, 1);
				}
			}

			if (G.input.wasJustPressed('A')) {
				G.sceneManager.pop();
    			//G.sceneManager.push(new WorldScene(self.manager));
    			G.sceneManager.push(new DifficultySelectionScene(this.manager));
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
			this.font.setScale(3.0);
			this.font.renderString(G.texVB, "Developed for #1GAM", 5.0, 5.0);
			this.font.setScale(6.0);
			this.font.renderStringCentered(G.texVB, "Arkham 3D", 100, 100);
			this.font.setScale(2.0);

			this.font.renderStringCentered(G.texVB, "Keyboard:\nSPACE to attack and open doors\nR to switch weapons\n\nGamepad:\nA to attack and open doors\nB to switch weapons", 100, 40);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);


			G.texShader.setUniformf('uColor', [0.5, 0.5, 0.5, animFrame(this.t, 2, 40)]);

			G.texVB.begin();
			this.font.setScale(4.0);
			this.font.renderStringCentered(G.texVB, ">> Press SPACE/A to start <<", 100, 60);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);

      		gl.disable(gl.BLEND);

			G.textureAtlas.texture.bind();

			G.texShader.setUniformf('uColor', [0.3, 0.3, 0.3, 1.0]);

			G.texVB.begin();

			renderQuad(G.texVB, width-22, 3, 20, 20, this.logoTex.uvs);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);


			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);

			G.texVB.begin();

			renderQuad(G.texVB, 50, 20, 20, 40, this.bloodTex.uvs);

			for (var i=0; i<this.bats.length; i++) {
				var bat = this.bats[i];
				renderQuad(G.texVB, bat.x, bat.y, 11, 8, this.batTex[animFrame(this.t + bat.d, 2, 20)].uvs);
			}

			G.texVB.end();

			G.texVB.render(G.texShader, gl.TRIANGLES);
        }
	});
})();