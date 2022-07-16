var HudLayer = (function() {

	return Class.extend({
		init: function(scene) {
            this.scene = scene;

            this.mvMatrix = mat4.create();
            this.pMatrix = mat4.create();

            this.colorVB = new FloatVertexBuffer([new FloatVertexBuffer.Attribute(3)], 5000);
            this.colorShader = new ShaderProgram('color-vs', 'color-fs', ['uPMatrix', 'uMVMatrix', 'uColor'], ['aVertexPosition']);

		},

		tick: function() {

		},

		render: function() {
            return;
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

            var width = 1000;
            var ratio = gl.viewportHeight/gl.viewportWidth;
            var height = width * ratio;

            mat4.ortho(this.pMatrix, 0.0, width, 0.0, height, -10.0, 10.0);
            mat4.identity(this.mvMatrix);
        
            this.colorShader.use();

            this.colorShader.setUniformMatrix('uPMatrix', this.pMatrix);
            this.colorShader.setUniformMatrix('uMVMatrix', this.mvMatrix);

            var scale = 5.0;

            // All Tiles
            this.colorShader.setUniformf('uColor', [0.0, 1.0, 0.0, 1.0]);

            this.colorVB.begin();
            var i=0;
            for (var x=0; x<this.scene.world.width; x++) {
                for (var y=0; y<this.scene.world.height; y++) {
                    var tile = this.scene.world.getTile(x, y);
                    if (!(tile instanceof WallTile)) continue;
                    this.colorVB.addData([ tile.x * scale,  tile.y * scale,  0.0]);
                    this.colorVB.addData([ (tile.x + 1.0) * scale, tile.y * scale,  0.0]);
                    this.colorVB.addData([ tile.x * scale,  (tile.y + 1.0) * scale,  0.0]);
                    
                    this.colorVB.addData([ tile.x * scale,  (tile.y + 1.0) * scale,  0.0]);
                    this.colorVB.addData([ (tile.x + 1.0) * scale, tile.y * scale,  0.0]);
                    this.colorVB.addData([ (tile.x + 1.0) * scale,  (tile.y + 1.0) * scale,  0.0]);

                    i++;
                    if (i>100) {
                        this.colorVB.end();
                        this.colorVB.render(this.colorShader, gl.TRIANGLES);
                        this.colorVB.begin();

                        i=0;
                    }
                }
            }

            this.colorVB.end();
            this.colorVB.render(this.colorShader, gl.TRIANGLES);


            // Rendered Tiles
            this.colorShader.setUniformf('uColor', [1.0, 0.0, 0.0, 1.0]);

            this.colorVB.begin();

            for (var i=0; i<this.scene.raycaster.visibleTileCount; i++) {
                var tile = this.scene.raycaster.visibleTiles[i];

                this.colorVB.addData([ tile.x * scale,  tile.y * scale,  0.0]);
                this.colorVB.addData([ (tile.x + 1.0) * scale, tile.y * scale,  0.0]);
                this.colorVB.addData([ tile.x * scale,  (tile.y + 1.0) * scale,  0.0]);
                
                this.colorVB.addData([ tile.x * scale,  (tile.y + 1.0) * scale,  0.0]);
                this.colorVB.addData([ (tile.x + 1.0) * scale, tile.y * scale,  0.0]);
                this.colorVB.addData([ (tile.x + 1.0) * scale,  (tile.y + 1.0) * scale,  0.0]);

            }

            this.colorVB.end();
            this.colorVB.render(this.colorShader, gl.TRIANGLES);

            // Walls
            this.colorShader.setUniformf('uColor', [0.0, 1.0, 0.0, 1.0]);

            this.colorVB.begin();

            for (var i=0; i<this.scene.raycaster.visibleWallCount; i++) {
                var wall = this.scene.raycaster.visibleWalls[i];

                this.colorVB.addData([ wall.xStart * scale, wall.yStart * scale,  0.0]);
                this.colorVB.addData([ wall.xEnd * scale, wall.yEnd * scale,  0.0]);
            }

            this.colorVB.end();
            this.colorVB.render(this.colorShader, gl.LINES);


            // Player
            this.colorShader.setUniformf('uColor', [1.0, 1.0, 0.0, 1.0]);

            this.colorVB.begin();




                this.colorVB.addData([ (G.player.x - 0.5) * scale, (G.player.y - 0.5) * scale,  0.0]);
                this.colorVB.addData([ (G.player.x + 0.5) * scale, (G.player.y - 0.5) * scale,  0.0]);
                this.colorVB.addData([ (G.player.x - 0.5) * scale, (G.player.y + 0.5) * scale,  0.0]);
                
                this.colorVB.addData([ (G.player.x - 0.5) * scale, (G.player.y + 0.5) * scale,  0.0]);
                this.colorVB.addData([ (G.player.x + 0.5) * scale, (G.player.y - 0.5) * scale,  0.0]);
                this.colorVB.addData([ (G.player.x + 0.5) * scale, (G.player.y + 0.5) * scale,  0.0]);


            this.colorVB.end();
            this.colorVB.render(this.colorShader, gl.TRIANGLES);

		}
	});
})();