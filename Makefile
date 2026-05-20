.PHONY: build test typecheck clean

build:
	tsc -p packages/engine/tsconfig.json

test: build
	node --test $$(find packages/engine/dist -name '*.test.js')

typecheck:
	tsc -p packages/engine/tsconfig.json --noEmit

clean:
	rm -rf packages/engine/dist
