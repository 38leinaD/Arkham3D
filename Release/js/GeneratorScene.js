var GeneratorScene = (function() {
	return Scene.extend({
		init: function(manager, level) {
			this._super(manager);
            this.mvMatrix = mat4.create();
			this.pMatrix = mat4.create();

			this.font = G.assetManager.get('assets/fonts/04.json');
			

			this.t = 0;
			this.level = level;
			this.status = "";

			this.worker = new Worker('js/GeneratorWorker.js');
			var self = this;

			var listener = function(e) {
				console.log('Worker said: ', e.data);
				var res = JSON.parse(e.data);
				if (res.type === "msg") {
					self.status = res.data;
				}
				else if (res.type == "result") {
					console.log("done");
					var worldScene = new WorldScene(self.manager, res.data);
					G.sceneManager.pop();
					G.sceneManager.push(worldScene);

				}
				else if (res.type == "error") {
					self.status = "World does not meet metrics. Regenerating...";
					console.log(res.msg);
					self.worker = new Worker('js/GeneratorWorker.js');
					self.worker.addEventListener('message', listener, false);

					var worldConfig = {
						width: 30 + 20 *self.level,
						height: 30 + 20 *self.level,
						seed: Math.floor(Math.random() * 768624653)
					}
					console.log("Generting with config " + JSON.stringify(worldConfig));

					self.worker.postMessage(JSON.stringify(worldConfig));

				}
			};

			this.worker.addEventListener('message', listener, false);

			var worldConfig = {
				width: 30 + 20 *self.level,
				height: 30 + 20 *self.level,
				seed: Math.floor(Math.random() * 768624653),
				template: G.assetManager.get('assets/worlds/template.json')
			}
			console.log("Generting with config " + JSON.stringify(worldConfig));

			this.worker.postMessage(JSON.stringify(worldConfig));
		},

		didAppear: function() {

		},

		didHide: function() {

		},

		tick: function() {
			this.t++;
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

           	G.texShader.use();

			G.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.texShader.setUniformMatrix('uPMatrix', this.pMatrix);

			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);


      		gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			this.font.texture.bind();

			G.texVB.begin();
			this.font.setScale(8.0);
			this.font.renderStringCentered(G.texVB, "Generating World...", 100, 60);
			this.font.setScale(4.0);

			this.font.renderStringCentered(G.texVB, this.status, 100, 40);

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);


      		gl.disable(gl.BLEND);

        }
	});
})();