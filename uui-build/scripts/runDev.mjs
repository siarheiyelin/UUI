import { buildModule } from "./buildModuleApi.mjs";
import {
    getDependenciesMap,
    getDependentsMap,
    getModuleRootDir,
} from "../utils/lernaModulesUtils.mjs";
import {cleanupAllModules} from "../utils/cleanupUtils.mjs";
import {runCliCommandAsync} from "../utils/cmdUtils.mjs";


async function waitMilliSeconds(ms = 100) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const STATE = { PENDING: 1, IN_PROGRESS: 2, DONE: 3, DONE_ERR: 4, SKIPPED: 5 };
class UuiBuildProgress {
    _dependenciesMap = {};
    _dependentsMap = {};
    _buildProgressMap = {};
    _buildTime = {};
    _totalBuildTime;

    constructor(params) {
        const { dependentsMap, dependenciesMap, focusOnModule } = params || {};
        this._dependenciesMap = dependenciesMap;
        this._dependentsMap = dependentsMap;

        if (focusOnModule) {
            const _addToMap = m => {
                this._buildProgressMap[m] = STATE.PENDING;
                if (dependentsMap[m]) {
                    dependentsMap[m].forEach(_addToMap);
                }
            };
            _addToMap(focusOnModule);
        } else {
            this._buildProgressMap = Object.keys(dependentsMap).reduce((acc, name) => {
                acc[name] = STATE.PENDING;
                return acc;
            }, {});
        }
    }

    _isModuleBuildFinished = (m) => {
        const status = this._buildProgressMap[m];
        return !status || [STATE.DONE, STATE.DONE_ERR, STATE.SKIPPED].indexOf(status) !== -1;
    }

    setProgress = (m, status) => {
        if (!this._totalBuildTime) {
            this._totalBuildTime = { start: Date.now(), end: undefined };
        }
        this._buildProgressMap[m] = status;
        if (!this._buildTime[m]) {
            this._buildTime[m] = {
                [STATE.IN_PROGRESS]: { time: { start: undefined, end: undefined }, isFailed: undefined }
            };
        }

        if (status === STATE.IN_PROGRESS) {
            const o = this._buildTime[m][STATE.IN_PROGRESS]
            o.time.start = Date.now()
        }
        if (status === STATE.DONE_ERR || status === STATE.DONE) {
            const o = this._buildTime[m][STATE.IN_PROGRESS]
            o.time.end = Date.now()
            o.isFailed = status === STATE.DONE_ERR
        }

        if (status === STATE.DONE_ERR) {
            // skip any subsequent modules
            const markSkipped = (d) => {
                this._buildProgressMap[d] = STATE.SKIPPED;
                this._dependentsMap[d].forEach(markSkipped);
            };
            this._dependentsMap[m].forEach(markSkipped);
        }
        if (this.isAllDone() && !this._totalBuildTime.end) {
            this._totalBuildTime.end = Date.now();
        }
    }

    isAllDone = () => {
        const isDone = Object.keys(this._buildProgressMap).every(this._isModuleBuildFinished);
        if (!isDone) {
           // console.log(this._buildProgressMap)
        }
        return isDone
    }

    getNextModules = () => {
        return Object.keys(this._buildProgressMap).filter(m => {
            const isPending = this._buildProgressMap[m] === STATE.PENDING
            const deps = this._dependenciesMap[m]
            return isPending && deps?.every(this._isModuleBuildFinished);
        });
    }

    printStats = () => {
        const stats = Object.keys(this._buildTime).reduce((acc, m) => {
            const o = this._buildTime[m][STATE.IN_PROGRESS]
            const t = o.time
            if (t) {
                const n = (t.end - t.start)/1000
                const taken = parseFloat(n).toFixed(2);
                acc[m] = {
                    taken,
                    isFailed: o.isFailed
                };
            }
            return acc
        }, {})
        const sep = '\t'

        console.log('***')
        Object.keys(stats).forEach(key => {
            const t = stats[key].taken;
            const status = stats[key].isFailed ? 'failed' : 'success'
            console.log(`[${key}]${sep}${status}${sep}"${t}"(sec)`)
        })
        if (this._totalBuildTime) {
            const { start, end } = this._totalBuildTime
            console.log(`Total: ${parseFloat((end - start)/1000).toFixed(2)} (sec)`)
        }
        console.log('***')
    }
}

class UuiModulesBuild {
    _isInitial = true;
    _excludeModules = [];
    _dependenciesMap = {};
    _dependentsMap = {};
    _watchControlMap = {};
    _uuiBuildProgress = undefined;

    constructor(params) {
        const { excludeModules } = params || {};
        this._excludeModules = excludeModules;
    }

    async init () {
        const excludeModules = this._excludeModules;
        this._dependenciesMap = await getDependenciesMap({ excludeModules });
        this._dependentsMap = await getDependentsMap({ excludeModules });
    }

    isInProgress = () => !!this._uuiBuildProgress;

    buildNext = async () => {
        if (!this.isInProgress() && !this._isInitial) {
            const found = Object.keys(this._watchControlMap).find(k => {
                const c = this._watchControlMap[k];
                return c?.needsRebuild();
            });
            if (found) {
                console.log(`Module changed "${found}".`)
                this._uuiBuildProgress = new UuiBuildProgress({ focusOnModule: found, dependentsMap: this._dependentsMap, dependenciesMap: this._dependenciesMap });
                await this.build();
            }
        }
    }

    buildInitial = async () => {
        this._uuiBuildProgress = new UuiBuildProgress({ dependentsMap: this._dependentsMap, dependenciesMap: this._dependenciesMap });
        await this.build();
    }

    build = async () => {
        const start = Date.now()
        const buildSingleModule = async (m) => {
            this._uuiBuildProgress.setProgress(m, STATE.IN_PROGRESS);
            const mStart = Date.now()
            // it's needed to allow Rollup file watchers to find any updated dependencies and include them into the build.
            await waitMilliSeconds();
            //console.log(`[UuiModulesBuild] Building "${m}"...`);
            try {
                const ctrl = this._watchControlMap[m];
                if (ctrl) {
                    await ctrl.triggerBuild();
                    this._uuiBuildProgress.setProgress(m, STATE.DONE);
                } else {
                    const moduleRootDir = await getModuleRootDir(m);
                    this._watchControlMap[m] = await buildModule({ cwd: moduleRootDir, isWatch: true });
                    this._uuiBuildProgress.setProgress(m, STATE.DONE);
                }
                //console.log(`[UuiModulesBuild] Module built "${m}". Took: ${(Date.now() - mStart)/1000} (sec)`);
            } catch (err) {
                //console.log(`[UuiModulesBuild] Module failed "${m}". Took: ${(Date.now() - mStart)/1000} (sec)`);
                //console.error('[UuiModulesBuild]', err, this._uuiBuildProgress);
                this._uuiBuildProgress.setProgress(m, STATE.DONE_ERR);

                if (this._isInitial) {
                    process.exit(1);
                }
            }
        }

        return new Promise((resolve, reject) => {
            const recheck = () => {
                if (!this._uuiBuildProgress) {
                    return;
                }
                const allDone = this._uuiBuildProgress.isAllDone()
                if (!allDone) {
                    const arr = this._uuiBuildProgress.getNextModules();
                    arr.forEach(m => buildSingleModule(m).finally(() => recheck()));
                } else {
                    this._uuiBuildProgress.printStats();
                    this._uuiBuildProgress = undefined;
                    //console.log(`Success! Took: ${(Date.now() - start)/1000} (sec)`);
                    if (this._isInitial) {
                        this._isInitial = false;
                        console.log('*** Initial build completed ***\n')
                    }
                    resolve();
                }
            };
            recheck();
        })
    }

}

// check this.invalidated (task) & this.running (watch) on each tick to understand which modules need to be rebuilt

/**
 * 1. all modules are build in according to the dependency graph.
 * 2. after every single module is build - a watcher is started automatically.
 * the watcher doesn't rebuild itself on file change. It only notifies that rebuild is needed due to changes in files
 * 3. when rebuild is requested, then we should trigger a rebuild explicitly,
 * and also do this for every module which depends on it.
 * 4. when rebuild is already in progress and another rebuild was requested, then we should check:
 * - if requested module is on the list of modules which will be build in current run, then we just do nothing
 * - otherwise, we schedule this module to be rebuilt after current run is fully completed.
 * - if any error occurs, then we don't build any dependencies of failed module.
 */


/**
 * 1. build all workspaces in a correct order, and enable watch. If any package build failed, then terminate the process.
 * 2. start dev server
 */
async function runDev() {
    await cleanupAllModules();
    const uuiBuild = new UuiModulesBuild({ excludeModules: [
            /*"@epam/uui-core",*/
           /* "@epam/uui-components",*/
/*            "@epam/assets",
           "@epam/uui-db", "@epam/uui-docs", "@epam/uui-editor", "@epam/uui-timeline",
            '@epam/loveship', '@epam/promo', '@epam/uui',*/
        '@epam/app', "@epam/uui-build", '@epam/draft-rte', '@epam/uui-extra'] });
    await uuiBuild.init()
    await uuiBuild.buildInitial();

    checkForChanges();

    function checkForChanges() {
        setTimeout(() => {
            //console.log('tick')
            uuiBuild.buildNext().catch(console.error);
            checkForChanges();
        }, 1000);
    }

    // start local dev server
    runCliCommandAsync(process.cwd(), 'yarn start');
}

runDev();
