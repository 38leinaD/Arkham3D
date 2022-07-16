var AssetManager = (function() {
	var AssetManager = Class.extend({
        init: function() {
            this.assetQueue = [];
            this.assetCache = [];
            this.registeredAssetsCount = 0;
            this.error = false;
            this.errorAsset = null;
        },

        add: function(config) {
            this.assetQueue.push(config);
            this.registeredAssetsCount++;
        },

        load: function() {
                    var self = this;

            setTimeout(function() {
                var onlyAudioMissing = true;
                for (var i=0; i<self.assetQueue.length; i++) {
                    if (self.assetQueue[i] != null && self.assetQueue[i].asset.indexOf('.ogg') == -1) {
                        onlyAudioMissing = false;
                        break;
                    }
                }
                if (onlyAudioMissing) {
                    console.log("!!!Only audio missing");
                    for (var i=0; i<self.assetQueue.length; i++) {
                        self.assetQueue[i] = null;
                    }
                }
            }, 5000);
            for (var i=0; i<this.assetQueue.length; i++) {
                (function() {
                    var j = i;
                    setTimeout(function() {
                        var assetConfig = self.assetQueue[j];
                        assetConfig.parent = self;
                        assetConfig.load();
                    }, j*50);
                })();
            }
        },

        onComplete: function(assetId, asset) {
        	this.assetCache.push({
        		'id': assetId,
        		'asset': asset
        	});

        	for (var i=0; i<this.assetQueue.length; i++) {
        		if (this.assetQueue[i] != null && this.assetQueue[i].asset === assetId) {
                    console.log(">>> REMOVING FROM QUEUE " + this.assetQueue[i].asset);
					this.assetQueue[i] = null;
        			break;
        		}
        	}
        	console.log('Asset "' + assetId + '" loaded.');
        },

        onError: function(assetId) {
        	for (var i=0; i<this.assetQueue.length; i++) {
        		if (this.assetQueue[i] != null && this.assetQueue[i].asset === assetId) {
					this.assetQueue[i] = null;
        			break;
        		}
        	}
            this.error = true;
            this.errorAsset = assetId;

        	console.log('Asset "' + assetId + '" failed loading.');
        },

        getProgress: function() {
            return this.assetCache.length/this.registeredAssetsCount;
        },

        update: function() {
            for (var i=0; i<this.assetQueue.length; i++) {
                if (this.assetQueue[i] != null) {
                    return true;
                }
            }
            return false;
        },

        hasError: function() {
            return this.error;
        },
        
        get: function(assetId) {
        	for (var i=0; i<this.assetCache.length; i++) {
        		var asset = this.assetCache[i];
        		if (asset.id === assetId) return asset.asset;
        	}
        	console.log('No asset "' + assetId + '" registered.');
        	return null;
        }
    });

	AssetManager.ModuleBase = Class.extend({
		init: function(asset) {
			this.asset = asset;
		},

		requestFile: function(url, handler, type) {
			var self = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.file = url;
            if (type !== undefined) {
                xhr.responseType = type;
            }
            xhr.onload = function(e) {
                handler.apply(self, [e.target]);
            }
            xhr.onreadystatuschange = function() {
                if (xhr.status == 404) {
                    self.onError();
                }
            }
            xhr.onerror = function() {
                this.error = true;
                this.errorFile = xhr.file;
            }
            xhr.on
            xhr.send();
        },

        onError: function() {
        	this.parent.onError(this.asset);
        }
	});

	AssetManager.JSON = AssetManager.ModuleBase.extend({
		load: function() {
            this.requestFile(this.asset, this.onComplete);
		},

		onComplete: function(xhr) {
			this.parent.onComplete(this.asset, JSON.parse(xhr.responseText))
		}
	});

	AssetManager.Texture = AssetManager.ModuleBase.extend({
		load: function() {
			var self = this;
            var image = new Image();
            image.crossOrigin = 'anonymous';

            image.onload = function() {
                self.onComplete(image);
            }
            image.onerror = function() {
                self.onError();
            }
            image.file = this.asset;
            image.src = this.asset;
		},

		onComplete: function(image) {
			this.parent.onComplete(this.asset, new Texture(image));
		}
	});

    AssetManager.BitmapFont = AssetManager.ModuleBase.extend({
        load: function() {
            var fntAssetConfig = new AssetManager.JSON(this.asset);
            fntAssetConfig.parent = this;
            fntAssetConfig.load();
        },

        onComplete: function(asset, file) {
            if (file instanceof Texture) {
                this.parent.onComplete(this.asset, new BitmapFont(this.fntFile, file));
            }
            else if (file instanceof Object) {
                this.fntFile = file;
                var textureAssetConfig = new AssetManager.Texture(asset.replace(/\.json/, '.png'));
                textureAssetConfig.parent = this;
                textureAssetConfig.load();
            }
        }
    });

    AssetManager.Audio = AssetManager.ModuleBase.extend({
        load: function() {
        
            this.requestFile(this.asset, this.onComplete, 'arraybuffer');
        },

        onComplete: function(xhr) {
            var self = this;
            if (xhr instanceof XMLHttpRequest) {
                G.audioManager.context.decodeAudioData(xhr.response, function(buffer) {
                    self.parent.onComplete(self.asset, buffer);
                }, function(e) {
                    self.onError();
                });
            }
        }
    });

	return AssetManager;
})();