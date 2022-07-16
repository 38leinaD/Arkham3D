var Texture = (function() {
    var Texture = Class.extend({
        init: function(img) {
            this.texId = gl.createTexture();
            this.image = img;

            gl.bindTexture(gl.TEXTURE_2D, this.texId);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
        },

        bind: function(texUnit) {
            if (texUnit === undefined) {
                texUnit = 0;
            }
            //if (Texture.bound[texUnit] !== this) {
                gl.activeTexture(gl['TEXTURE' + texUnit]);
                gl.bindTexture(gl.TEXTURE_2D, this.texId);
                Texture.bound[texUnit] = this;
            //}
        },

        getSize: function() {
            return { w: this.image.width, h: this.image.height };
        }
    });

    Texture.bound = {};

    return Texture;
})();