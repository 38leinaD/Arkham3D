TP='/cygdrive/c/Program Files (x86)/CodeAndWeb/TexturePacker/bin/TexturePacker.exe'

.PHONY: backup release deploy gen_assets

gen_assets:
	cp Assets/gfx/tilemap.png Game/assets/gfx/tilemap.png
	
	echo "===== AUDIO ====="
	rm -rf Game/assets/sounds
	mkdir -p Game/assets/sounds
	#cp Assets/sounds/*.ogg Game/assets/sounds

	for f in Assets/sounds/*.wav; do \
		out=`basename $$f`; \
		out=$${out%.wav}.ogg; \
		oggenc.exe -o Game/assets/sounds/$$out $$f; \
	done

release:
	rm -rf Release
	mkdir Release
	cp -r Game/* Release
	
deploy: release
	(cd Release; scp -r * daniel@192.168.1.2:/Users/daniel/Web/apache-tomcat-5.5.28/webapps/games/proto/ProjectEdinburgh)
	
backup:
	DATE=`date +"%d_%m_%Y_%H_%M"`
	zip -r ProjectEdinburgh_backup_$(shell date +"%d_%m_%Y_%H_%M").zip Makefile diary.txt Assets Game Tools