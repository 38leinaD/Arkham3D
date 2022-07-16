var Player = (function() {

	return Class.extend({
		init: function(world, x, y, r) {
			this.world = world;
			this.raycaster = G.raycaster;

			this.x = x;
			this.y = y;
			this.z = 0.6;
			this.r = 0.0;
			this.health = 3;
			this.radius = 0.3;

			var pis = {name: "pistol", shots: 10, attackDelay: 30};
			var sword = {name: "sword", attackDelay: 20};

			this.weapons = [
				sword
			];
			this.selectedWeaponIdx = 0;
			this.playerMoving = false;

			this.attackDuration = -1;

			this.hurtTicker = 0;

			this.keys = [];
			this.tile = null;

			this.footStepTimer = 0;
			this.footLeft = false;
			this.treasures = [ ];
			this.treasureTicker = 0;
		},

		tick: function() {
			var intensity;

			if (this.hurtTicker > 0) {
				this.hurtTicker--;
			}

			if (this.attackDuration >= 0) {
				this.attackDuration++;
				if (this.attackDuration >= this.weapons[this.selectedWeaponIdx].attackDelay) {

					this.attackDuration = -1;
				}
			}

			this.playerMoving = false;
			var forward = 0;
			if (G.input.isDown('UP')) {
				intensity = G.input.getIntensity('UP');
				forward = 1;
				this.playerMoving = this.moveForward();
			}
			else if (G.input.isDown('DOWN')) {
				intensity = G.input.getIntensity('DOWN');

				forward = -1;
				this.playerMoving = this.moveBackward();
			}


			if (G.input.isDown('LEFT')) {
				intensity = G.input.getIntensity('LEFT');
				this.r += 0.05 * intensity;
				this.r = normalizeAngle(this.r);
			}
			else if (G.input.isDown('RIGHT')) {
				intensity = G.input.getIntensity('RIGHT');
				this.r -= 0.05 * intensity;
				this.r = normalizeAngle(this.r);
			}

			if (G.input.wasJustPressed('B')) {
				this.selectedWeaponIdx = (this.selectedWeaponIdx + 1) % this.weapons.length;
				if (this.weapons[this.selectedWeaponIdx].name === 'pistol') {
					G.audioManager.playSound('pick_up_pistol.ogg', 0.4);
				}
				else {
					G.audioManager.playSound('pick_up_sword.ogg', 0.4);
				}
			}

			this.tile = this.world.getTile(Math.floor(this.x), Math.floor(this.y));
			G.debugSelected = this.tile;

			this.footStepTimer--;
			if (this.playerMoving && this.footStepTimer <= 0) {

				this.footStepTimer = 17;
				if (this.footLeft) {
					G.audioManager.playSound('footstep_1.ogg', 0.4);
				}
				else {
					G.audioManager.playSound('footstep_2.ogg', 0.4);
				}
				this.footLeft = !this.footLeft;
			}

			if (this.treasureTicker > 0) this.treasureTicker--;
		},

		move: function(dx, dy) {

			// Check Walls
			var dxWithRadius = dx + (dx > 0.0 ? 1.0 : -1.0) * this.radius;
			var dyWithRadius = dy + (dy > 0.0 ? 1.0 : -1.0) * this.radius;
			
			var tXY = this.world.getTile(Math.floor(this.x + dxWithRadius), Math.floor(this.y + dyWithRadius));
			var tX = this.world.getTile(Math.floor(this.x + dxWithRadius), Math.floor(this.y));
			var tY = this.world.getTile(Math.floor(this.x), Math.floor(this.y + dyWithRadius));

			if (!tXY.blocking) {
				// do dx and dy
			}
			else if (!tX.blocking) {
				dy = 0.0;
			}
			else if (!tY.blocking) {
				dx = 0.0;
			}
			else {
				return false;
			}

			// Check entities
			var entitiesToCheck = this.world.getNearEntities(this.x + dx, this.y + dy);
			for (var i=0; i<entitiesToCheck.length; i++) {
				var e = entitiesToCheck[i];
				if (e.blocking) {
					if (distance(this.x + dx, this.y + dy, e.x, e.y) <= this.radius + e.radius) {
						return false;
					}
				}
			}

			this.x += dx;
				this.y += dy;
				return true;	

		},

		moveForward: function() {
			var dx = 0.0;
			var dy = 0.0;

			intensity = G.input.getIntensity('UP');
			dx = 0.08 * Math.cos(this.r) * intensity;
			dy = 0.08 * Math.sin(this.r) * intensity;

			return this.move(dx, dy);
		},

		moveBackward: function() {
			var dx = 0.0;
			var dy = 0.0;

			intensity = G.input.getIntensity('DOWN');
			dx = 0.08 * Math.cos(this.r) * -intensity;
			dy = 0.08 * Math.sin(this.r) * -intensity;

			return this.move(dx, dy);
		},

		attack: function() {
			if (this.attackDuration !== -1) return false;

			this.attackDuration = 0;

			var pd = calcDirection(G.player.r);

			if (this.weapons[this.selectedWeaponIdx].name === 'sword') {
				if (this.raycaster.selectedTile instanceof HedgeTile && vec3.distance(this.raycaster.selectedTile.center, vec3.fromValues(G.player.x, G.player.y, 0.5)) < 1.2) {
					pd = calcDirection(G.player.r);
					vec3.normalize(pd, pd);
					var dir = vec3.clone(pd);
					dir[2] = 0.4;
					vec3.scale(pd, pd, 0.3);
					var effectPos = vec3.fromValues(G.player.x, G.player.y, 0.55);
					vec3.add(effectPos, effectPos, pd);
					this.world.addParticleEffect(10, effectPos, [0.0, 0.5, 0.0, 1.0], 100, dir);

					var tile = this.raycaster.selectedTile;
					tile.health--;
					if (tile.health <= 0) {
						this.world.setTile(tile.x, tile.y, new Tile(this.world, tile.x, tile.y, tile.floorTextureRegion));
					}
				}

				if (this.raycaster.selectedEntity !== null && this.raycaster.selectedEntity instanceof NPC) {
					var entity = this.raycaster.selectedEntity;
					var entityPos = vec3.fromValues(entity.x, entity.y, entity.z + entity.h/2.0);
					var playerPos = vec3.fromValues(G.player.x, G.player.y, 0.5);
					if (vec3.distance(entityPos, playerPos) < 1.2) {
						var pd = calcDirection(G.player.r);
						vec3.normalize(pd, pd);
						var dir = vec3.clone(pd);
						dir[2] = 0.4;
						vec3.scale(pd, pd, 0.3);
						var effectPos = vec3.fromValues(G.player.x, G.player.y, Math.max(entity.z, 0.5));
						vec3.add(effectPos, effectPos, pd);
						this.world.addParticleEffect(10, effectPos, [1.0, 0.0, 0.0, 1.0], 100, dir);

						entity.hurt();

					}
				}

				if (this.raycaster.selectedTile instanceof DoorTile && vec3.distance(this.raycaster.selectedTile.center, vec3.fromValues(G.player.x, G.player.y, 0.5)) < 1.2) {
					var i=0;
					for (; i<G.player.keys.length; i++) {
						var key = G.player.keys[i];
						if (key.keyId === this.raycaster.selectedTile.keyId) {
							break;
						}
					}
					if (i <G.player.keys.length) {
						this.raycaster.selectedTile.open();
						G.player.keys.splice(i, 1);
					}
				}

				G.audioManager.playSound('swing.ogg', 0.8);

			}
			else if (this.weapons[this.selectedWeaponIdx].name === 'pistol' && this.weapons[this.selectedWeaponIdx].shots > 0) {
				var pdd = vec3.clone(pd);
				vec3.scale(pdd, pdd, 0.5);
				var pos = vec3.fromValues(G.player.x, G.player.y, 0.5);
				vec3.add(pos, pos, pdd);
				this.world.addBullet(
					[1.0, 0.5, 0.0, 1.0],
					pos,
					pd
				);
				this.weapons[this.selectedWeaponIdx].shots--;
				if (this.weapons[this.selectedWeaponIdx].shots === 0) {
					this.selectedWeaponIdx = (this.selectedWeaponIdx + 1) % this.weapons.length;
				}
				G.audioManager.playSound('pistol2.ogg', 0.8);
			}

			return true;
		},

		isMoving: function() {
			return this.playerMoving;
		},

		hurt: function() {
			this.health--;
			this.hurtTicker = 30;
			G.audioManager.playSound('player_hurt.ogg', 0.5);

			if (this.health <= 0) this.world.lost();
		},

		getWeapon: function(name) {
			for (var i=0; i<this.weapons.length; i++) {
				if (this.weapons[i].name === name) {
					return this.weapons[i];
				}
			}
			return null;
		}
	});
})();