.PHONY: build test typecheck web clean

build:
	tsc -p packages/engine/tsconfig.json

test: build
	node --test $$(find packages/engine/dist -name '*.test.js')

typecheck:
	tsc -p packages/engine/tsconfig.json --noEmit

web: build
	python3 -m http.server 5173

clean:
	rm -rf packages/engine/dist
