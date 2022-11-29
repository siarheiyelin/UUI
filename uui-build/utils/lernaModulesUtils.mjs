import Project from "@lerna/project";
import { PackageGraph } from "@lerna/package-graph";
import path from "path";

function getModulesFilter({ excludeModules }) {
    return (item) => {
        const isExcluded = excludeModules.indexOf(item.name) !== -1;
        return !isExcluded;
    }
}

export async function getDependenciesMap({ excludeModules }) {
    // every dependency including transitive should not be excluded, otherwise this module won't build.
    const filter = getModulesFilter({ excludeModules })
    const list = await getPackagesList()
    const listMap = list.reduce((acc, m) => {acc[m.name] = m; return acc;}, {})
    function _isNotExcluded(m) {
        if (filter(m)) {
            const _deps = Array.from(m.localDependencies.values()).map(({name}) => listMap[name])
            return _deps.every(_isNotExcluded)
        }
        return false
    }
    return list.reduce((acc, item) => {
        if (_isNotExcluded(item)) {
            acc[item.name] = Array.from(item.localDependencies.values()).map(dep => dep.name);
        }
        return acc;
    }, {});
}

export async function getDependentsMap({ excludeModules }) {
    const filter = getModulesFilter({ excludeModules })
    const list = await getPackagesList()
    //const listMap = list.reduce((acc, m) => {acc[m.name] = m; return acc;}, {})
    // map: "module name" -> "array of modules which depend on it"
    return list.reduce((acc, item) => {
        const deps = Array.from(item.localDependents.values())
        if (filter(item)) {
            acc[item.name] = deps.filter(filter).map(dep => dep.name);
        }
        return acc;
    }, {});
}

let packageGraphValuesCache;
export async function getPackagesList(params) {
    if (!packageGraphValuesCache) {
        const packages = await Project.getPackages();
        const graph = new PackageGraph(packages);
        packageGraphValuesCache = Array.from(graph.values());
    }
    const { exclude = [] } = params || {};
    return packageGraphValuesCache.reduce((acc, p) => {
        if (exclude.indexOf(p.name) === -1) {
            acc.push(p);
        }
        return acc;
    }, [])
}

export async function getModuleRootDir(moduleName) {
    const list = await getPackagesList()
    return list.find(e => e.name === moduleName).location;
}

export async function getModuleNamePathBelongsTo({ pathToCheck }) {
    const list = await getPackagesList()
    const found = list.find(p => {
        const pSplit = p.location.split(path.sep)
        const pathSplit = pathToCheck.split(path.sep)
        return pSplit.every((pToken, index) => {
            return pathSplit[index] === pToken;
        })
    })
    return found && found.name;
}
