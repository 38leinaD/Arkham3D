var FloatVertexBuffer = (function() {
	var FloatVertexBuffer = Class.extend({
		init: function(attributes, maxNumItems) {
			this.id = gl.createBuffer();
        	gl.bindBuffer(gl.ARRAY_BUFFER, this.id);

       		this.maxNumItems = maxNumItems === undefined ? 1000 : maxNumItems;
       		this.numItems = 0;

       		this.attributes = attributes;
       		this.itemSize = 0;
       		this.primitiveItemSize = 0;
       		for (var i=0; i<attributes.length; i++) {
       			this.itemSize += attributes[i].size;
       			this.primitiveItemSize += attributes[i].primitiveSize;
       		}

        	this.array = new Float32Array(this.maxNumItems * this.itemSize);
        	this.dirty = false;
		},

		begin: function() {
			this.numItems = 0;
		},

		setData: function(value) {
			this.array.set(value);
			this.numItems = value.length / this.itemSize;
			this.dirty = true;
		},

		addData: function(value) {
			this.array.set(value, this.numItems * this.itemSize);
			this.numItems += value.length / this.itemSize;
			this.dirty = true;

			if (this.numItems > this.maxNumItems) {
				console.log("*** vb reached limit ***");
			}
		},

		end: function() {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.id);

			if (this.dirty) {
				gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.STATIC_DRAW);
				this.dirty = false;
			}
		},

		render: function(shader, mode) {
        	if (this.attributes.length != shader.attributeArray.length) {
        		console.log("Unable to map attributes; VertexBuffer has " + this.attributes.length + " attributes but shader has " + shader.attributeArray.length);
        		return;
        	}

			var stride = this.primitiveItemSize;
			var offset = 0;
        	for (var i=0; i<this.attributes.length; i++) {
        		var size = this.attributes[i].size;
        		gl.vertexAttribPointer(shader.attributeArray[i], size, this.attributes[i].type, false, stride, offset);
        		offset += this.attributes[i].primitiveSize;
        	}

        	gl.drawArrays(mode === undefined ? gl.TRIANGLES : mode, 0, this.numItems);
		}
	});

	FloatVertexBuffer.Attribute = Class.extend({
		init: function(size) {
			this.type = gl.FLOAT;
			this.size = size;
			this.primitiveSize = this.size * 4;;
		}
	});

	return FloatVertexBuffer;
})();