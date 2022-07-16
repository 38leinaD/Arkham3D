// Note: the deeper level we get in the spanning tree, the more enemies we put into the rooms
// spaces that are empty after deletion: fill up with non-rectangular rooms.
var WorldGenerator = (function() {

	var Tile = function() {
		this.portal = null;
		this.room = null;
		this.wallCode = 0;
		this.floorCode = 0;
		this.entity = null;
	};

	var Room = function(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.cx = x + w/2.0;
		this.cy = y + h/2.0;
		this.neighbors = [];
		this.portals = [];
		this.riddle = 0;
	};

	var Portal = function(x, y, w, h, horizontal, rooms) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.horizontal = horizontal;
		this.rooms = rooms;
	}

	function pointIsInRegion(x, y, rx, ry, rw, rh) {
		return x >= rx && x<= rx + rw && y >= ry && y <= ry + rh;
	}

	function intersect(ax, ay, aw, ah, bx, by, bw, bh) {
		return !(bx > ax + aw
        || bx + bw < ax
        || by > ay + ah
        || by + bh < ay);
	}

	function genObject(name) {
		return {"name": name, "properties": {}};
	}

	var RedBrickWallType = [1];
	var GrayGravelWallType = [2, 3];
	var WoodsWallType = [4];

	var Gray1FloorType = [33];
	var Gray2FloorType = [34];
	var SoilFloorType = [36];

	var GenericFloors = [Gray1FloorType, Gray2FloorType];

	var RoomNatures = [
		{
			wallType: RedBrickWallType,
			floorTypes: GenericFloors
		},

		{
			wallType: GrayGravelWallType,
			floorTypes: GenericFloors
		}
	];

	return Class.extend({
		init: function(progressPoster) {
			this.roomDecorators = [
				this.decorateRoom_Hedges,
				this.decorateRoom_CenterPole,
				this.decorateRoom_Seperator
			];
			this.progressPoster = progressPoster;
		},

		generate: function(config) {
			this.w = config.width;
			this.h = config.height;

			this.tileConfigs = new Array(this.w * this.h);
			this.rooms = new Array();
			this.portals = new Array();

			if (RNG == null) {
				RNG = new RandomNumberGenerator(config.seed);
			}

			if (this.progressPoster != null) this.progressPoster.postMessage("Generating random dungeons...");

			var i=0;
			// Fill map up with random-size rooms until there is no free space left
			while(true) {
				var rw = Math.floor(5 + RNG.next() * 5);
				var rh = Math.floor(5 + RNG.next() * 5);
				i++;
				//if (i> 100) break;
				var room = null;
				while (rw > 4 && rh > 4) {
					room = this.findRoomForRoom(rw, rh);
					if (room == null) {
						rw--;
						rh--;
						// console.log("trying with lesser size "+rw + ", " + rh);
					}
					else {
						break;
					}
				}

				if (room == null) {
					// console.log("No room found anymore for size " + rw + ", " + rh + ".");
					break;
				}

				this.rooms.push(room);
				
			}

			// Delete some random rooms so the world is not too full
			var numRoomsDelete = Math.floor(this.rooms.length/5.0);
			for (var i=0; i<numRoomsDelete; i++) {
				this.rooms.splice(Math.floor(RNG.next()*this.rooms.length), 1);
			}

			for (var i=0; i<this.rooms.length; i++) {
				this.placeRoomTiles(this.rooms[i]);
			}

			if (this.progressPoster != null) this.progressPoster.postMessage("Generating portals...");


			// Calc maximum room connectivity
			for (var i=0; i<this.rooms.length; i++) {
				for (var j=0; j<this.rooms.length; j++) {
					if (i==j) continue;
					var r1 = this.rooms[i];
					var r2 = this.rooms[j];
					var xOverlap = Math.min(r1.x + r1.w, r2.x + r2.w) - Math.max(r1.x, r2.x);
					var xOverlapStart = Math.max(r1.x, r2.x);
					var yOverlap = Math.min(r1.y + r1.h, r2.y + r2.h) - Math.max(r1.y, r2.y);
					var yOverlapStart = Math.max(r1.y, r2.y);
					var xRoomDistance = (r2.x - (r1.x + r1.w));
					var yRoomDistance = (r2.y - (r1.y + r1.h));

					var portal = null;
					if (xOverlap >= 3 && yRoomDistance > 0 && this.regionIsEmpty(xOverlapStart, r1.y + r1.h, xOverlap, yRoomDistance)) {
						// r1 is bottom; r2 is top room based on check: yRoomDistance > 0
						var play = xOverlap - 3;
						//xOverlapStart = 0;
						xOverlap = 3;
						xOverlapStart += Math.floor(play * RNG.next());
						portal = new Portal(xOverlapStart, r1.y + r1.h - 1, xOverlap, yRoomDistance + 2, false, [r1, r2]);
						if (portal.h > 8) portal = null; // we don't want too long portal hallways
					}
					if (yOverlap >= 3 && xRoomDistance > 0 && this.regionIsEmpty(r1.x + r1.w, yOverlapStart, xRoomDistance, yOverlap)) {
						var play = yOverlap - 3;

						yOverlap = 3;
						yOverlapStart += Math.floor(play * RNG.next());

						portal = new Portal(r1.x + r1.w - 1, yOverlapStart, xRoomDistance + 2, yOverlap, true, [r1, r2]);
						if (portal.w > 8) portal = null; // we don't want too long portal hallways
					}

					if (portal !== null) {
						r1.neighbors.push(r2);
						r2.neighbors.push(r1);

						r1.portals.push(portal);
						r2.portals.push(portal);

						this.portals.push(portal);
						this.placePortalTiles(portal);
					}
				}
			}

			// How to choose root?
			if (this.progressPoster != null) this.progressPoster.postMessage("Generating spanning tree...");
			
			this.constructSpanningTree(this.rooms[0]);
			this.updateConnectivityBasedOnTree();
			this.carvePortals();

			if (this.progressPoster != null) this.progressPoster.postMessage("Beautifying dungeons...");

			this.beutifyRooms();
			if (this.progressPoster != null) this.progressPoster.postMessage("Placing treasures and door...");

			this.placeTreasuresAndLockUp();
			if (this.progressPoster != null) this.progressPoster.postMessage("Placing entities...");

			this.placeRandomGoodies();
			this.placeRandomEnemies();

			this.findSpawn();
		},

		beutifyRooms: function() {
			// Give rooms a "style"
			for (var i=0; i<this.rooms.length; i++) {
				var room = this.rooms[i];
				var nature = RoomNatures[Math.floor(RoomNatures.length * RNG.next())];
				room.nature = nature;
				var floorNature = nature.floorTypes[Math.floor(nature.floorTypes.length * RNG.next())];
				for (var x=room.x; x<room.x + room.w; x++) {
					for (var y=room.y; y<room.y + room.h; y++) {
						var tc = this.tileConfigs[y * this.w + x];

						if (tc.wallCode > 0) tc.wallCode = nature.wallType[Math.floor(nature.wallType.length * RNG.next())];
						tc.floorCode = floorNature[Math.floor(floorNature.length * RNG.next())];
					}
				}
			}

			// Style portals based on the style of one of the rooms it connects (randomly choosen)
			for (var i=0; i<this.portals.length; i++) {
				var portal = this.portals[i];
				var room = portal.rooms[Math.floor(portal.rooms.length * RNG.next())];
				var nature = room.nature;
				for (var x=portal.x; x<portal.x + portal.w; x++) {
					for (var y=portal.y; y<portal.y + portal.h; y++) {
						var tc = this.tileConfigs[y * this.w + x];
						
						if (portal.horizontal) {
							if (y === portal.y || y === portal.y + portal.h - 1) {
								tc.wallCode = nature.wallType[Math.floor(nature.wallType.length * RNG.next())];
							}
						}
						else {
							if (x === portal.x || x === portal.x + portal.w - 1) {
								tc.wallCode = nature.wallType[Math.floor(nature.wallType.length * RNG.next())];
							}
						}

						if (x > portal.x && x < portal.x + portal.w && y > portal.y && y < portal.y + portal.h) {
							var roomTile = this.tileConfigs[room.y * this.w + room.x]; // get some tile of the room
							tc.floorCode = roomTile.floorCode;
						}
					}
				}
			}

			// Add some "character" to the rooms
			for (var i=0; i<this.rooms.length; i++) {
				var room = this.rooms[i];

				var decoratorFunc = this.roomDecorators[Math.floor(this.roomDecorators.length * RNG.next())];
				decoratorFunc.call(this, room);				
			}
		},

		// Random hedges
		decorateRoom_Hedges: function(room) {
			if (room.w >= 4 && room.h >= 4) {
				for (var x=room.x + 1; x<room.x + room.w - 1; x++) {
					for (var y=room.y + 1; y<room.y + room.h - 1; y++) {
						var tc = this.tileConfigs[y * this.w + x];
						if (tc.wallCode > 0) continue;

						// Add some hedges
						if (RNG.next() > 0.8) {
							tc.wallCode = 17;
							tc.floorCode = 36;
						}
					}
				}
				return true;
			}
			else {
				return false;
			}
		},

		// A centered structure that is blocking the few
		decorateRoom_CenterPole: function(room) {
			if (room.w >= 5 && room.h >= 5) {
				var wPlay = room.w - 4;
				var w = Math.floor(wPlay * RNG.next());
				var xStart = Math.floor(room.x + Math.floor(room.w/2.0) - w/2.0);
				var hPlay = room.h - 4;
				var h = Math.floor(hPlay * RNG.next());
				var yStart = Math.floor(room.y + Math.floor(room.h/2.0) - h/2.0);

				var useWoods = RNG.next() > 0.5 ? true : false;

				for (var x=xStart; x<xStart + w; x++) {
					for (var y=yStart; y<yStart + h; y++) {
						var tc = this.tileConfigs[y * this.w + x];
						if (tc.wallCode > 0) continue;
						if (useWoods) {
							tc.wallCode = WoodsWallType[0];
							tc.floorCode = SoilFloorType[0];
						}
						else {
							tc.wallCode = room.nature.wallType[0];
						}
					}
				}
				return true;
			}
			else {
				return false;
			}
		},

		// A seperator that splits the room
		decorateRoom_Seperator: function(room) {
			if (room.w >= 5 || room.h >= 5) {
				var hSplit;
				var split;
				if (room.w > room.h) {
					hSplit = false;
					split = room.x + Math.floor(room.w/2.0);

					if (this.tileConfigs[room.y * this.w + split].portal !== null) return false; // Wall would block a portal

					var useWoods = RNG.next() > 0.5 ? true : false;

					for (var y=room.y + 1; y<room.y + room.h - 2; y++) {
						var tc = this.tileConfigs[y * this.w + split];
						if (tc.wallCode > 0) continue;

						if (useWoods) {
							tc.wallCode = WoodsWallType[0];
							tc.floorCode = SoilFloorType[0];
						}
						else {
							tc.wallCode = room.nature.wallType[0];
						}
					}

				}
				else {
					hSplit = true;
					split = room.y + Math.floor(room.h/2.0);

					if (this.tileConfigs[split * this.w + room.x].portal !== null) return false; // Wall would block a portal

					for (var x=room.x + 1; x<room.x + room.w - 2; x++) {
						var tc = this.tileConfigs[split * this.w + x];
						if (tc.wallCode > 0) continue;
						tc.wallCode = room.nature.wallType[0];
					}
				}

				
				return true;
			}
			else {
				return false;
			}
		},

		findSpawn: function() {
			var room = this.rooms[0];
			this.spawn = {x: 0.0, y: 0.0, r: 0.0};
			for (var x=room.x; x<room.x + room.w; x++) {
				for (var y=room.y; y<room.y + room.h; y++) {
					var tc = this.tileConfigs[y * this.w + x];
					if (tc.wallCode === 0 && tc.entity === null) {
						this.spawn.x = x + 0.5;
						this.spawn.y = y + 0.5;
						this.spawn.r = 0.0;
						// console.log("Placing spawn @ " + this.spawn.x + ", " + this.spawn.y);
						return;
					}
				}
			}
		},

		// Places the seven treasures in the rooms (preferably in the leafs of the spanning tree),
		// lock it up with gates and sprinkel keys on map
		placeTreasuresAndLockUp: function() {
			var leafs = [];
			var treasureNodes = [];
			for (var i=0; i<this.rooms.length; i++) {
				var room = this.rooms[i];
				if (room.children.length === 0) {
					leafs.push(room);
				}
			}
			var treasureNames = ['skull', 'gold', 'goblet', 'cross', 'spear', 'medal'];
			for (var i=0; i<6; i++) {
				var treasure = genObject("treasure");
				treasure.properties.type = treasureNames.pop();
				var leaf = leafs[Math.floor(leafs.length * RNG.next())];
				this.placeRandomlyInRoom(leaf, treasure);
				treasureNodes.push(leaf);
			}

			// If we don't have leafes left, place the rest somewhere else
			while (treasureNames.length > 0) {
				var room = this.rooms[Math.floor(this.rooms.length * RNG.next())];
				var treasure = genObject("treasure");
				treasure.properties.type = treasureNames.pop();
				this.placeRandomlyInRoom(room, treasure);
				treasureNodes.push(room);
			}

			var doors = [{color: "gold", wallCodes: [20, 22]}, {color: "red", wallCodes: [24, 26]}, {color: "blue", wallCodes: [28, 30]}];
			var lockedRooms = [];

			for (var i=0; i<3; i++) {
				var tr = treasureNodes[Math.floor(treasureNodes.length * RNG.next())];
				var unlockedRoom = tr.parent;
				var lockedRoom = tr;
				var door = doors[i];

				if (tr.rootDistance > 5) {
					var up = Math.floor(RNG.next() * 3);
					while (up-- > 0) {
						lockedRoom = unlockedRoom;
						unlockedRoom = lockedRoom.parent; // place door a little away from actual treausre
					}
				}

				lockedRooms.push(lockedRoom);

				for (var j=0; j<lockedRoom.portals.length; j++) {
					var portal = lockedRoom.portals[j];
					if ((portal.rooms[0] == lockedRoom && portal.rooms[1] == unlockedRoom) ||
						(portal.rooms[1] == lockedRoom && portal.rooms[0] == unlockedRoom)) {

						// We place door at this portal
						var doorX = portal.x + Math.floor(portal.w/2.0);
						var doorY = portal.y + Math.floor(portal.h/2.0);
						var tc = this.tileConfigs[doorY * this.w + doorX];

						if (portal.horizontal) {
							tc.wallCode = door.wallCodes[1];
						}
						else {
							tc.wallCode = door.wallCodes[0];
						}
					}
				}
			}

			for (var i=0; i<lockedRooms.length; i++) {
				this.markLocked(lockedRooms[i]);
			}

			var unlockedRooms = [];
			for (var i=0; i<this.rooms.length; i++) {
				var room = this.rooms[i];
				if (room.riddle === 0) {
					unlockedRooms.push(room);
				}
			}

			for (var i=0; i<3; i++) {
				var door = doors[i];
				var keyObj = genObject("key");
				keyObj.properties.keyId = door.color;

				var room = unlockedRooms[Math.floor(unlockedRooms.length * RNG.next())];
				this.placeRandomlyInRoom(room, keyObj);	
			}
		},

		markLocked: function(room) {
			room.riddle = 1;
			for (var i=0; i<room.children.length; i++) {
				this.markLocked(room.children[i]);
			}
		},

		placeRandomlyInRoom: function(room, entity) {
			var potentialTiles = [];
			for (var x=room.x; x<room.x + room.w; x++) {
				for (var y=room.y; y<room.y + room.h; y++) {
					var tc = this.tileConfigs[y * this.w + x];
					if (tc.wallCode === 0 && tc.entity === null) {
						potentialTiles.push(tc);
					}
				}
			}
			//if (potentialTiles.length === 0) console.log("CANNOT PLACE ENTITY BECAUSE ROOM IS FULL!!!");
			var tile = potentialTiles[Math.floor(potentialTiles.length * RNG.next())];
			tile.entity = entity;
		},

		placeRandomGoodies: function() {
			var I = Math.floor(this.rooms.length * RNG.next());
			var goodies = [];
			for (var i=0; i<I; i++) {
				var obj = RNG.next() > 0.5 ? genObject("health") : genObject("ammo");
				goodies.push(obj);
			}

			while (goodies.length > 0) {
				var room = this.rooms[Math.floor(this.rooms.length * RNG.next())];

				this.placeRandomlyInRoom(room, goodies.pop());
			}
		},

		placeRandomEnemies: function() {
			for (var i=1; i<this.rooms.length; i++) {
				var room = this.rooms[i];
				var difficulty = room.rootDistance * ((room.w - 2) * (room.h - 2)) / 8.0;

				while (difficulty > 0) {
					var enemy = this.generateRandomEnemy(difficulty);

					difficulty -= enemy.difficulty;
					this.placeRandomlyInRoom(room, enemy);
	
				}
			}
		},

		generateRandomEnemy: function(max) {
			var r = Math.floor(RNG.next() * Math.min(max, 6));
			var obj;
			if (r >= 0 && r < 1) {
				obj = genObject("bat");
				obj.difficulty = 1;
			}
			else if (r >= 1 && r < 2) {
				obj = genObject("snake");
				obj.difficulty = 2;
			}
			else if (r >= 2 && r < 4) {
				obj = genObject("wraith");
				obj.difficulty = 4;
			}
			else if (r >= 4 && r < 6) {
				obj = genObject("acolyte");
				obj.difficulty = 6;
			}
			return obj;
		},

		// BFS Spanning tree
		constructSpanningTree: function(root) {
			for (var i=0; i<this.rooms.length; i++) {
				var room = this.rooms[i];
				room.bfsColor = 0;
				room.rootDistance = 10000; // practial infinity
				room.parent = null;
				room.children = [];
			}
			root.bfsColor = 1;
			root.rootDistance = 0;
			root.parent = null;

			var Q = [];
			Q.push(root);
			
			while (Q.length > 0) {
				var u = Q.shift();
				for (var i=0; i<u.neighbors.length; i++) {
					var v = u.neighbors[i];
					if (v.bfsColor === 0) {
						v.bfsColor = 1;
						v.rootDistance = u.rootDistance + 1;
						v.parent = u;
						u.children.push(v);
						Q.push(v);
					}
				}
				u.bfsColor = 2;
			}
		},

		carvePortals: function() {
			for (var i=0; i<this.portals.length; i++) {
				var p = this.portals[i];

				if (p.horizontal) {
					this.carveOut(p.x, p.y + 1, p.w, p.h - 2);
				}
				else {
					this.carveOut(p.x + 1, p.y, p.w - 2, p.h);
				}
			}
		},

		updateConnectivityBasedOnTree: function() {
			var removedPortals = [];
			var removedRooms = [];
			var newPortals = [];
			for (var i=0; i<this.rooms.length; i++) {
				this.rooms[i].neighbors = [];
				this.rooms[i].portals = [];
			}

			for (var i=0; i<this.rooms.length; i++) {
				var r = this.rooms[i];

				if (r.parent !== null) {
					r.neighbors.push(r.parent);
					r.parent.neighbors.push(r);

					for (var j=0; j<this.portals.length; j++) {
						var portal = this.portals[j];
						if ((portal.rooms[0] === r && portal.rooms[1] === r.parent) || (portal.rooms[1] === r && portal.rooms[0] === r.parent)) {
							newPortals.push(portal);
							r.portals.push(portal);
							r.parent.portals.push(portal);
							break;
						}
					}
				}
				else if (r.bfsColor === 0) {
					removedRooms.push(r);
					this.rooms.splice(i, 1);
				}
			}

			for (var j=0; j<this.portals.length; j++) {
				var pp = this.portals[j];
				var found = false;
				for (var k=0; k<newPortals.length; k++) {
					var ip = newPortals[k];
					if (pp === ip) {
						found = true;
						break;
					}
				}

				if (!found) {
					removedPortals.push(pp);
				}
			}

			for (var x=0; x<this.w; x++) {
				for (var y=0; y<this.h; y++) {
					var tile = this.tileConfigs[y * this.w + x];

					if (tile != null && tile.portal !== null) {
						for (var i=0; i<removedPortals.length; i++) {
							var p = removedPortals[i];

							if (p === tile.portal) {
								tile.portal = null;
								break;
							}
						}
					}
				}
			}

			// todo: remove rooms and portals that are not reachable from spawn
			for (var i=0; i<removedRooms.length; i++) {
				var r = removedRooms[i];
				this.deleteRegion(r.x, r.y, r.w, r.h);
			}

			this.portals = newPortals;
			this.removedPortals = removedPortals;


			if (this.remmovedRooms > 5) throw "Bad generation";
			// console.log("Number of removed portals: " + this.removedPortals.length);
			// console.log("Number of removed rooms: " + removedRooms.length);
		},

		findRoomForRoom: function(w, h) {
			// console.log("findRoomForRoom(" + w + ", " + h + ")");
			for (var x=0; x<this.w - w; x++) {
				for (var y=0; y<this.h - h; y++) {
					var conflict = false;
					
					for (var i=0; i<this.rooms.length; i++) {
						var room = this.rooms[i];

						if (intersect(x, y, w, h, room.x, room.y, room.w, room.h)) {
							conflict = true;
							break;
						}
					}

					if (!conflict) {
						// console.log("Found room @ " + x + ", " + y);
						return new Room(x, y, w, h);
					}
				}
			}

			return null;
		},

		placeRoomTiles: function(room) {
			for (var x=room.x; x<room.x + room.w; x++) {
				for (var y=room.y; y<room.y + room.h; y++) {
					var tile = new Tile();
					tile.room = room;

					if (x==room.x || x==room.x + room.w - 1 || y==room.y || y==room.y + room.h - 1) {
						tile.wallCode = 1;
						tile.floorCode = 33;
					}
					else {
						tile.floorCode = 33;
					}
					this.tileConfigs[y * this.w + x] = tile;
				}
			}
		},

		placePortalTiles: function(portal) {
			for (var x=portal.x; x<portal.x + portal.w; x++) {
				for (var y=portal.y; y<portal.y + portal.h; y++) {
					
					var tile = this.tileConfigs[y * this.w + x];

					if (tile == null) {
						tile = new Tile();
						tile.floorCode = 34;
						this.tileConfigs[y * this.w + x] = tile;
					}

					if (portal.horizontal) {
						if (y === portal.y || y === portal.y + portal.h - 1) {
							tile.wallCode = 2;
						}
					}
					else {
						if (x === portal.x || x === portal.x + portal.w - 1) {
							tile.wallCode = 2;
						}
					}

					tile.portal = portal;
				}
			}
		},

		regionIsEmpty: function(x, y, w, h) {
			for (var xx=x; xx<x + w; xx++) {
				for (var yy=y; yy<y + h; yy++) {
					var tile = this.tileConfigs[yy * this.w + xx];
					if (tile != null && tile.wallCode > 0) return false;
				}
			}
			return true;
		},

		carveOut: function(x, y, w, h) {
			for (var xx=x; xx<x + w; xx++) {
				for (var yy=y; yy<y + h; yy++) {
					var tc = this.tileConfigs[yy * this.w + xx];
					if (tc !== null) {
						tc.wallCode = 0;
					}
				}
			}
		},

		deleteRegion: function(x, y, w, h) {
			for (var xx=x; xx<x + w; xx++) {
				for (var yy=y; yy<y + h; yy++) {
					this.tileConfigs[yy * this.w + xx] = null;
				}
			}
		},

		export: function(template) {

			this.worldConfig = template;

			this.worldConfig.width = this.w;
			this.worldConfig.height = this.h;

			for (var i=0; i<this.worldConfig.layers.length; i++) {
				var layer = this.worldConfig.layers[i];
				layer.width = this.w;
				layer.height = this.h;
			}

			// spawn
			this.worldConfig.layers[2].objects[0].x = 16 * this.spawn.x;
			this.worldConfig.layers[2].objects[0].y = 16 * this.spawn.y;
			this.worldConfig.layers[2].objects[0].properties.r = this.spawn.r;

			var floorLayer = this.worldConfig.layers[0];
			var mainLayer = this.worldConfig.layers[1];
			for (var y=0; y<this.h; y++) {
				for (var x=0; x<this.w; x++) {
					var config = this.tileConfigs[y * this.w + x];
					var tileCode = 0;
					if (config != null) {
						tileCode = config.floorCode;
					}
					floorLayer.data.push(tileCode);
				}
			}

			for (var y=0; y<this.h; y++) {
				for (var x=0; x<this.w; x++) {
					var config = this.tileConfigs[y * this.w + x];

					var tileCode = 0;
					if (config != null) {
						tileCode = config.wallCode;
					}
					mainLayer.data.push(tileCode);
				}
			}

			for (var y=0; y<this.h; y++) {
				for (var x=0; x<this.w; x++) {
					var config = this.tileConfigs[y * this.w + x];

					if (config != null && config.entity != null) {
						var tiledObject = config.entity;
						tiledObject.type = "";
						tiledObject.visible = "true";
						tiledObject.width = 16;
						tiledObject.height = 16;
						tiledObject.x = x * 16;
						tiledObject.y = y * 16;
						this.worldConfig.layers[2].objects.push(tiledObject);
					}
				}
			}

			return this.worldConfig;
		}
	});
})();