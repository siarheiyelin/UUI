import { spawn, sync } from 'cross-spawn'; // improved version of child_process.spawn

export async function runCliCommandAsync(cwd, command) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            command,
            { stdio: 'inherit', shell: true, cwd }
        )
        child.on('exit', (arg) => resolve(arg))
            .on('error', (arg) => reject(arg))
    })
}
export async function runCliCommand(cwd, command) {
    sync(
        command,
        { stdio: 'inherit', shell: true, cwd }
    )
}

