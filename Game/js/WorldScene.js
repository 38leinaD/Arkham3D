var WorldScene = (function() {

	var rttFramebuffer;
	var rttTexture;
	function initTextureFramebuffer() {
		rttFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		rttFramebuffer.width = 512;
		rttFramebuffer.height = 512;

		rttTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		//gl.generateMipmap(gl.TEXTURE_2D);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	return Scene.extend({
		init: function(manager, world) {
			this._super(manager);
			this.mvMatrix = mat4.create();
			this.mMatrix = mat4.create();
			this.vMatrix = mat4.create();

			this.pMatrix = mat4.create();

			this.vb = new FloatVertexBuffer([new FloatVertexBuffer.Attribute(3), new FloatVertexBuffer.Attribute(3), new FloatVertexBuffer.Attribute(2)], 5000);

			this.psShader = new ShaderProgram('colorsprite-vs', 'colorsprite-fs', ['u_worldView', 'u_viewportWidth'], ['a_position', 'a_color', 'a_size', 'a_distance']);
			this.psVB = new FloatVertexBuffer([new FloatVertexBuffer.Attribute(3), new FloatVertexBuffer.Attribute(4), new FloatVertexBuffer.Attribute(1), new FloatVertexBuffer.Attribute(1)], 500);
			this.shaderProgram = new ShaderProgram('surface-vs', 'surface-fs', ['uPMatrix', 'uMVMatrix', 'uLightPosition', 'ulightIntensity', 'uTex'], ['aVertexPosition', 'aVertexNormal', 'aTextureCoord']);
			this.entityShader = new ShaderProgram('entity-vs', 'entity-fs', ['uPMatrix', 'uMMatrix', 'uVMatrix', 'uLightPosition', 'ulightIntensity', 'uTex'], ['aVertexPosition', 'aVertexNormal', 'aTextureCoord']);

			this.texShader = G.texShader;

			G.raycaster = new Raycaster();
			this.raycaster = G.raycaster;

			if (world === undefined) {
				this.world = new World(G.assetManager.get('assets/worlds/demo.json'));
			}
			else {
				this.world = new World(world);
			}
			G.camPos = {
				x: G.player.x,
				y: G.player.y,
				z: G.player.z,
				r: G.player.r
			};


			//this.raycaster.updateViewport(gl.viewportWidth/gl.viewportHeight * 45.0, 512);
			this.raycaster.updateViewport(gl.viewportWidth/gl.viewportHeight * 45.0 / 360.0 * 2 * Math.PI, 512);
			this.frontLayers = [];
			this.frontLayers.push(new HudLayer(this));

			this.backLayers = [];
			this.backLayers.push(new SkyLayer(this));

			this.modelVB = new FloatVertexBuffer([new FloatVertexBuffer.Attribute(3), new FloatVertexBuffer.Attribute(2)], 5000);
			this.modelVB.texture = G.assetManager.get('assets/models/grave.png');
			initTextureFramebuffer();

			this.swordInt = null;

			this.t = Math.PI/2.0;

			this.font = G.assetManager.get('assets/fonts/04.json');

			this.heartTex = G.textureAtlas.getCustomTextureRegion(8, 49, 7, 7);
			this.pisTex = G.textureAtlas.getCustomTextureRegion(0, 57, 10, 7);
			this.hurtTex = G.textureAtlas.getCustomTextureRegion(48, 48, 16, 16);

			var self = this;
			this.swordInt = new Interpolation("", 0.0, 1.0, 10, function() {
				self.swordInt = new Interpolation("", 1.0, 0.0, 10, function() {

				});
			});

			this.shadowUV = G.textureAtlas.getCustomTextureRegion(64, 48, 16, 16).uvs;
			this.lightUV = 	G.textureAtlas.getCustomTextureRegion(96, 48, 16, 16).uvs;

			this.fadeOutColor = null;
		},

		didAppear: function() {
			console.log("APPEAR");
			gl.clearColor(1.0, 1.0, 1.0, 1.0);
			G.audioManager.playSong('DST-RavenWood.ogg');
		},

		didHide: function() {
						console.log("HIDE SCENE");

			G.audioManager.stopSong();
		},

		render: function() {
			//gl.enable(gl.CULL_FACE);

        	gl.activeTexture(gl.TEXTURE0);
      		gl.disable(gl.BLEND);


			gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.depthMask(false); 
			for (var i=0; i<this.backLayers.length; i++) {
				var layer = this.backLayers[i];
				layer.render();
			}
			gl.depthMask(true);

			this.renderLowRes();

			gl.bindTexture(gl.TEXTURE_2D, rttTexture);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE_2D, null);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);



			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);


            mat4.ortho(this.pMatrix, 0.0, 1.0, 0.0, 1.0, -10.0, 10.0);
			mat4.identity(this.mvMatrix);

			gl.bindTexture(gl.TEXTURE_2D, rttTexture);
			this.texShader.use();

			this.texShader.setUniformMatrix('uPMatrix', this.pMatrix);
			this.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			this.texShader.setUniformi('uTex', 0);

			G.texVB.begin();

			var ratio = (gl.viewportHeight/gl.viewportWidth);

			G.texVB.addData([ 0.0,  0.0,  0.0,		0.0, 0.0]);
			G.texVB.addData([ 1.0, 0.0,  0.0,		1.0, 0.0]);
			G.texVB.addData([ 0.0,  1.0,  0.0,		0.0, ratio]);
			G.texVB.addData([ 1.0,  1.0,  0.0,		1.0, ratio]);

			G.texVB.end();
			G.texVB.render(this.texShader, gl.TRIANGLE_STRIP);

			for (var i=0; i<this.frontLayers.length; i++) {
				var layer = this.frontLayers[i];
				layer.render();
			}



			gl.disable(gl.DEPTH_TEST);

			this.renderHud();

			if (this.fadeOutColor !== null) {
				G.colorShader.use();

				G.colorShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
				G.colorShader.setUniformMatrix('uPMatrix', this.pMatrix);

				G.colorShader.setUniformf('uColor', this.fadeOutColor);

				G.colorVB.begin();
				drawQuad(G.colorVB, 0.0, 0.0, gl.viewportWidth, gl.viewportHeight);			
				G.colorVB.end();

				G.colorVB.render(G.colorShader, gl.TRIANGLES);
			}
		},

		renderParticles: function() {
			mat4.identity(this.mvMatrix);

			mat4.perspective(this.mvMatrix, 45.0, rttFramebuffer.width / rttFramebuffer.height, 0.1, 100.0);
			mat4.rotate(this.mvMatrix, this.mvMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, Math.PI/2.0 - G.camPos.r, [0.0, 0.0, 1.0]);
			mat4.translate(this.mvMatrix, this.mvMatrix, [-G.camPos.x, -G.camPos.y, -G.camPos.z+this.dd]);

			this.psShader.use();

			this.psShader.setUniformMatrix('u_worldView', this.mvMatrix);
			this.psShader.setUniformf('u_viewportWidth', rttFramebuffer.width);

	
			var p = vec3.fromValues(3.0, 3.0, 0.5);

			this.psVB.begin();
			for (var i=0; i<this.world.particles.length; i++) {
				var p = this.world.particles[i];
				this.psVB.addData([
					p.position[0], p.position[1], p.position[2],	
					p.color[0], p.color[1], p.color[2], p.color[3], 	0.05, vec3.distance(p.position, vec3.fromValues(G.player.x, G.player.y, 0.7))
				]);
			}
			this.psVB.end();

			this.psVB.render(this.psShader, gl.POINTS);
		},

		renderBullets: function() {
			mat4.identity(this.mvMatrix);

			mat4.perspective(this.mvMatrix, 45.0, rttFramebuffer.width / rttFramebuffer.height, 0.1, 100.0);
			mat4.rotate(this.mvMatrix, this.mvMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, Math.PI/2.0 - G.camPos.r, [0.0, 0.0, 1.0]);
			mat4.translate(this.mvMatrix, this.mvMatrix, [-G.camPos.x, -G.camPos.y, -G.camPos.z+this.dd]);

			this.psShader.use();

			this.psShader.setUniformMatrix('u_worldView', this.mvMatrix);
			this.psShader.setUniformf('u_viewportWidth', rttFramebuffer.width);

	

			this.psVB.begin();
			for (var i=0; i<this.world.bullets.length; i++) {
				var b = this.world.bullets[i];
				this.psVB.addData([
					b.position[0], b.position[1], b.position[2],	
					b.color[0], b.color[1], b.color[2], b.color[3], 	0.05, vec3.distance(b.position, vec3.fromValues(G.player.x, G.player.y, 0.7))
				]);
			}
			this.psVB.end();

			this.psVB.render(this.psShader, gl.POINTS);
		},

		renderLowRes: function() {
			this.dd = this.calcMotionDisp();
			gl.enable(gl.DEPTH_TEST);

			gl.viewport(0, 0, rttFramebuffer.width, rttFramebuffer.height * (gl.viewportHeight/gl.viewportWidth));

			mat4.perspective(this.pMatrix, 45.0, rttFramebuffer.width / rttFramebuffer.height, 0.1, 100.0);

			mat4.identity(this.mvMatrix);

			mat4.rotate(this.mvMatrix, this.mvMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, Math.PI/2.0 - G.camPos.r, [0.0, 0.0, 1.0]);

			mat4.translate(this.mvMatrix, this.mvMatrix, [-G.camPos.x, -G.camPos.y, -G.camPos.z + this.dd]);

			G.textureAtlas.texture.bind();

			this.shaderProgram.use();

			this.shaderProgram.setUniformMatrix('uPMatrix', this.pMatrix);
			this.shaderProgram.setUniformMatrix('uMVMatrix', this.mvMatrix);
			this.shaderProgram.setUniformi('uTex', 0);
			this.shaderProgram.setUniformf('uLightPosition', [G.camPos.x, G.camPos.y, 0.7]);
			this.shaderProgram.setUniformf('ulightIntensity', 0.9);

			var tr = G.textureAtlas.getTextureRegion(0);

			this.vb.begin();

			//	for (var i=0; i<this.world.tiles.length; i++) {
				//	var tile = this.world.tiles[i];
				//	if (tile !== null) {
				//		tile.putVertexData(this.vb);
				//		tile.putFloorVertexData(this.vb);
				//	}
			//	}

			// Tiles
			for (var i=0; i<this.raycaster.visibleTileCount; i++) {
				var tile = this.raycaster.visibleTiles[i];

				if (tile instanceof WallTile && tile.blocksVisibility) continue;

				tile.putVertexData(this.vb);
				tile.putFloorVertexData(this.vb);

			}

			// Walls
			for (var i=0; i<this.raycaster.visibleWallCount; i++) {
				var wall = this.raycaster.visibleWalls[i];

				wall.putVertexData(this.vb);
			}

			this.vb.end();

			this.vb.render(this.shaderProgram, gl.TRIANGLES);


			// Model
/*
			this.modelVB.texture.bind();

			mat4.translate(this.mvMatrix, this.mvMatrix, [1.0, 2.0, 0.001]);
			this.shaderProgram.setUniformMatrix('uPMatrix', this.pMatrix);
			this.shaderProgram.setUniformMatrix('uMVMatrix', this.mvMatrix);
			this.modelVB.begin();
			this.modelVB.setData(G.assetManager.get('assets/models/grave.mdl').data);
			this.modelVB.end(); 
			this.modelVB.render(this.shaderProgram, gl.TRIANGLES);
*/

			// Shadows			
      		gl.enable(gl.BLEND);
			//gl.disable(gl.DEPTH_TEST);

			this.texShader.use();
			mat4.identity(this.mvMatrix);
			mat4.rotate(this.mvMatrix, this.mvMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, Math.PI/2.0 - G.camPos.r, [0.0, 0.0, 1.0]);

			mat4.translate(this.mvMatrix, this.mvMatrix, [-G.camPos.x, -G.camPos.y, -G.camPos.z + this.dd]);

			this.texShader.setUniformMatrix('uPMatrix', this.pMatrix);
			this.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			this.texShader.setUniformi('uTex', 0);

			G.textureAtlas.texture.bind();

			gl.blendFunc(gl.SRC_ALPHA_SATURATE, gl.ONE_MINUS_SRC_ALPHA);

			G.texVB.begin();

			for (var i=0; i<this.raycaster.visibleEntityCount; i++) {
				var entity = this.raycaster.visibleEntities[i];
				if (entity instanceof Bat || entity instanceof Fireball) continue;
				var uvs = this.shadowUV;
				var x = entity.rx;
				var y = entity.ry;
				G.texVB.addData([ x - 0.5,  y - 0.5,  0.003,		uvs.u1, uvs.v1]);
				G.texVB.addData([ x + 0.5, y - 0.5,  0.003,		uvs.u2, uvs.v1]);
				G.texVB.addData([ x - 0.5,  y + 0.5,  0.003,		uvs.u1, uvs.v2]);

				G.texVB.addData([ x - 0.5,  y + 0.5,  0.003,		uvs.u1, uvs.v2]);
				G.texVB.addData([ x + 0.5, y - 0.5,  0.003,		uvs.u2, uvs.v1]);
				G.texVB.addData([ x + 0.5, y + 0.5,  0.003,		uvs.u2, uvs.v2]);
			}
			G.texVB.end();

			G.texVB.render(this.texShader, gl.TRIANGLES);

			// Light

			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

			G.texVB.begin();

			for (var i=0; i<this.raycaster.visibleEntityCount; i++) {
				var entity = this.raycaster.visibleEntities[i];
				if (!(entity instanceof Fireball)) continue;
				var uvs = this.lightUV;
				var x = entity.rx;
				var y = entity.ry;
				G.texVB.addData([ x - 0.5,  y - 0.5,  0.003,		uvs.u1, uvs.v1]);
				G.texVB.addData([ x + 0.5, y - 0.5,  0.003,		uvs.u2, uvs.v1]);
				G.texVB.addData([ x - 0.5,  y + 0.5,  0.003,		uvs.u1, uvs.v2]);

				G.texVB.addData([ x - 0.5,  y + 0.5,  0.003,		uvs.u1, uvs.v2]);
				G.texVB.addData([ x + 0.5, y - 0.5,  0.003,		uvs.u2, uvs.v1]);
				G.texVB.addData([ x + 0.5, y + 0.5,  0.003,		uvs.u2, uvs.v2]);
			}
			G.texVB.end();

			G.texVB.render(this.texShader, gl.TRIANGLES);

      		gl.disable(gl.BLEND);
			//gl.enable(gl.DEPTH_TEST);


			// Entities
			this.entityShader.use();

			for (var i=0; i<this.raycaster.visibleEntityCount; i++) {
				var entity = this.raycaster.visibleEntities[i];

				var normal = vec3.fromValues(G.camPos.x - entity.x, G.camPos.y - entity.y, 0.0);
				vec3.normalize(normal, normal);
				mat4.identity(this.mMatrix);
				mat4.identity(this.vMatrix);

				mat4.rotate(this.vMatrix, this.vMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);
				mat4.rotate(this.vMatrix, this.vMatrix, Math.PI/2.0 - G.camPos.r, [0.0, 0.0, 1.0]);

				mat4.translate(this.vMatrix, this.vMatrix, [-G.camPos.x, -G.camPos.y, -G.camPos.z +this.dd ]);

				mat4.translate(this.mMatrix, this.mMatrix, [entity.rx, entity.ry, 0.0]);
				mat4.rotate(this.mMatrix, this.mMatrix, G.camPos.r - Math.PI/2.0, [0.0, 0.0, 1.0]);

				this.entityShader.setUniformMatrix('uPMatrix', this.pMatrix);
				this.entityShader.setUniformMatrix('uVMatrix', this.vMatrix);
				this.entityShader.setUniformMatrix('uMMatrix', this.mMatrix);

				this.entityShader.setUniformf('ulightIntensity', 0.96);

				G.textureAtlas.texture.bind();


				this.vb.begin();
				entity.putVertexData(this.vb, normal);

				this.vb.end();
				this.vb.render(this.entityShader, gl.TRIANGLES);
			}

			this.renderParticles();
			this.renderBullets();

			// Weapon
			if (G.player.weapons[G.player.selectedWeaponIdx].name === 'sword') {
				this.renderSword();
			}
			else if (G.player.weapons[G.player.selectedWeaponIdx].name === 'pistol') {
				this.renderPistol();
			}

		},

		tick: function() {
			
			this.world.tick();

			//this.raycaster.calculateVisibleTilesAndWalls(this.world, 7, 4, Math.PI/2.0 - 0.001);

			if (G.input.isDown('A')) {
				if (G.player.attack()) {
					var self = this;
					this.swordInt = new Interpolation("", 0.0, 1.0, 10, function() {
						self.swordInt = new Interpolation("", 1.0, 0.0, 10, function() {

						});
					});
				}
			}

			if (!this.swordInt.isFinished()) {
				this.swordInt.tick();
			}

			for (var i=0; i<this.frontLayers.length; i++) {
				var layer = this.frontLayers[i];
				layer.tick();
			}

			for (var i=0; i<this.backLayers.length; i++) {
				var layer = this.backLayers[i];
				layer.tick();
			}

			if (true) {
				G.camPos.x = G.player.x;
				G.camPos.y = G.player.y;
				G.camPos.z = G.player.z;
				G.camPos.r = G.player.r;

			}
 
			this.raycaster.calculateVisibleTilesAndWalls(this.world, G.player.x, G.player.y, G.player.r);

			if (this.world.gameState !== 0) {
				if (this.fadeOutColor === null) {
					if (this.world.gameState === 1) {
						this.fadeOutColor = [0.0, 0.0, 0.0, 0.0];
					}
					else {
						this.fadeOutColor = [1.0, 0.0, 0.0, 0.0];
					}
				}
				else if (this.fadeOutColor[3] < 1.0) {
					this.fadeOutColor[3] += 0.01;
				}
				else {
					this.manager.pop();
					if (this.world.gameState === 1) {
						this.manager.push(new MessageScene(this.manager, "You won!", [0.5, 0.5, 0.5, 1.0], [0.1, 0.1, 0.1, 1.0], new IntroScene(this.manager)));
					}
					else {
						this.manager.push(new MessageScene(this.manager, "Game Over", [1.0, 1.0, 1.0, 1.0], [1.0, 0.0, 0.0, 1.0], new IntroScene(this.manager)));
					}
				}
			}
		},

		renderSword: function() {
			this.texShader.use();
			mat4.identity(this.mvMatrix);
			mat4.rotate(this.mvMatrix, this.mvMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);

				mat4.translate(this.mvMatrix, this.mvMatrix, [0.7, 2.3, -1.1 + this.dd*2 -this.swordInt.getValue() * 0.7]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, 0.3, [0.0, 0.0, 1.0]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, 0.1 + this.dd*2 -this.swordInt.getValue() * Math.PI/2.0, [1.0, 0.0, 0.0]);

						this.texShader.setUniformMatrix('uPMatrix', this.pMatrix);
			this.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			this.texShader.setUniformi('uTex', 0);

			gl.disable(gl.DEPTH_TEST);
			G.textureAtlas.texture.bind();


			G.texVB.begin();

			var uvs = G.textureAtlas.getCustomTextureRegion(16, 48, 8, 19).uvs;

			G.texVB.addData([ 0.0,  0.3,  -0.5,		uvs.u1, uvs.v1]);
			G.texVB.addData([ 0.0, -0.3,  -0.5,		uvs.u2, uvs.v1]);
			G.texVB.addData([ 0.0,  0.3,  1.7,		uvs.u1, uvs.v2]);

			G.texVB.addData([ 0.0,  0.3,  1.7,		uvs.u1, uvs.v2]);
			G.texVB.addData([ 0.0, -0.3,  -0.5,		uvs.u2, uvs.v1]);
			G.texVB.addData([ 0.0, -0.3,  1.7,		uvs.u2, uvs.v2]);

				G.texVB.end();

			G.texVB.render(this.texShader, gl.TRIANGLES);
		},

		renderPistol: function() {
			this.texShader.use();
			mat4.identity(this.mvMatrix);
			mat4.rotate(this.mvMatrix, this.mvMatrix, -Math.PI/2.0, [1.0, 0.0, 0.0]);

				mat4.translate(this.mvMatrix, this.mvMatrix, [0.3, 2.3, -1.1 + this.dd*2 -this.swordInt.getValue() * 0.3]);
			mat4.rotate(this.mvMatrix, this.mvMatrix, 0.3, [0.0, 0.0, 1.0]);
							mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, -0.7]);

			mat4.rotate(this.mvMatrix, this.mvMatrix, 0.1 + this.dd*2 +this.swordInt.getValue()*0.3 * Math.PI/2.0, [1.0, 0.0, 0.0]);
				mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, 0.7]);

						this.texShader.setUniformMatrix('uPMatrix', this.pMatrix);
			this.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			this.texShader.setUniformi('uTex', 0);

			gl.disable(gl.DEPTH_TEST);
			G.textureAtlas.texture.bind();


			G.texVB.begin();

			var uvs = G.textureAtlas.getCustomTextureRegion(25, 58, 13, 8).uvs;

			G.texVB.addData([ 0.0,  0.5,  -0.5,		uvs.u1, uvs.v1]);
			G.texVB.addData([ 0.0, -0.3,  -0.5,		uvs.u2, uvs.v1]);
			G.texVB.addData([ 0.0,  0.5,  0.6,		uvs.u1, uvs.v2]);

			G.texVB.addData([ 0.0,  0.5,  0.6,		uvs.u1, uvs.v2]);
			G.texVB.addData([ 0.0, -0.3,  -0.5,		uvs.u2, uvs.v1]);
			G.texVB.addData([ 0.0, -0.3,  0.6,		uvs.u2, uvs.v2]);

				G.texVB.end();

			G.texVB.render(this.texShader, gl.TRIANGLES);
		},

		renderHud: function() {
            var width = 100;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

            mat4.ortho(this.pMatrix, 0.0, width, 0.0, height, 0.0, 10.0);
            mat4.identity(this.mvMatrix);

           	G.texShader.use();

			G.texShader.setUniformMatrix('uMVMatrix', this.mvMatrix);
			G.texShader.setUniformMatrix('uPMatrix', this.pMatrix);

      		gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			if (G.player.hurtTicker > 0) {
				G.texShader.setUniformf('uColor', [1.0, 0.0, 0.0, G.player.hurtTicker/30.0]);

				G.textureAtlas.texture.bind();

				G.texVB.begin();
				renderQuad(G.texVB, 0, 0, width, height, this.hurtTex.uvs);
				G.texVB.end();
				G.texVB.render(G.texShader, gl.TRIANGLES);
			}

			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);

			this.font.texture.bind();

			G.texVB.begin();
			this.font.setScale(3.0);
			this.font.renderString(G.texVB, "Health: ", 2.0, 5.0);
			if (G.player.keys.length > 0) {
				this.font.renderString(G.texVB, "Keys: ", 30.0, 5.0);
			}
			//this.font.renderString(G.texVB, "Debug0: " +(G.debugSelected != null ? G.debugSelected.x + ", " + G.debugSelected.y : ""), 2.0,  height - 2.0);
			//this.font.renderString(G.texVB, "Debug1: " + G.debug1, 2.0, height - 6.0);
			//this.font.renderString(G.texVB, "Debug2: " + G.debug2, 2.0, height - 10.0);
			//this.font.renderString(G.texVB, "Debug3: " + G.debug3, 2.0, height - 14.0);

			if (G.player.weapons[G.player.selectedWeaponIdx].name == "pistol") {
				this.font.renderString(G.texVB, G.player.weapons[G.player.selectedWeaponIdx].shots + " shots", width - 15, 5.0);
			}

			G.texVB.end();
			G.texVB.render(G.texShader, gl.TRIANGLES);

//--
			var iidd = G.player.treasures.length - 1;
			if (iidd >= 0 && G.player.treasureTicker > 0) {
				var alpha = smoothInterp(G.player.treasureTicker/90.0);
				var treasure = G.player.treasures[G.player.treasures.length - 1];

				G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 0.5 * alpha]);

				this.font.texture.bind();

				G.texVB.begin();
				this.font.setScale(7.0);
				this.font.renderStringCentered(G.texVB, treasure.fullName, 100, 20);

				G.texVB.end();
				G.texVB.render(G.texShader, gl.TRIANGLES);


				G.textureAtlas.texture.bind();
				G.texVB.begin();

				renderQuad(G.texVB, width/2.0 - 15, height/2.0 - 15, 30, 30, treasure.uvs[0]);

				G.texVB.end();

				G.texVB.render(G.texShader, gl.TRIANGLES);
			}

//---
			G.texShader.setUniformf('uColor', [1.0, 1.0, 1.0, 1.0]);

			G.textureAtlas.texture.bind();

			G.texVB.begin();

			for (var i=0; i<G.player.health; i++) {
				renderQuad(G.texVB, 13 + i*4, 2, 3, 3, this.heartTex.uvs);
			}
			for (var i=0; i<G.player.keys.length; i++) {
				var key = G.player.keys[i];
				renderQuad(G.texVB, 39 + i*6, 2, 5, 5, key.uvs[0]);
			}

			if (G.player.weapons[G.player.selectedWeaponIdx].name == "pistol") {
				renderQuad(G.texVB, width - 23, 2, 5, 3, this.pisTex.uvs);
			}

			G.texVB.end();

			G.texVB.render(G.texShader, gl.TRIANGLES);


		},

		calcMotionDisp: function() {
			// Walking motion
			if (G.player.isMoving()) {
				this.t += Math.PI/20.0;
			}
			else if (this.t < Math.PI/2.0-0.1 || this.t > Math.PI/2.0+0.1) {
				if (this.t > Math.PI/2.0 && this.t < Math.PI) {
					this.t -= Math.PI/8.0;
				}
				else {
					this.t += Math.PI/8.0;
				}
			}
			
			if (this.t >= 2 * Math.PI) this.t -= (2 * Math.PI);

			return 0.05 * Math.sin(this.t);
		}
	});
})();