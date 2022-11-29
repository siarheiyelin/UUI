import { resolve } from 'path';
import fs from 'fs';
import {getModuleRootDir, getPackagesList} from "./lernaModulesUtils.mjs";

async function forEachFile({ dir, callback, exclude }) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    entries.forEach(e => {
        const resolvedPath = resolve(dir, e.name);
        const isDir = e.isDirectory()
        if (!exclude({ resolvedPath, isDir })) {
            isDir ? forEachFile({ dir: resolvedPath, callback, exclude }) : callback(resolvedPath)
        }
    })
}

const excludedDirs = [
    '/node_modules',
    '/build',
]


function modifyFiles({ dir, ext, newContent }) {
    forEachFile({
        dir,
        callback: (resolvedPath) => {
            if (resolvedPath.indexOf(ext) !== -1) {
                fs.writeFileSync(resolvedPath, newContent);
            }
        },
        exclude: ({ resolvedPath, isDir }) => {
            return excludedDirs.some(d => resolvedPath.indexOf(d) !== -1)
        }
    })
}

function modify() {
    modifyFiles({ dir: 'D:\\Projects\\EPM-UUI\\UUI\\epam-assets', ext: '.scss', newContent: 'export default {};' });
    modifyFiles({ dir: 'D:\\Projects\\EPM-UUI\\UUI\\epam-promo', ext: '.scss', newContent: 'export default {};' });
    modifyFiles({ dir: 'D:\\Projects\\EPM-UUI\\UUI\\epam-assets', ext: '.svg', newContent: 'export const ReactComponent = () => null;' });
    modifyFiles({ dir: 'D:\\Projects\\EPM-UUI\\UUI\\epam-promo', ext: '.svg', newContent: 'export const ReactComponent = () => null;' });
}


export async function cleanupAllModules() {
    const subDirsToRemove = ['/build']
    const list = await getPackagesList()
    const listRootDirs = await Promise.all(
        list.map(async (m) => await getModuleRootDir(m.name))
    );
    listRootDirs.forEach(dir => {
        subDirsToRemove.forEach(sd => {
            const toDel = dir + sd
            fs.rmSync(toDel, { recursive: true, force: true });
            console.log(`Deleted ${toDel}`)
        });
    });
}
cleanupAllModules()
