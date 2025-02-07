const watcher = Deno.watchFs(".");
const run = async () => {
    const process = Deno.run({
        cmd: ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server.ts"]
    });
    await process.status();
};

console.log("开始监视文件变化...");
run();

for await (const event of watcher) {
    if (event.kind === "modify") {
        console.log("检测到文件变化，重启服务器...");
        run();
    }
} 