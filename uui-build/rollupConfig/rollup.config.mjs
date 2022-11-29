import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss-modules";
import svgr from "@svgr/rollup";
import fs from "fs";
import path from "path";
import * as indexFileUtils from "../utils/indexFileUtils.js"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"

const { getIndexFileName } = indexFileUtils;

const excludeEntries = ['node_modules', 'build', '.rollup.cache', 'tsconfig.tsbuildinfo', 'tsconfig.json', 'package.json']

function ensureModuleHasTsConfig(params) {
    const { moduleRootDir } = params || {};
    const moduleLevelTsConfig = path.resolve(moduleRootDir, './tsconfig.json');
    const entries = fs.readdirSync(moduleRootDir, { withFileTypes: true });
    const include = entries.filter(e => {
        const isExcluded = excludeEntries.indexOf(e.name) !== -1
        return !isExcluded
    }).map(e => {
        return `./${e.name}`
    })
    const data = {
        extends: '../tsconfig.json',
        include,
        exclude: [
            "*/**/__tests__",
        ],
    }
    const dataStr = JSON.stringify(data, undefined, 2)
    fs.writeFileSync(moduleLevelTsConfig, dataStr)
}

export async function getConfig({ moduleRootDir }) {
    const indexFileName = await getIndexFileName({ cwd: moduleRootDir });
    const packageJsonPath = path.resolve(moduleRootDir, "package.json")
    const tsconfigPath = path.resolve(moduleRootDir, './tsconfig.json')

    function getExcludedFromBundleDeps() {
        const shouldBundleDeps = ["@epam/assets", "draft-js"];

        const json = JSON.parse(fs.readFileSync(packageJsonPath));
        const allKeys = Object.keys({ ...json.dependencies, ...json.devDependencies, ...json.peerDependencies });
        return allKeys.filter(key => {
            return !shouldBundleDeps.find(sb => sb === key);
        });
    }
    const excludedDeps = getExcludedFromBundleDeps();
    ensureModuleHasTsConfig({ moduleRootDir });

    /**
     * @type {import('rollup').RollupOptions[]}
     */
    return [
        {
            //perf: true,
            treeshake: false,
            maxParallelFileOps: 100,
            onwarn: () => {},
            input: `${moduleRootDir}/${indexFileName}`,
            output: [
                {
                    file: `${moduleRootDir}/build/index.js`,
                    sourcemap: true,
                    format: "cjs",
                    interop: "auto"
                }
            ],
            plugins: [
                typescript({
                   //extendedDiagnostics: true,
                    moduleResolution: "Node",
                    incremental: true,
                    sourceMap: true,
                    rootDir: moduleRootDir,
                    outDir: `${moduleRootDir}/build`,
                    tsconfig: tsconfigPath,
                    declaration: true,
                    declarationDir: `${moduleRootDir}/build`,
                    // https://rollupjs.org/guide/en/#rollupwatch
                    noEmitOnError: false, // false(for dev). true(for prod)
                }),
                nodeResolve(),
                commonjs(),
                svgr({
                    ref: true,
                    exportType: "named",
                    jsxRuntime: "classic",
                }),
                postcss({
                    sourceMap: true,
                    modules: true,
                    extract: "styles.css",
                }),
                {
                    name: 'watch-external',
                    async buildStart(){
                        const externalsToWatch = excludedDeps.filter(e => e.indexOf('@epam/') === 0);
                        for (let i = 0; i < externalsToWatch.length; i++) {
                            const e = externalsToWatch[i];
                            const eRoot = path.resolve(moduleRootDir, `../node_modules/${e}/build`)
                            const ePackage = path.resolve(eRoot, 'package.json');
                            const { main, typings } = JSON.parse(String(await fs.promises.readFile(ePackage)))
                            const mainPath = path.resolve(eRoot, main)
                            const typingsPath = path.resolve(eRoot, typings)
                            //console.log(`adding to watch:\n${mainPath}\n${typingsPath}`)
                            this.addWatchFile(mainPath);
                            this.addWatchFile(typingsPath);
                        }
                    }
                }
            ],
            external: excludedDeps,
        },
    ];
}

//export default await getConfig({ moduleRootDir: process.cwd() })
