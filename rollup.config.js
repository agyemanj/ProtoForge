//@ts-check
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from "@rollup/plugin-json"
// import sourcemaps from 'rollup-plugin-sourcemaps';
// import externals from 'rollup-plugin-node-externals'
// const glob = require("glob")


export default [
	{
		input: 'src/client/index.tsx',
		// input: new glob.GlobSync("./src/pages/*.tsx").found,
		output: {
			dir: 'dist/public',
			format: 'esm',
			// sourcemap: true
		},
		preserveEntrySignatures: false,
		// external: ['express', 'passport'],
		context: "window",
		plugins: [
			nodeResolve({ browser: true }),
			commonjs(),
			json(),
			typescript({
				target: "ES2017",
				module: "esnext",
				outDir: "dist/public",
			})
		]
	}
]