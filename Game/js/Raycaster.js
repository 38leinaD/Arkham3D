var Raycaster = (function() {
	return Class.extend({
		init: function() {
			this.visibleWalls = new Array(100);
			this.visibleTiles = new Array(300);
			this.visibleEntities = new Array(300);

			this.visibleWallCount = 0;
			this.visibleTileCount = 0;
			this.visibleEntityCount = 0;

			this.selectedWall = null;
			this.selectedTile = null;
			this.selectedEntity = null;
		},

		updateViewport: function(fovx, screenColumns) {
			this.fovx = fovx;
			this.screenColumns = screenColumns;
			this.anglePerScreenColumn = (this.fovx)  / screenColumns;
		},

		calculateVisibleTilesAndWalls: function(world, x, y, angle) {
		
			for (var i=0; i<this.visibleTileCount; i++) {
				this.visibleTiles[i].rc.visible = false;
				this.visibleTiles[i] = null;
			}
			this.visibleTileCount = 0;
			
			for (var i=0; i<this.visibleWallCount; i++) {
				this.visibleWalls[i].rc.visible = false;
				this.visibleWalls[i] = null;
			}
			this.visibleWallCount = 0;

			for (var i=0; i<this.visibleEntityCount; i++) {
				this.visibleEntities[i].rc.visible = false;
				this.visibleEntities[i] = null;
			}
			this.visibleEntityCount = 0;
			
			this.selectedTile = null;
			this.selectedWall = null;
			this.selectedEntity = null;
			
			for (var i=0; i<this.screenColumns; i++) {
				var j = i - this.screenColumns/2 + 0.5;
				
				var phi = normalizeAngle(angle + j * this.anglePerScreenColumn);
				
				var hitWall = this.cast(world, x, y, phi, i == this.screenColumns/2);
				if (hitWall != null && !hitWall.rc.visible) {
					hitWall.rc.visible = true;
					this.visibleWalls[this.visibleWallCount++] = hitWall;
				}
			}
			
			// Also add tile I am standing on
			var tile = world.getTile(Math.floor(x), Math.floor(y));
			if (tile != null && !tile.rc.visible) {
				this.addVisibleTile(world, tile);
			}

			G.debug3 = "Vis: " + this.visibleEntityCount;
		},

		cast: function(world, x, y, angle, isCenterRay) {		
		
			var right = false;
			var up = false;

			if (angle >= 1.5 * Math.PI || angle < 0.5 * Math.PI) {
				right = true;
			}
			if (angle >= 0 && angle < Math.PI) {
				up = true;
			}
			
			var rayPosX = x;
			var rayPosY = y;
			
			var rayDirX = Math.cos(angle);
			var rayDirY = Math.sin(angle);
			
			//which box of the map we're in  
			var mapX = Math.floor(rayPosX);
			var mapY = Math.floor(rayPosY);
	       
			//length of ray from current position to next x or y-side
			var sideDistX;
			var sideDistY;
	       
			//length of ray from one x or y-side to next x or y-side
			var deltaDistX = Math.sqrt(1 + (rayDirY * rayDirY) / (rayDirX * rayDirX));
			var deltaDistY = Math.sqrt(1 + (rayDirX * rayDirX) / (rayDirY * rayDirY));
			var perpWallDist;
	       
			//what direction to step in x or y-direction (either +1 or -1)
			var stepX;
			var stepY;

			var hit = 0; //was there a wall hit?
			var side = 0; //was a NS or a EW wall hit?
	      
			//calculate step and initial sideDist
			if (rayDirX < 0)
			{
				stepX = -1;
				sideDistX = (rayPosX - mapX) * deltaDistX;
			}
			else
			{
				stepX = 1;
				sideDistX = (mapX + 1.0 - rayPosX) * deltaDistX;
			}
			if (rayDirY < 0)
			{
				stepY = -1;
				sideDistY = (rayPosY - mapY) * deltaDistY;
			}
			else
			{
				stepY = 1;
				sideDistY = (mapY + 1.0 - rayPosY) * deltaDistY;
			}
	      
			var tile = world.getTile(Math.floor(x), Math.floor(y));;
			var wall = null;

			// Check for entiyt on tile standing on
			if (tile != null && isCenterRay && tile.residentEntities.length > 0) {
				for (var i=0; i<tile.residentEntities.length; i++) {
					var e = tile.residentEntities[i];
					if (!e.rc.visible) {
						e.rc.visible = true;
						this.visibleEntities[this.visibleEntityCount++] = e;
					}
					if (this.selectedEntity === null) {
						this.selectedEntity = e;
					}
				}	
			}

			//perform DDA
			while (hit == 0 && mapX >= 0 && mapX < world.width && mapY >= 0 && mapY < world.height)
			{
				//jump to next map square, OR in x-direction, OR in y-direction
				if (sideDistX < sideDistY)
				{
					sideDistX += deltaDistX;
					mapX += stepX;
					side = 0;
				}
				else
				{
					sideDistY += deltaDistY;
					mapY += stepY;
					side = 1;
				}
				//Check if ray has hit a wall
				tile = world.getTile(mapX, mapY);
				if (tile == null) {

				}
				else {
					if (tile.residentEntities.length > 0) {
						for (var i=0; i<tile.residentEntities.length; i++) {
							var e = tile.residentEntities[i];
							if (!e.rc.visible) {
								e.rc.visible = true;
								this.visibleEntities[this.visibleEntityCount++] = e;
							}
							if (isCenterRay && this.selectedEntity === null) {
								this.selectedEntity = e;
							}
						}	
					}

					if (tile.blocksVisibility) {
						hit = 1;
					}
					
					if (!tile.rc.visible) {
						this.addVisibleTile(world, tile);
					}
					
					if (tile instanceof WallTile) {
						if (side == 1 && up) {
							wall = tile.walls[2];
						}
						else if (side == 1 && !up) {
							wall = tile.walls[0];
						}
						else if (side == 0 && right) {
							wall = tile.walls[3];
						}
						else if (side == 0 && !right) {
							wall = tile.walls[1];
						}
						
						if (isCenterRay && this.selectedWall == null) this.selectedWall = wall; 
					}
					
					if (isCenterRay && this.selectedTile == null && tile.blocking) this.selectedTile = tile;

				}

			}

			//Calculate distance projected on camera direction (oblique distance will give fisheye effect!)
			if (side == 0) {
				perpWallDist = Math.abs((mapX - rayPosX + (1 - stepX) / 2) / rayDirX);
			}
			else {
				perpWallDist = Math.abs((mapY - rayPosY + (1 - stepY) / 2) / rayDirY);
			}
			
			return wall;
		},

		wallDistance: function(world, x, y, angle) {		
		
			var right = false;
			var up = false;

			if (angle >= 1.5 * Math.PI || angle < 0.5 * Math.PI) {
				right = true;
			}
			if (angle >= 0 && angle < Math.PI) {
				up = true;
			}
			
			var rayPosX = x;
			var rayPosY = y;
			
			var rayDirX = Math.cos(angle);
			var rayDirY = Math.sin(angle);
			
			//which box of the map we're in  
			var mapX = Math.floor(rayPosX);
			var mapY = Math.floor(rayPosY);
	       
			//length of ray from current position to next x or y-side
			var sideDistX;
			var sideDistY;
	       
			//length of ray from one x or y-side to next x or y-side
			var deltaDistX = Math.sqrt(1 + (rayDirY * rayDirY) / (rayDirX * rayDirX));
			var deltaDistY = Math.sqrt(1 + (rayDirX * rayDirX) / (rayDirY * rayDirY));
			var perpWallDist;
	       
			//what direction to step in x or y-direction (either +1 or -1)
			var stepX;
			var stepY;

			var hit = 0; //was there a wall hit?
			var side = 0; //was a NS or a EW wall hit?
	      
			//calculate step and initial sideDist
			if (rayDirX < 0)
			{
				stepX = -1;
				sideDistX = (rayPosX - mapX) * deltaDistX;
			}
			else
			{
				stepX = 1;
				sideDistX = (mapX + 1.0 - rayPosX) * deltaDistX;
			}
			if (rayDirY < 0)
			{
				stepY = -1;
				sideDistY = (rayPosY - mapY) * deltaDistY;
			}
			else
			{
				stepY = 1;
				sideDistY = (mapY + 1.0 - rayPosY) * deltaDistY;
			}
	      
			//perform DDA
			while (hit == 0 && mapX >= 0 && mapX < world.width && mapY >= 0 && mapY < world.height)
			{
				//jump to next map square, OR in x-direction, OR in y-direction
				if (sideDistX < sideDistY)
				{
					sideDistX += deltaDistX;
					mapX += stepX;
					side = 0;
				}
				else
				{
					sideDistY += deltaDistY;
					mapY += stepY;
					side = 1;
				}
				//Check if ray has hit a wall
				var tile = world.getTile(mapX, mapY);
				if (tile == null) {

				}
				else {

					if (tile.blocksVisibility) {
						hit = 1;
					}
				}
			}

			//Calculate distance projected on camera direction (oblique distance will give fisheye effect!)
			if (side == 0) {
				perpWallDist = Math.abs((mapX - rayPosX + (1 - stepX) / 2) / rayDirX);
			}
			else {
				perpWallDist = Math.abs((mapY - rayPosY + (1 - stepY) / 2) / rayDirY);
			}
			
			return perpWallDist;
		},

		addVisibleTile: function(world, tile) {
			tile.rc.visible = true;
			this.visibleTiles[this.visibleTileCount++] = tile;
		}

	});
})();