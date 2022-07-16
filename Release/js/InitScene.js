var InitScene = (function() {
	return Scene.extend({
		init: function(manager, assetManager) {
			this._super(manager);
			this.assetManager = assetManager
			this.assetManager.load();
			this.assetsLoaded = false;
			this.transitioning = false;

            this.progress = 0.0;
            this.errorPrinted = false;
            this.timerSet = false;

            this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			this.color = [1.0, 1.0, 1.0, 1.0];
		},

		didAppear: function() {

		},

		didHide: function() {

		},

		tick: function() {

			if (this.assetManager.hasError()) {
                if (!this.errorPrinted) {
                    this.progress = 1.0;
                    this.errorPrinted = true;
                    this.color = [1.0, 0.0, 0.0, 1.0];
                    setTimeout(function() {
                        alert('Error while loading "' + assets.errorAsset + '"');
                    }, 100);
                }
                return;
            }

			this.progress = this.assetManager.getProgress();

            if (!this.assetManager.update() && !this.timerSet) {
                var self = this;
                self.timerSet = true;

                // init
				G.textureAtlas = new TextureAtlas(G.assetManager.get('assets/gfx/tilemap.png'));

                setTimeout(function() {
                    self.manager.pop();
                    //self.manager.push(new GeneratorScene(self.manager));
        			//self.manager.push(new MessageScene(self.manager, "Game Over", [1.0, 1.0, 1.0, 1.0], [1.0, 0.0, 0.0, 1.0], new IntroScene(self.manager)));
        			self.manager.push(new IntroScene(self.manager));
        			//self.manager.push(new WorldGeneratorScene(self.manager));
        			//self.manager.push(new WorldScene(self.manager));
                    //self.sceneManager.scenes.push(new LevelSelectionScene(self.sceneManager));
                    //self.sceneManager.scenes.push(new LevelScene(self.sceneManager, Level.levels[3].file, Level.levels[3].name));
                    /*self.sceneManager.scenes.push(new MessageScene(self.sceneManager, "TEST 123", 5000,
                        [{text: "Continue", action: null, button: 'A'}]));*/
                }, 500);
            }
		},

		renderQuad: function(x, y, w, h) {
			G.colorVB.addData([ x, y, 0.0]);
			G.colorVB.addData([ x + w, y, 0.0]);
			G.colorVB.addData([ x, y + h, 0.0]);

			G.colorVB.addData([ x, y + h, 0.0]);
			G.colorVB.addData([ x + w, y, 0.0]);
			G.colorVB.addData([ x + w, y + h, 0.0]);
		},

		render: function() {
            gl.clearColor(0.1, 0.1, 0.1, 1.0);

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var height = gl.viewportHeight/gl.viewportWidth;

            mat4.ortho(this.pMatrix, 0.0, 1.0, 0.0, height, 0.0, 10.0);
            mat4.identity(this.mvMatrix);

            G.colorShader.use();

			G.colorShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.colorShader.setUniformMatrix('uPMatrix', this.pMatrix);

			G.colorShader.setUniformf('uColor', [0.7, 0.7, 0.7, 1.0]);

			G.colorVB.begin();
			this.renderQuad(0.2, height/2.0 - 0.05, 0.6, 0.1);			
			G.colorVB.end();

			G.colorShader.setUniformf('uColor', this.color);

			G.colorVB.begin();
			this.renderQuad(0.2, height/2.0 - 0.05, 0.6 * this.progress, 0.1);			
			G.colorVB.end();

			G.colorVB.render(G.colorShader, gl.TRIANGLES);
        }
	});
})();