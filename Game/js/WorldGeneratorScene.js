var WorldGeneratorScene = (function() {

	function RandomNumberGenerator (seed){
		if (seed === undefined) {
			var d = new Date();
			this.seed = 2345678901 + (d.getSeconds() * 0xFFFFFF) + (d.getMinutes() * 0xFFFF);
		}
		else {
			this.seed = seed;
		}
		this.A = 48271;
		this.M = 2147483647;
		this.Q = this.M / this.A;
		this.R = this.M % this.A;
		this.oneOverM = 1.0 / this.M;

		this.next = function() {
			var hi = this.seed / this.Q;
			var lo = this.seed % this.Q;
			var test = this.A * lo - this.R * hi;
			if(test > 0){
				this.seed = test;
			} else {
				this.seed = test + this.M;
			}
			return (this.seed * this.oneOverM);
		}
	}

	return Scene.extend({
		init: function(manager, assetManager) {
			this._super(manager);
            this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			G.textureAtlas = new TextureAtlas(G.assetManager.get('assets/gfx/tilemap.png'));

			this.tex = G.textureAtlas.getCustomTextureRegion(0, 0, 16, 16).uvs;
			this.tex2 = G.textureAtlas.getCustomTextureRegion(16, 0, 16, 16).uvs;

			this.gen = new WorldGenerator();
			var self = this;
			this.worldConfig = {
				width: 80,
				height: 80,
				seed: Math.floor(Math.random() * 76867465)
			}
			this.worldConfig.seed = 82590180;

			RNG = new RandomNumberGenerator(this.worldConfig.seed);
			var self = this;
			this.reseed = function() {
				self.worldConfig.seed = Math.floor(Math.random() * 8723472347);
			};

			this.regenerate = function() {
				RNG = new RandomNumberGenerator(self.worldConfig.seed);
				self.gen.generate(self.worldConfig);
			};

			this.worldScene = null;

			this.play = function() {
				
				if (G.sceneManager.currentScene instanceof WorldScene) {
					G.sceneManager.pop();
					G.sceneManager.push(self);
				}
				else {
					G.sceneManager.pop();
					if (this.worldScene === null) {
						var world = self.gen.export(G.assetManager.get("assets/worlds/template.json"));
						this.worldScene = new WorldScene(this.manager, world);
					}
					G.sceneManager.push(this.worldScene);
				}
			};

			var gui = new dat.GUI();
			gui.add(this.worldConfig, 'width');
			gui.add(this.worldConfig, 'height');
			gui.add(this.worldConfig, 'seed').listen();
			gui.add(this, 'reseed');
			gui.add(this, 'regenerate');
			gui.add(this, 'play');

			//gui.remember(this.worldConfig);
			/*document.addEventListener("mousedown", function(e) {
				console.log("Clicked" + e.pageX + " | " + e.pageY);

				var width = 1000;
	            var ratio = gl.viewportHeight/gl.viewportWidth;
	            var height = width * ratio;
				G.player.x = width * (e.pageX/gl.viewportWidth) / 5;
				G.player.y = height * ((gl.viewportHeight - e.pageY)/gl.viewportHeight) / 5;

				console.log("Player teleported to " + G.player.x + ", " + G.player.y);
			});
*/
			this.gen.generate(this.worldConfig);

		},

		didAppear: function() {

		},

		didHide: function() {

		},

		tick: function() {

		},

		render: function() {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT);

            var width = 1000;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

            mat4.ortho(this.pMatrix, 0.0, width, 0.0, height, 0.0, 10.0);
            mat4.identity(this.mvMatrix);

           	G.texShader.use();

			G.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.texShader.setUniformMatrix('uPMatrix', this.pMatrix);

      		gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.lineWidth(3.0);
			G.textureAtlas.texture.bind();

			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);

			G.texVB.begin();
			var i=0;
			for (var x=0; x<this.gen.w; x++) {
				for (var y=0; y<this.gen.h; y++) {
					i++;
					var tile = this.gen.tileConfigs[y * this.gen.w + x];
					if (tile == null) continue;
					if (tile.wallCode == 0 && tile.floorCode == 0) continue;
					//if (tile.room !== null) renderQuad(G.texVB, x*5, height - (y+1)*5, 5, 5, this.tex);
					if (tile.floorCode !== 0) renderQuad(G.texVB, x*5, (y)*5, 5, 5, G.textureAtlas.getCustomTextureRegion(((tile.floorCode-1) % 16) * 16, Math.floor((tile.floorCode-1) / 16) * 16, 16, 16).uvs);
					if (tile.wallCode !== 0) renderQuad(G.texVB, x*5, (y)*5, 5, 5, G.textureAtlas.getCustomTextureRegion(((tile.wallCode-1) % 16) * 16, Math.floor((tile.wallCode-1) / 16) * 16, 16, 16).uvs);

					if (i>100) {
						G.texVB.end();
						G.texVB.render(G.texShader, gl.TRIANGLES);
						G.texVB.begin();

						i=0;
					}
				}
			}

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);

			G.colorShader.use();

			G.colorShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.colorShader.setUniformMatrix('uPMatrix', this.pMatrix);

			G.colorShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);

			G.colorVB.begin();
			var k=0;

			for (var i=0; i<this.gen.rooms.length; i++) {
				var r = this.gen.rooms[i];
				for (var j=0; j<r.neighbors.length; j++) {
					var nr = r.neighbors[j];
					G.colorVB.addData([r.cx*5, (r.cy+1)*5, 0.0]);
					G.colorVB.addData([nr.cx*5, (nr.cy+1)*5, 0.0]);
					k++;
					if (k>50) {
						G.colorVB.end();
						G.colorVB.render(G.colorShader, gl.LINES);
						G.colorVB.begin();

						k=0;
					}
				}
			}


			G.colorVB.end();
			G.colorVB.render(G.colorShader, gl.LINES);

			this.renderPortals(this.gen.portals, [1.0, 1.0, 0.0, 0.2]);
			this.renderPortals(this.gen.removedPortals, [1.0, 0.0, 1.0, 0.2]);
			this.markLeafs([0.0, 1.0, 1.0, 0.2]);

			if (G.player == null) return;

			G.colorShader.setUniformf('uColor', [0.0, 1.0, 0.0, 1.0]);

			G.colorVB.begin();

			drawQuad(G.colorVB, G.player.x * 5 - 2.5, (this.worldScene.world.height - G.player.y)*5 - 2.5, 5, 5);

			G.colorVB.end();
			G.colorVB.render(G.colorShader, gl.TRIANGLES);

        },

        renderPortals: function(portals, color) {
        	var width = 1000;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

        	G.colorShader.setUniformf('uColor', color);

			G.colorVB.begin();
			var k=0;

			for (var i=0; i<portals.length; i++) {
				var p = portals[i];
				
				drawQuad(G.colorVB, p.x * 5, (p.y)*5, p.w * 5, p.h * 5);
				k++;
				
				if (k>50) {
					G.colorVB.end();
					G.colorVB.render(G.colorShader, gl.TRIANGLES);
					G.colorVB.begin();

					k=0;
				}
			}


			G.colorVB.end();
			G.colorVB.render(G.colorShader, gl.TRIANGLES);
        },

        markLeafs: function(color) {
        	var width = 1000;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

        	G.colorShader.setUniformf('uColor', color);

			G.colorVB.begin();
			var k=0;

			for (var i=0; i<this.gen.rooms.length; i++) {
				var r = this.gen.rooms[i];
				if (r.children.length !== 0) continue;
				drawQuad(G.colorVB, r.x * 5, (r.y)*5, r.w * 5, r.h * 5);
				k++;
				
				if (k>50) {
					G.colorVB.end();
					G.colorVB.render(G.colorShader, gl.TRIANGLES);
					G.colorVB.begin();

					k=0;
				}
			}


			G.colorVB.end();
			G.colorVB.render(G.colorShader, gl.TRIANGLES);
        }


	});
})();