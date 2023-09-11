import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json" assert { type: "json" };

export default [
    // browser-friendly UMD build
    {
        input: "src/index.ts",
        output: {
            name: "@fasti18n/client-js",
            file: pkg.browser,
            format: "umd",
        },
        plugins: [
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.json" }),
        ],
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        input: "src/index.ts",
        output: [
            { file: pkg.main, format: "cjs" },
            { file: pkg.module, format: "es" },
        ],
        plugins: [typescript({ tsconfig: "./tsconfig.json" })],
    },

    /**
     * Command Line Interface
     */
    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    {
        input: "src/index-cli.ts",
        output: [
            {
                file: pkg['main-cli'],
                format: "module",
                external: ['process', 'minimist'],
                banner: '#!/usr/bin/env node'
            },
        ],
        plugins: [typescript({ tsconfig: "./tsconfig.json" })],
    },

];