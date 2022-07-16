var ShaderProgram = (function() {

	function getShader(gl, id) {
        var shaderNode = $('#' + id);
        if (shaderNode.length === 0) {
            return null;
        }

        var shader;
        if (shaderNode.attr('type') === "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderNode.attr('type') === "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, shaderNode.text());
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    var activeAttributes = [];

	return Class.extend({
		init: function(vertexShaderId, fragementShaderId, uniforms, attributes) {
	        var vertexShader = getShader(gl, vertexShaderId);
	        var fragmentShader = getShader(gl, fragementShaderId);

	        this.shaderProgram = gl.createProgram();
	        gl.attachShader(this.shaderProgram, vertexShader);
	        gl.attachShader(this.shaderProgram, fragmentShader);
	        gl.linkProgram(this.shaderProgram);

	        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
	            alert("Could not initialise shaders.");
	        }

	        gl.useProgram(this.shaderProgram);

	        this.attributes = {};
	        this.attributeArray = [];
	        for (var i=0; i<attributes.length; i++) {
	            var attribId = gl.getAttribLocation(this.shaderProgram, attributes[i]);
	            this.attributes[attributes[i]] = attribId;
	            this.attributeArray.push(attribId);
	        }

	        this.uniforms = {};
	        for (var i=0; i<uniforms.length; i++) {
	            this.uniforms[uniforms[i]] = gl.getUniformLocation(this.shaderProgram, uniforms[i]);
	        }
	    },

	    setUniformf: function(name, value) {
			if (value instanceof Array) {
	    		var f;
				if (value.length === 3) {
	    			f = gl.uniform3fv;
	    		}
	    		else if (value.length === 4) {
	    			f = gl.uniform4fv;
	    		}
	    		f.apply(gl, [this.uniforms[name], new Float32Array(value)]);
	    	}
	    	else if (typeof(value) === 'number') {
	    		gl.uniform1f(this.uniforms[name], value);
	    	}
	    },

	    setUniformi: function(name, value) {
			if (value instanceof Array) {
	    		var f;
				if (value.length === 3) {
	    			f = gl.uniform3iv;
	    		}
	    		f.apply(gl, [this.uniforms[name], new Int32Array(value)]);
	    	}
	    	else if (typeof(value) === 'number') {
	    		gl.uniform1i(this.uniforms[name], value);
	    	}
	    },

	   	setUniformMatrix: function(name, value) {
    		var f;
    		if (value.length === 16) {
    			f = gl.uniformMatrix4fv;
    		}
    		else if (value.length === 9) {
    			f = gl.uniformMatrix3fv;
    		}
    		else if (value.length === 4) {
    			f = gl.uniformMatrix2fv;
    		}
    		f.apply(gl, [this.uniforms[name], false, value]);
	    },

	    use: function() {
	        gl.useProgram(this.shaderProgram);

	        for (var i=0; i<activeAttributes.length; i++) {
	            gl.disableVertexAttribArray(activeAttributes[i]);
	        }

	        activeAttributes = [];
	        for (var i=0; i<this.attributeArray.length; i++) {
	        	activeAttributes.push(this.attributeArray[i]);
	            gl.enableVertexAttribArray(this.attributeArray[i]);
	        }
	    },

	    validate: function() {
            gl.validateProgram(this.shaderProgram);
            if (!gl.getProgramParameter(this.shaderProgram, gl.VALIDATE_STATUS)) {
                alert("Shader validation failed.");
            }
	    }
	});
})();