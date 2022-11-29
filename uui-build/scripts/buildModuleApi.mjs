import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { getIndexFileName } from "../utils/indexFileUtils.js";
import {buildUsingRollup, watchUsingRollup} from "../rollupConfig/rollupConfigUtils.mjs";
import {getModuleNamePathBelongsTo} from "../utils/lernaModulesUtils.mjs";

const buildDir = 'build'
const filesNoCopy = ['tsconfig.tsbuildinfo', '.rollup.cache', buildDir, 'node_modules']

async function ensureHasBuildFolder(moduleFolder) {
    const p = path.resolve(moduleFolder, './build/')
    const hasIt = await fs.exists(p)
    if (!hasIt) {
        await fs.mkdir(p)
    }
}
async function copyPackageJson(moduleFolder) {
    const from = path.resolve(moduleFolder, './package.json');
    const to = path.resolve(moduleFolder, './build/package.json');
    const fromJson = await fs.readJSON(from);
    const toJson = {
        ...fromJson,
        main: fromJson.main.substring('build/'.length),
        typings: fromJson.typings.substring('build/'.length),
    }
    await fs.writeFile(to, JSON.stringify(toJson, undefined, 2))
}
async function copyReadme(moduleFolder) {
    await fs.copy(path.resolve(moduleFolder, './readme.md'), path.resolve(moduleFolder, './build/readme.md'));
}
async function copyAssets(moduleFolder) {
    // If package contains 'assets' folder, we move it to build as is
    const assetsExists = await fs.exists(path.resolve(moduleFolder, './assets/'));
    if(assetsExists) {
        await fs.copy(path.resolve(moduleFolder, './assets/'), path.resolve(moduleFolder, './build/assets/'));
    }
}

export async function buildModule(params) {
    const { cwd = process.cwd(), isWatch = false, cleanOutput = false } = params || {};
    const start = Date.now()
    logStart();
    if (cleanOutput) {
        await fs.emptyDir(path.resolve(cwd, './build'));
    }
    const indexFileName = await getIndexFileName({ cwd });
    if (indexFileName) {
        await ensureHasBuildFolder(cwd);
        await Promise.all([
            copyPackageJson(cwd),
            copyReadme(cwd),
            copyAssets(cwd)
        ]);
        try {
            const moduleName = await getModuleNamePathBelongsTo({ pathToCheck: cwd });
            if (isWatch) {
                // it waits until initial build success or fail
                const res = await watchUsingRollup({ moduleName });
                return res;
            } else {
                await buildUsingRollup({ moduleName });
            }
            logEnd();
        } catch(err) {
            if (err && err.message) {
                console.log(chalk.red(`Failed building package: ${cwd}`));
                console.log(err.message);
                process.exit(1);
            }
        }
    } else {
        console.log('No index exists. Will publish package as is, w/o pre-build');
        const dirFiles = await fs.readdir(cwd)
        await Promise.all(
            dirFiles.map(async (file) => {
                const canCopy = !filesNoCopy.find(nc => nc === file);
                if (canCopy) {
                    await fs.copy(path.resolve(cwd, file), path.resolve(cwd, buildDir, file))
                }
            })
        )
    }
    function logStart() {
        console.log(chalk.green(`Building package: ${cwd}`));
    }
    function logEnd() {
        const end = Date.now()
        const took = `${Math.round((end - start)/1000)} (sec)`
        console.log(chalk.green(`Done building package: ${cwd}. Took: ${took}`));
    }
}

