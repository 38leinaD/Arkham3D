var World = (function() {

	function getTiledLayer(tiled, layerName) {
        for (var i=0; i<tiled.layers.length; i++) {
            var layer = tiled.layers[i];
            if (layer.name === layerName) {
                return layer;
            }
        }
    }

	return Class.extend({
		init: function(config) {
			this.width = config.width;
            this.height = config.height;

            var tileSize = config.tilewidth;

			var tiledMainLayer = getTiledLayer(config, 'main');
			var tiledFloorLayer = getTiledLayer(config, 'floor');
            var tiledObjLayer = getTiledLayer(config, 'objects');

			this.tiles = new Array(tiledMainLayer.data.length);

            this.entities = [];
            this.tickers = [];

            this.gameState = 0; // 1: won 2: lost

            this.particleCache = [];
            for (var i=0; i<100; i++) {
                this.particleCache.push({
                    color: [1.0, 1.0, 1.0, 1.0],
                    position: vec3.create(),
                    countdown: 0,
                    velocity: vec3.create(),
                    fadeOutCountdownValue: 20                 
                });
            }
            this.particles = [];
            this.bullets = [];

			for (var i=0; i<tiledMainLayer.data.length; i++) {
                var tile = null;
                var mainCode = tiledMainLayer.data[i];
                var floorCode = tiledFloorLayer.data[i];

                var x = Math.floor(i % this.width);
                var y = this.height - 1 - Math.floor(i / this.width);

                var mainTextureRegion = null;
                var floorTextureRegion = null;

                if (mainCode > 0) {
                	mainTextureRegion = G.textureAtlas.getTextureRegion(mainCode - 1);
                }
                if (floorCode > 0) {
                	floorTextureRegion = G.textureAtlas.getTextureRegion(floorCode - 1);
                }

                var props = config.tilesets[0].tileproperties[""+(mainCode-1)]

                if (props !== undefined) {
                    if (props.type === 'hedge') {
                        tile = new HedgeTile(this, x, y, floorTextureRegion, [G.textureAtlas.getTextureRegion(mainCode - 1), G.textureAtlas.getTextureRegion(mainCode ), G.textureAtlas.getTextureRegion(mainCode + 1)]);
                    }
                    else if (props.type === 'door') {
                        var orientation = props.orientation !== undefined ? (props.orientation === 'vertical' ? false : true) : true;
                        var keyId = props.keyId;
                        console.log("door with id " + keyId);
                        tile = new DoorTile(this, x, y, floorTextureRegion, [G.textureAtlas.getTextureRegion(mainCode - 1), G.textureAtlas.getTextureRegion(mainCode)], orientation, keyId);
                    }
                }
                
                if (tile === null) {
                    if (mainCode > 0) {
                        tile = new WallTile(this, x, y, floorTextureRegion, mainTextureRegion);
                    }
                    else {
                        tile = new Tile(this, x, y, floorTextureRegion);
                    }
                }

                if (props !== undefined) {
                    if (props.opaque === 'false') {
                        tile.blocksVisibility = false;
                    }
                    else if (props.opaque === 'true') {
                        tile.blocksVisibility = true;
                    }
                }

             this.tiles[y * this.width + x] = tile;
            }

            var objects = tiledObjLayer.objects;
            for (var i=0; i<objects.length; i++) {
                var obj = objects[i];
                var x = obj.x / tileSize + 0.5;
                var y = this.height - 1 - obj.y / tileSize + 0.5;

                if (obj.name === 'player_spawn') {
                    G.player = new Player(this, x, y);

                    if (obj.properties !== undefined && obj.properties.r !== undefined) {
                        G.player.r = obj.properties.r / 360.0 * 2 * Math.PI;
                    }
                }
                else if (obj.name === 'snake') {
                    this.addEntity(new Snake(this, x, y));
                }
                else if (obj.name === 'wraith') {
                    this.addEntity(new Wraith(this, x, y));
                }
                else if (obj.name === 'acolyte') {
                    this.addEntity(new Acolyte(this, x, y));
                }
                else if (obj.name === 'bat') {
                    this.addEntity(new Bat(this, x, y));
                }
                else if (obj.name === 'ammo') {
                    this.addEntity(new Ammo(this, x, y));
                }
                else if (obj.name === 'health') {
                    this.addEntity(new Health(this, x, y));
                }
                else if (obj.name === 'treasure') {
                    console.log("Adding treasure");
                    this.addEntity(new Treasure(this, x, y, obj.properties.type));
                }
                else if (obj.name === 'key') {
                    console.log("KEY with id " + obj.properties.keyId);
                    this.addEntity(new Key(this, x, y, obj.properties.keyId));
                }
            }
		},

        addParticleEffect: function(count, pos, color, lifetime, dir) {
            var pCount = Math.min(count, this.particleCache.length);
            if (pCount > 0) {
                for (var i=0; i<pCount; i++) {
                    var p = this.particleCache.pop();
                    p.color = color.slice();
                    p.position = vec3.clone(pos);
                    p.velocity = vec3.fromValues(Math.random() * 0.1 * dir[1], Math.random() * 0.1 * dir[0], Math.random() * 0.1 * dir[2]);
                    p.countdown = lifetime + Math.floor(Math.random() * 20);
                    this.particles.push(p);
                }
            }
            else {
                console.log("[WARN] Particle Cache Empty!!!");
            }
        },

        addEntity: function(e) {
            this.entities.push(e);
            var tile = this.getTile(Math.floor(e.x), Math.floor(e.y));
            tile.residentEntities.push(e);
        },

        addBullet: function(color, position, trajectory) {
            var v = vec3.clone(trajectory);
            vec3.scale(v, v, 0.15);
            this.bullets.push({
                "color": color,
                "position": vec3.clone(position),
                "velocity": v
            });
        },

        removeEntity: function(e) {
             var i = 0;
             for (; i<this.entities.length; i++) {
                if (e === this.entities[i]) break;
            }

            if (i < this.entities.length) {
                this.entities.splice(i, 1);
            }

            var tile = e.residentTile;
             var i = 0;
             for (; i<tile.residentEntities.length; i++) {
                if (e === tile.residentEntities[i]) break;
            }

            if (i < tile.residentEntities.length) {
                tile.residentEntities.splice(i, 1);
            }
        },

        removeTicker: function(e) {
            var i = 0;
            for (; i<this.tickers.length; i++) {
                if (e === this.tickers[i]) break;
            }

            if (i < this.tickers.length) {
                this.tickers.splice(i, 1);
            }
        },

        won: function() {
            this.gameState = 1;
        },

        lost: function() {
            this.gameState = 2;
        },

		tick: function() {
            if (this.gameState === 0) G.player.tick();

            for (var i=0; i<this.entities.length; i++) {
                this.entities[i].tick();
            }

            for (var i=0; i<this.tickers.length; i++) {
                this.tickers[i].tick();
            }


            for (var i=0; i<this.bullets.length; i++) {
                var b = this.bullets[i];
                vec3.add(b.position, b.position, b.velocity);

                var tile = this.getTile(Math.floor(b.position[0]), Math.floor(b.position[1]));
                if (tile !== null && tile instanceof WallTile) {
                    this.bullets.splice(i, 1);
                }
                else {
                    var xx = Math.floor(b.position[0]);
                    var yy = Math.floor(b.position[1]);
                    var entitiesToCheck = this.getNearEntities(xx, yy);

                    for (var ii=0; ii<entitiesToCheck.length; ii++) {
                        if (!(entitiesToCheck[ii] instanceof NPC)) continue;
                        if (entitiesToCheck[ii].collision(b.position[0], b.position[1])) {
                            entitiesToCheck[ii].hurt();
                            var dir = vec3.clone(b.velocity);
                            vec3.scale(dir, dir, -4.0);
                            this.addParticleEffect(10, b.position, [1.0, 0.0, 0.0, 1.0], 100, dir);
                            this.bullets.splice(i, 1);
                        }
                    }
                }
            }

            for (var i=0; i<this.particles.length; i++) {
                var p = this.particles[i];
                if (p.countdown <= 0) {
                    this.particles.splice(i, 1);
                    this.particleCache.push(p);
                } 
                else {
                    vec3.add(p.position, p.position, p.velocity);
                    if (p.position[2] <= 0.0) {
                        p.position[2] = 0.0;
                        p.velocity[0] = p.velocity[1] = p.velocity[2] = 0.0;
                    }
                    p.velocity[2]-=0.01;
                    p.countdown--;
                }
            }
		},

        getNearEntities: function(xx, yy) {
            xx = Math.floor(xx);
            yy = Math.floor(yy);
            var entitiesToCheck = [];
            for (var x=xx-1; x<=xx+1; x++) {
                for (var y=yy-1; y<=yy+1; y++) {
                    var tile = this.getTile(x, y);
                    if (tile != null) {
                        for (var k=0; k<tile.residentEntities.length; k++) {
                            entitiesToCheck.push(tile.residentEntities[k]);
                        }
                    }
                }
            }
            return entitiesToCheck;
        },

		getTile: function(x, y) {
			if (y * this.width + x >= this.tiles.length) return null;
			return this.tiles[y * this.width + x];
		},
        setTile: function(x, y, t) {
            if (y * this.width + x >= this.tiles.length) return;
            this.tiles[y * this.width + x] = t;
        }
	});
})();