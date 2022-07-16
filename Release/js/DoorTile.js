var DoorTile = (function() {
	return Tile.extend({
		init: function(world, x, y, floorTextureRegion, doorTextureRegions, horizontal, keyId) {
			this._super(world, x, y, floorTextureRegion);
			this.blocksVisibility = false;
			this.horizontal = horizontal;
			this.blocking = true;
			if (horizontal) {
				this.left = new Wall(this.x, this.y + 0.5, this.x + 0.5, this.y + 0.5, doorTextureRegions[0]);
				this.right = new Wall(this.x + 0.5, this.y + 0.5, this.x + 1.0, this.y + 0.5, doorTextureRegions[1]);
			}
			else {
				this.left = new Wall(this.x + 0.5, this.y, this.x + 0.5, this.y + 0.5, doorTextureRegions[0]);
				this.right = new Wall(this.x + 0.5, this.y + 0.5, this.x + 0.5, this.y + 1.0, doorTextureRegions[1]);
			}
			// Raycaster Attachement
			this.rc = {
				visible: false
			};				
			this.opened = false;
			this.keyId = keyId;
		},

		putVertexData: function(vb) {
			this.left.putVertexData(vb);
			this.right.putVertexData(vb);
		},

		putFloorVertexData: function(vb) {
			this._super(vb);
		},

		open: function() {
			if (this.opened) return;
			this.world.tickers.push(this);
			this.r = 0.0;

			this.trigBelow = false;

			if (!this.horizontal && G.player.x < this.left.xStart) {
				this.trigBelow = true;
			}
			if (this.horizontal && G.player.y < this.left.yStart) {
				this.trigBelow = true;
			}

			G.audioManager.playSound('door.ogg', 0.5);

		},

		tick: function() {
			this.r += 0.01;
			if (!this.horizontal) {
				if (this.trigBelow) {
					this.left.xEnd = this.left.xStart + Math.sin(this.r) * 0.5;
					this.left.yEnd = this.left.yStart + Math.cos(this.r) * 0.5;

					this.right.xStart = this.right.xEnd + Math.sin(this.r) * 0.5;
					this.right.yStart = this.right.yEnd - Math.cos(this.r) * 0.5;
				}
				else {
					this.left.xEnd = this.left.xStart - Math.sin(this.r) * 0.5;
					this.left.yEnd = this.left.yStart + Math.cos(this.r) * 0.5;

					this.right.xStart = this.right.xEnd - Math.sin(this.r) * 0.5;
					this.right.yStart = this.right.yEnd - Math.cos(this.r) * 0.5;
				}
			}
			else {
				if (this.trigBelow) {
					this.left.xEnd = this.left.xStart + Math.cos(this.r) * 0.5;
					this.left.yEnd = this.left.yStart + Math.sin(this.r) * 0.5;

					this.right.xStart = this.right.xEnd - Math.cos(this.r) * 0.5;
					this.right.yStart = this.right.yEnd + Math.sin(this.r) * 0.5;
				}
				else {
					this.left.xEnd = this.left.xStart + Math.cos(this.r) * 0.5;
					this.left.yEnd = this.left.yStart - Math.sin(this.r) * 0.5;

					this.right.xStart = this.right.xEnd - Math.cos(this.r) * 0.5;
					this.right.yStart = this.right.yEnd - Math.sin(this.r) * 0.5;
				}
			}
			if (this.r >= 0.3) this.blocking = false;

			if (this.r >= Math.PI/2.0 - 0.1) {
				this.world.removeTicker(this);
				this.opened = true;
			}
		}
	});
})();