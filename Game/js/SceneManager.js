var SceneManager = (function() {
	return Class.extend({
		init: function() {
			this.scenes = [];
			this.currentScene = null;
			this.sceneChange = false;
		},

		push: function(scene) {
			this.scenes.push(scene);
			this.sceneChange = true;
		},

		pop: function() {
			this.scenes.pop();
			this.sceneChange = true;
		},

		tick: function() {
			if (this.sceneChange) {
				var newScene = null;
				if (this.scenes.length > 0) {
					newScene = this.scenes[this.scenes.length - 1];
				}

				if (this.currentScene !== null) {
					if (this.currentScene !== newScene) {
						this.currentScene.didHide();
						this.currentScene = newScene;
					}
				}
				else {
					this.currentScene = newScene;
				}

				if (this.currentScene !== null) {
					this.currentScene.didAppear();
				}
				this.sceneChange = false;
			}

			if (this.currentScene !== null) {
				this.currentScene.tick();
			}
		},

		render: function() {
			if (this.currentScene !== null) {
				this.currentScene.render();
			}
		}
	});
})();