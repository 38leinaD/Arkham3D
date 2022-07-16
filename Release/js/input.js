var Input = (function() {
    var pressedKeys = {};
    var delayedKeys = {};

    var gamepadSupport = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
    var gamepad = undefined;

    var ticking = false;

    function startPolling() {
        if (!ticking) {
            ticking = true;
            tick();
        }
    }

    function stopPolling() {
        ticking = false;
    }

    function tick() {
        pollStatus();
        scheduleNextTick();

        for (var k in delayedKeys) {
            if (delayedKeys.hasOwnProperty(k)) {
                if (delayedKeys[k]> 0) delayedKeys[k]--;
                else delete delayedKeys[k];
            } 
        }
    }

    function scheduleNextTick() {

        if (ticking) {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(tick);
            } else if (window.mozRequestAnimationFrame) {
                window.mozRequestAnimationFrame(tick);
            } else if (window.webkitRequestAnimationFrame) {
                window.webkitRequestAnimationFrame(tick);
            }
        }
    }

    

    function pollStatus() {
        var newGamepad = navigator.webkitGetGamepads && navigator.webkitGetGamepads()[0];
        if (newGamepad !== gamepad) {
            console.log("new gamepad connect");
            gamepad = newGamepad;
        }

        if (gamepad !== undefined) {

            pressedKeys['UP'] = gamepad.buttons[12];
            pressedKeys['DOWN'] = gamepad.buttons[13];
            pressedKeys['LEFT'] = gamepad.buttons[14];
            pressedKeys['RIGHT'] = gamepad.buttons[15];

            if (gamepad.axes[0] < 0.0 && Math.abs(gamepad.axes[0]) > pressedKeys['LEFT']) {
                pressedKeys['LEFT'] = Math.abs(gamepad.axes[0]) * 0.7;
            }
            if (gamepad.axes[0] > 0.0 && Math.abs(gamepad.axes[0]) > pressedKeys['RIGHT']) {
                pressedKeys['RIGHT'] = Math.abs(gamepad.axes[0]) * 0.7;
            }

            if (gamepad.axes[1] < 0.0 && Math.abs(gamepad.axes[1]) > pressedKeys['UP']) {
                pressedKeys['UP'] = Math.abs(gamepad.axes[1]);
            }
            if (gamepad.axes[1] > 0.0 && Math.abs(gamepad.axes[1]) > pressedKeys['DOWN']) {
                pressedKeys['DOWN'] = Math.abs(gamepad.axes[1]);
            }

            if (gamepad.buttons[0] >= 0.5) {
                pressedKeys['A'] = true;
            }
            else {
                pressedKeys['A'] = false;
            }

            if (gamepad.buttons[1] >= 0.5) {
                pressedKeys['B'] = true;
            }
            else {
                pressedKeys['B'] = false;
            }
        }
    }

    function setKey(event, status) {
        var code = event.keyCode;
        var key;

        switch(code) {
        case 32:
            key = 'A'; break;
        case 82: // r
            key = 'B'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        default:
            // Convert ASCII codes to letters
            key = String.fromCharCode(event.keyCode);
        }

        pressedKeys[key] = status;
    }

    return Class.extend({
        init: function() {
            document.addEventListener('keydown', function(e) {
                if (G.audioManager.isSuspended()) {
                    G.audioManager.resume();
                }
                setKey(e, true);
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            });

            document.addEventListener('keyup', function(e) {
                setKey(e, false);
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            });

            window.addEventListener('blur', function() {
                pressedKeys = {};
                return false;
            });

            startPolling();
        },

        isDown: function(key) {
            if (typeof(pressedKeys[key]) === 'number') {
                return pressedKeys[key] >= 0.2;
            }
            else {
                return pressedKeys[key];
            }
        },

        wasJustPressed: function(key) {
            if (this.isDown(key) && (delayedKeys[key] === undefined || delayedKeys[key] <= 0)) {
                pressedKeys[key] = false;
                delayedKeys[key] = 30;
                return true;
            }
            return false;
        },

        getIntensity: function(key) {
            if (typeof(pressedKeys[key]) === 'number') {
                return pressedKeys[key];
            }
            else {
                return pressedKeys[key] ? 1.0 : 0.0;
            }
        }
    });
})();