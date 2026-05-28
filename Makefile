.PHONY: build test typecheck web clean

build:
	tsc -p packages/engine/tsconfig.json

test: build
	node --test $$(find packages/engine/dist -name '*.test.js')

typecheck:
	tsc -p packages/engine/tsconfig.json --noEmit

web: build
	node packages/server/src/server.mjs

clean:
	rm -rf packages/engine/dist
