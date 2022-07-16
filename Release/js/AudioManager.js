/*
 * Copyright (C) 2010 fruitfly (Daniel Platz)
 *
 * This software is available under a BSD license. Please see the LICENSE.TXT file for details.
 */

var AudioManager = (function() {
    return Class.extend({
        init: function() {

            try {
                this.context = new webkitAudioContext();
            }
            catch(e) {
                console.log('Web Audio API is not supported in this browser');
            }

            this.songSource = null;
        },

        isSupported: function() {
            return this.context != null;
        },

        playSound: function(sound, volume) {
            if (!this.isSupported()) return;
            var buffer = G.assetManager.get('assets/sounds/' + sound);
            if (buffer == null) return;
            var source = this.context.createBufferSource();
            source.buffer = buffer;
            if (volume === undefined) {
                source.connect(this.context.destination);
            }
            else {
                var gain = this.context.createGainNode();
                source.connect(gain);
                gain.connect(this.context.destination);
                gain.gain.value = volume;
            }

            source.noteOn(0);
        },

        playSong: function(song) {
            if (!this.isSupported()) return;

            if (this.songSource != null) {
                this.stopSong();
            }

            var buffer = G.assetManager.get('assets/music/' + song);
            if (buffer == null) return;

            this.songSource = this.context.createBufferSource();
            this.songSource.loop = true;

            var gain = this.context.createGainNode();
            this.songSource.connect(gain);
            gain.connect(this.context.destination);
            gain.gain.value = 0.2;

            this.songSource.buffer = buffer;


            this.songSource.noteOn(0);
        },

        stopSong: function() {
            if (this.songSource == null) return;
            this.songSource.noteOff(0);
        }
    });
})();