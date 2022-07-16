var TextureAtlas = (function() {

	var OFFSET = 0.001;

	return Class.extend({
		init: function(texture) {
			this.texture = texture;
			this.defaultTileSize = 16;
		},

        getTextureRegion: function(i) {
            var tilesPerRows = this.texture.image.width / this.defaultTileSize;
            var x = Math.floor(i % tilesPerRows);
            var y = Math.floor(i / tilesPerRows);
            return {
                uvs: {
                	u1: ((x) * this.defaultTileSize) / this.texture.image.width + OFFSET,
                    v1: (this.texture.image.height - (y + 1) * this.defaultTileSize) / this.texture.image.height + OFFSET,
                    u2: ((x + 1) * this.defaultTileSize) / this.texture.image.width - OFFSET,
                    v2: (this.texture.image.height - y * this.defaultTileSize) / this.texture.image.height - OFFSET

                }
            };
        },
        getCustomTextureRegion: function(x, y, width, height) {
            return {
                uvs: {
                    u1: x / this.texture.image.width + OFFSET,
                    v1: (this.texture.image.height - (y + height)) / this.texture.image.height + OFFSET,
                    u2: (x + width) / this.texture.image.width - OFFSET,
                    v2: (this.texture.image.height - y) / this.texture.image.height - OFFSET

                }
            };
        }
	});
})();