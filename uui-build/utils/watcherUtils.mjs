import chokidar from "chokidar";

export function watchDirs({ rootDirs, ignored, delay = 0, onChange }) {
    let tid;
    let isListenerInProgress = false;
    let shouldInvokeListenerAgain = false;

    function invokeListener(path) {
        isListenerInProgress = true;
        onChange(path)
            .catch(err => {
                console.error("[watchDirs] error in listener", err);
            })
            .finally(() => { isListenerInProgress = false; shouldInvokeListenerAgain && invokeListener(path); }); // TODO: check invoke again logic
    }

    // TODO: check delayed logic
    function invokeListenerDelayed(path) {
        tid && clearTimeout(tid);
        tid = setTimeout(() => invokeListener(path), delay);
    }

    chokidar
        .watch(rootDirs, { ignored, persistent: true, ignoreInitial: true })
        .on("error", (error) => {
            console.error(`[watchDirs] Unable to watch dirs. ${JSON.stringify(error)}`)
        })
        .on("ready", () => {
            console.info(`[watchDirs] Watching dirs.\n${rootDirs.join("\n")}`);
            invokeListenerDelayed();
        })
        .on("all", (event, path) => {
            console.info(`[watchDirs] Path changed: ${path}`);
            invokeListenerDelayed(path);
        });
}
