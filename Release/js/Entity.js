var Entity = (function() {

	return Class.extend({
		init: function(world, x, y, z, w, h) {
			this.x = x;
			this.y = y;
			this.z = z;
			this.w = w;
			this.h = h;
			this.health = 5;
			this.world = world;
			this.radius = 0.25;
			this.speed = 0.01;
			this.rx = x;
			this.ry = y;
			this.rz = z;

			this.pos = vec3.fromValues(x, y, z);

			this.residentTile = this.world.getTile(Math.floor(x), Math.floor(y));

			this.uvs = [
				G.textureAtlas.getCustomTextureRegion(0, 64, 8, 8).uvs,
				G.textureAtlas.getCustomTextureRegion(8, 64, 8, 8).uvs
			];

			this.currentFrame = 0;
			this.ticker = 0;
			this.frameDuration = 20;
			this.animate = true;

			this.rc = {
				visible: false
			};		

			this.xDisp = 0.0;
			this.zDisp = 0.0;

			this.blocking = false;
			this.moving = false;

			this.name = "noset";
		},

		putVertexData: function(vb, normal) {
			uvs = this.uvs[this.currentFrame];

			vb.addData([ -this.w/2.0,  0.0,  this.rz - this.h/2.0,	 normal[0], normal[1], normal[2],	uvs.u1, uvs.v1]);
			vb.addData([ this.w/2.0, 0.0,  this.rz - this.h/2.0,	normal[0], normal[1], normal[2],	uvs.u2, uvs.v1]);
			vb.addData([ -this.w/2.0,  0.0,  this.rz + this.h/2.0,	normal[0], normal[1], normal[2],	uvs.u1, uvs.v2]);

			vb.addData([ -this.w/2.0,  0.0,  this.rz + this.h/2.0,	normal[0], normal[1], normal[2],	uvs.u1, uvs.v2]);
			vb.addData([ this.w/2.0, 0.0,  this.rz - this.h/2.0,	normal[0], normal[1], normal[2],	uvs.u2, uvs.v1]);
			vb.addData([ this.w/2.0, 0.0,  this.rz + this.h/2.0,	normal[0], normal[1], normal[2],	uvs.u2, uvs.v2]);
		},

		tick: function() {
			this.moving = false;

			if (!this.animate) return;
			
			this.ticker++;
			if (this.ticker % this.frameDuration == 0) {
				this.currentFrame = (this.currentFrame + 1) % this.uvs.length;
			}
		},

		getPos: function() {
			return this.pos;
		},

		collision: function(x, y) {
			var d = Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y));
			return (d <= this.radius);
		},

		move: function(dx, dy) {
			this.moving = true;
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
				if (e === this) continue;
				if (e.blocking) {
					if (distance(this.x + dx, this.y + dy, e.x, e.y) <= this.radius + e.radius) {
						return false;
					}
				}
			}

			if (distance(this.x + dx, this.y + dy, G.player.x, G.player.y) <= this.radius + G.player.radius) {
				return false;
			}

			this.x += dx;
			this.y += dy;

			this.rx = this.x;
			this.ry = this.y;
			this.rz = this.z;

			this.updateResidency();

			return true;	

		},

		updateResidency: function() {
			var newResidentTile = this.world.getTile(Math.floor(this.x), Math.floor(this.y));
			if (newResidentTile !== this.residentTile) {
				for (var i=0; i<this.residentTile.residentEntities.length; i++) {
					if (this.residentTile.residentEntities[i] === this) {
						this.residentTile.residentEntities.splice(i, 1);
						break;
					}
				}

				this.residentTile = newResidentTile;
				this.residentTile.residentEntities.push(this);
			}
		},

		moveForward: function() {
			var r = Math.atan2((this.x - G.player.x), (this.y - G.player.y));
			var dx = -this.speed * Math.sin(r);
			var dy = -this.speed * Math.cos(r);

			return this.move(dx, dy);
		},

		moveBackward: function() {
			var r = Math.atan2((this.x - G.player.x), (this.y - G.player.y));
			var dx = this.speed * Math.sin(r);
			var dy = this.speed * Math.cos(r);

			return this.move(dx, dy);
		},

		hurt: function() {
			this.health--;

			if (this.health <= 0) {
				this.die();
			}
		},

		die: function() {
			console.log("DIEIIDIIEIEI")
			this.world.removeEntity(this);
		}
	});
})();