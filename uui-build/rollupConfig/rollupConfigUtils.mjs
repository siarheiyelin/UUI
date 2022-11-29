// backup of lates rollup.config.mjs


import * as rollup from 'rollup';
import { getConfig } from "./rollup.config.mjs";
import { getModuleRootDir } from "../utils/lernaModulesUtils.mjs";
import * as rollupDistSharedWatch from "rollup/dist/shared/watch.js";
import chalk from "chalk";
const eventsRewrites = {
    create: {
        create: 'buggy',
        delete: null,
        update: 'create'
    },
    delete: {
        create: 'update',
        delete: 'buggy',
        update: 'buggy'
    },
    update: {
        create: 'buggy',
        delete: 'delete',
        update: 'update'
    }
};
const { Watcher } = rollupDistSharedWatch;


class UuiWatcher extends Watcher {
    _firstTimeRun = true;

    constructor(cfg, emitter, moduleName) {
        super(cfg, emitter);
        this._moduleName = moduleName;
    }
    async run () {
        // don't try build anything on file change - explicitly invoke triggerBuild instead.
        //console.log(`File watcher has detected change in "${this._moduleName}".`);
        if (this._firstTimeRun) {
            this._firstTimeRun = false;
            this.running = true;
            await this.emitter.emit('event', {
                code: 'START',
            });
            for (const task of this.tasks) {
                await task.run();
            }
            this.running = false;
            await this.emitter.emit('event', {
                code: 'END',
            });
            if (this.rerun) {
                this.rerun = false;
                this.invalidate();
            }
        }
    }
    invalidate = (file) => {
        if (file) {
            const previousEvent = this.invalidatedIds.get(file.id);
            const event = previousEvent ? eventsRewrites[previousEvent][file.event] : file.event;
            if (event === 'buggy') {
                //TODO: throws or warn? Currently just ignore, uses new event
                this.invalidatedIds.set(file.id, file.event);
            } else if (event === null) {
                this.invalidatedIds.delete(file.id);
            } else {
                this.invalidatedIds.set(file.id, event);
            }
        }
        if (this.running) {
            this.rerun = true;
            return;
        }
        if (this.buildTimeout) {
            clearTimeout(this.buildTimeout);
        }
        //this.triggerBuild()
    }
    triggerBuild = () => {
        if (this.buildTimeout) {
            clearTimeout(this.buildTimeout);
        }
        this.buildTimeout = setTimeout(async () => {
            this.buildTimeout = null;
            try {
                await Promise.all([...this.invalidatedIds].map(([id, event]) => this.emitter.emit('change', id, { event })));
                this.invalidatedIds.clear();
                await this.emitter.emit('restart');
                this.emitter.removeListenersForCurrentRun();
                super.run();
            } catch (error) {
                this.invalidatedIds.clear();
                await this.emitter.emit('event', {
                    code: 'ERROR',
                    error,
                    result: null,
                });
                await this.emitter.emit('event', {
                    code: 'END',
                });
            }
        }, this.buildDelay);
    }
    needsRebuild = () => {
        return this.tasks[0].invalidated;
    }
}

class WatchEmitter {
    constructor() {
        this.currentHandlers = Object.create(null);
        this.persistentHandlers = Object.create(null);
    }
    // Will be overwritten by Rollup
    async close() { }
    emit(event, ...parameters) {
        return Promise.all([...this.getCurrentHandlers(event), ...this.getPersistentHandlers(event)].map(handler => handler(...parameters)));
    }
    off(event, listener) {
        const listeners = this.persistentHandlers[event];
        if (listeners) {
            // A hack stolen from "mitt": ">>> 0" does not change numbers >= 0, but -1
            // (which would remove the last array element if used unchanged) is turned
            // into max_int, which is outside the array and does not change anything.
            listeners.splice(listeners.indexOf(listener) >>> 0, 1);
        }
        return this;
    }
    on(event, listener) {
        this.getPersistentHandlers(event).push(listener);
        return this;
    }
    onCurrentRun(event, listener) {
        this.getCurrentHandlers(event).push(listener);
        return this;
    }
    once(event, listener) {
        const selfRemovingListener = (...parameters) => {
            this.off(event, selfRemovingListener);
            return listener(...parameters);
        };
        this.on(event, selfRemovingListener);
        return this;
    }
    removeAllListeners() {
        this.removeListenersForCurrentRun();
        this.persistentHandlers = Object.create(null);
        return this;
    }
    removeListenersForCurrentRun() {
        this.currentHandlers = Object.create(null);
        return this;
    }
    getCurrentHandlers(event) {
        return this.currentHandlers[event] || (this.currentHandlers[event] = []);
    }
    getPersistentHandlers(event) {
        return this.persistentHandlers[event] || (this.persistentHandlers[event] = []);
    }
}

function uuiWatch(configs, moduleName) {
    const emitter = new WatchEmitter();
    const watcher = new UuiWatcher(configs, emitter, moduleName);
    return {
        emitter,
        watcher,
    };
}

export async function buildUsingRollup({ moduleName}) {
    const moduleRootDir = await getModuleRootDir(moduleName);
    const cfg = await getConfig({ moduleRootDir });
    const { output: outputConfig, ...inputConfig} = cfg[0];
    let bundle;
    try {
        bundle = await rollup.rollup({
            ...inputConfig,
        });
        if (bundle.getTimings) {
            console.log(bundle.getTimings());
        }
        await Promise.all(outputConfig.map(bundle.write));
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
    if (bundle) {
        await bundle.close();
    }
}

export async function watchUsingRollup({ moduleName }) {
    const moduleRootDir = await getModuleRootDir(moduleName);
    const cfg = await getConfig({ moduleRootDir });
    const { emitter, watcher  } = uuiWatch(cfg, moduleName);


    /*    const config = cfg[0];
        const watcher = rollup.watch(config);*/
    let isFirstAttemptToBuildBundle = true;
    let bundleStartTime;

    function logBundleStart() {
        bundleStartTime = Date.now();
        console.log(chalk.green(`Module rebuild started "${moduleName}"`));
    }
    function logBundleEnd() {
        const end = Date.now();
        const took = `${Math.round((end - bundleStartTime) / 1000)} (sec)`;
        const watchedFiles = Array.from(watcher.tasks[0].fileWatcher.watcher._closers.entries()).length;
        console.log(chalk.green(`Module "${moduleName}": built in ${took}. Watching ${watchedFiles} files`));
    }

    let buildListeners = []; // { resolve, reject }
    const addBuildListener = (fn) => {
        buildListeners.push(fn);
        return () => {
            buildListeners = buildListeners.filter(f => f !== fn)
        }
    }
    const notifyBuildListeners = (isSuccess) => {
        [...buildListeners].forEach(l => l(isSuccess));
    }


    emitter.on('event', (params) => {
        const { result, code, input } = params;
        if (code === 'ERROR') {
            console.error(params);
            if (isFirstAttemptToBuildBundle) {
                watcher.close().finally(() => {
                    notifyBuildListeners(false)
                });
            } else {
                notifyBuildListeners(false)
            }
        }
        if (code === 'BUNDLE_START') {
            logBundleStart();
        }
        if (code === 'BUNDLE_END') {
            logBundleEnd();
            notifyBuildListeners(true);
        }
        if (code === 'END') {
            isFirstAttemptToBuildBundle = false;
        }
        if (result) {
            // link describing why it's needed: https://rollupjs.org/guide/en/#rollupwatch
            result.close();
        }
    });

    const initialBuildPromise = new Promise((resolve, reject) => {
        const removeSelf = addBuildListener((isSuccess) => {
            removeSelf();
            isSuccess ? resolve() : reject(new Error(`Build failed: ${moduleName}.`));
        })
    });

    await initialBuildPromise;

/*    const handler = (params) => {
        const { result, code, input, error } = params;
        if (result) {
            // link describing why it's needed: https://rollupjs.org/guide/en/#rollupwatch
            result.close();
        }
        switch (code) {
            case 'ERROR': {
                logBundleStart();
                break;
            }
            case 'BUNDLE_END': {
                logBundleEnd();
                break;
            }
        }
    };*/
/*    emitter.on('event', handler)*/

    const triggerBuild = async () => {
        await new Promise((resolve, reject) => {
            const removeSelf = addBuildListener((isSuccess) => {
                removeSelf();
                isSuccess ? resolve() : reject();
            })
            watcher.triggerBuild();
        });
    };

    //await triggerBuild()

    const needsRebuild = () => {
        return watcher.needsRebuild();
    };

    return {
        needsRebuild,
        triggerBuild,
    };
}
