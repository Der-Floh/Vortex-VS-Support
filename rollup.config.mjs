import typescript from '@rollup/plugin-typescript';
import { builtinModules } from 'node:module';

const RUNTIME_PROVIDED_MODULES = ['vortex-api', 'bluebird'];

// Must match the sourceMapPathOverrides key in .vscode/launch.json.
const SOURCE_URL_PREFIX = 'vs-support:///';

const toSourceUrl = (relativeSourcePath) =>
    SOURCE_URL_PREFIX + relativeSourcePath.replace(/\\/g, '/').replace(/^(\.\.\/)+/, '');

export default {
    input: 'src/index.ts',
    output: {
        file: 'out/index.js',
        format: 'cjs',
        sourcemap: 'inline',
        sourcemapPathTransform: toSourceUrl,
        exports: 'named',
    },
    external: [
        ...RUNTIME_PROVIDED_MODULES,
        ...builtinModules,
        ...builtinModules.map((name) => `node:${name}`),
    ],
    plugins: [
        typescript({
            module: 'esnext',
            sourceMap: true,
            inlineSourceMap: false,
            inlineSources: true,
            noEmitOnError: true,
        }),
    ],
};
