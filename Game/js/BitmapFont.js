var BitmapFont = (function() {
	return Class.extend({

		init: function(fntFile, texture) {
            this.shader = null;
            this.scale = 1.0;
            this.fnt = fntFile;
            this.texture = texture;

            this.initFnt(this.fnt);
        },

        initFnt: function(fnt) {
            this.chars = new Array(256);

            var size = fnt.info.size;
            this.lineHeight = fnt.common.lineHeight / size;
            this.base = fnt.common.base / size;

            var imgSize = this.texture.getSize();
            for (var i=0; i<fnt.char.length; i++) {
                var charSrc = fnt.char[i];
                var char = {};
                char.width = charSrc.width/size;
                char.height = charSrc.height/size;
                char.xOffset = charSrc.xoffset/size;
                char.yOffset = charSrc.yoffset/size;
                char.xAdvance = charSrc.xadvance/size;
                char.uvs = {
                    u1: charSrc.x / imgSize.w,
                    v1: (imgSize.h - charSrc.y) / imgSize.h,
                    u2: (charSrc.x + charSrc.width) / imgSize.w,
                    v2: (imgSize.h - (charSrc.y + charSrc.height)) / imgSize.h
                };

                this.chars[charSrc.id] = char;
            }
        },

        setScale: function(scale) {
            this.scale = scale;
        },

        renderStringCentered: function(vb, str, w, h) {
        	var s = this.getSize(str);

        	this.renderString(vb, str, w/2.0 - s.w/2.0, h/2.0 + s.h/2.0)
        },

        renderString: function(vb, str, x, y, offset) {
            var cursor = {"x": x, "y": y};

            if (offset === undefined) {
                offset = { "x": 0.0, "y": 0.0 };
            }
            else {
                offset.x *= this.scale;
                offset.y *= this.scale;
            }

            for (var i=0; i<str.length; i++) {
                var cc = str.charCodeAt(i);

                if (cc == 10) {
                    cursor.x = x;
                    cursor.y -= this.lineHeight * this.scale;
                }
                else {
                    var charData = this.chars[cc];
                    var uvs = charData.uvs;

                    renderQuadDown(vb, cursor.x + offset.x + charData.xOffset * this.scale, cursor.y - offset.y - (charData.yOffset) * this.scale, charData.width * this.scale, charData.height * this.scale, charData.uvs);
                    cursor.x += charData.xAdvance * this.scale;
                }
            }
        },

        getSize: function(str) {
            var w = 0.0;
            var max = {w: 0.0, h: 0.0};

            for (var i=0; i<str.length; i++) {
                var cc = str.charCodeAt(i);

                if (cc == 10) {
                    w = 0;
                    max.h += this.lineHeight * this.scale;
                }
                else {
                    var charData = this.chars[cc];
                    w += charData.xAdvance * this.scale;
                    if (w > max.w) {
                        max.w = w;
                    }
                }
            }

            max.h += this.lineHeight * this.scale;

            return max;
        }
	});
})();