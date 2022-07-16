var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

var gl = null;

var G = {
    assetManager: null,
    sceneManager: null,
    audioManager: new AudioManager(),
    textureAtlas: null,
    input: new Input(),
    player: null,
    debugSelected: null,
    debug1: null,
    debug2: null,
    debug3: null
};

(function() {
    var container = document.getElementById('container');
    var canvas = document.createElement('canvas');
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    gl = canvas.getContext("experimental-webgl") || canvas.getContext("webgl");
    if (false) {
        function validateNoneOfTheArgsAreUndefined(functionName, args) {
          for (var ii = 0; ii < args.length; ++ii) {
            if (args[ii] === undefined) {
              console.error("undefined passed to gl." + functionName + "(" +
                             WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
            }
          }
        }
        gl = WebGLDebugUtils.makeDebugContext(gl, undefined, validateNoneOfTheArgsAreUndefined);
        //gl = WebGLDebugUtils.makeDebugContext(gl); // Debug
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    container.appendChild(canvas);

    var sceneManager;

    function init() {

        G.assetManager = new AssetManager();
        G.assetManager.add(new AssetManager.Texture('assets/logo.png'));
        G.assetManager.add(new AssetManager.Texture('assets/gfx/tilemap.png'));
        G.assetManager.add(new AssetManager.JSON('assets/config.json'));
        G.assetManager.add(new AssetManager.JSON('assets/worlds/demo.json'));
        G.assetManager.add(new AssetManager.JSON('assets/worlds/template.json'));

        G.assetManager.add(new AssetManager.JSON('assets/models/grave.mdl'));
        G.assetManager.add(new AssetManager.Texture('assets/models/grave.png'));

        G.assetManager.add(new AssetManager.BitmapFont('assets/fonts/04.json'));

        if (G.audioManager.context !== undefined) {
            G.assetManager.add(new AssetManager.Audio('assets/music/DST-RavenWood.ogg'));

            G.assetManager.add(new AssetManager.Audio('assets/sounds/footstep_1.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/footstep_2.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/door.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/swing.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/player_hurt.ogg'));

            G.assetManager.add(new AssetManager.Audio('assets/sounds/bat_attack.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/snake_attack.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/acolyte_attack.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/wraith_appear.ogg'));

            G.assetManager.add(new AssetManager.Audio('assets/sounds/pistol.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/pistol2.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/snake_jump.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/pick_up_health.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/pick_up_key.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/pick_up_treasure.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/pick_up_pistol.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/pick_up_sword.ogg'));

            G.assetManager.add(new AssetManager.Audio('assets/sounds/snake_hit.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/bat_hit.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/wraith_hit.ogg'));
            G.assetManager.add(new AssetManager.Audio('assets/sounds/acolyte_hit.ogg'));
        }


        G.texVB = new FloatVertexBuffer([new FloatVertexBuffer.Attribute(3), new FloatVertexBuffer.Attribute(2)], 5000);
        G.texShader = new TextureShader();

        G.colorVB = new FloatVertexBuffer([new FloatVertexBuffer.Attribute(3)], 1000);
        G.colorShader = new ShaderProgram('color-vs', 'color-fs', ['uMVMatrix', 'uPMatrix', 'uColor'], ['aVertexPosition']);

        G.sceneManager = new SceneManager();
        G.sceneManager.push(new InitScene(G.sceneManager, G.assetManager));
    }

    init();

    function pause() {
        running = false;
    }

    function unpause() {
        running = true;
        then = Date.now();
        main();
    }

    var tickDuration = 1.0/60.0;
    var tickFraction = 0.0;
    function update(dt) {
        tickFraction += dt;
        while(tickFraction >= tickDuration) {
            tick();
            tickFraction -= tickDuration;
        }
    }

    function tick() {
        G.sceneManager.tick();
    }

    function render() {
        G.sceneManager.render();
    }

    function main() {
        if(!running) {
            return;
        }

        var now = Date.now();
        var dt = (now - then) / 1000.0;

        update(dt);
        render();

        then = now;
        requestAnimFrame(main);
    }

    window.addEventListener('focus', function() {
        unpause();
    });

    window.addEventListener('blur', function() {
        pause();
    });

    var then = Date.now();
    var running = true;
    main();
})();
