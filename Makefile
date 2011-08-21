all:
	zip -r techtxt-detector.xpi * --exclude @exclude.lst
clean:
	rm -rf *.xpi
