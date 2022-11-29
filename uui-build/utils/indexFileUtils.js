const fs = require("fs-extra");
const path = require("path");

const indexFileNames = ["index.ts", "index.tsx", "src/index.ts", "src/index.tsx"];
async function getIndexFileName(params) {
    const { cwd } = params;
    const found = await Promise.all(        indexFileNames.map(async (name) => {
        const hasIt = await fs.exists(path.resolve(cwd, `./${name}`));
        if (hasIt) {
            return name;
        }
    }));
    return found.find(Boolean);
}

exports.getIndexFileName = getIndexFileName;
