import { Application, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { router } from "./routes/mod.ts";

const app = new Application();

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = err.status || 500;
    ctx.response.body = { error: err.message };
  }
});

// CORS
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  await next();
});

// 静态文件服务和 Google 验证
app.use(async (ctx, next) => {
  // 特殊处理 Google 验证文件
  if (ctx.request.url.pathname === "/google12e945de79f560bc.html") {
    ctx.response.type = "text/html";
    ctx.response.body = "google-site-verification: google12e945de79f560bc.html";
    return;
  }

  try {
    // 如果是根路径，则返回 index.html
    if (ctx.request.url.pathname === "/") {
      await send(ctx, "index.html", {
        root: Deno.cwd(),
      });
      return;
    }
    
    // 其他静态文件
    await send(ctx, ctx.request.url.pathname, {
      root: Deno.cwd(),
    });
  } catch {
    await next(); // 如果不是静态文件，继续下一个中间件
  }
});

// API 路由
app.use(router.routes());
app.use(router.allowedMethods());

// 404 处理
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "Not found";
});

// 启动服务器
const port = 8000;
console.log(`Server running on port ${port}`);

await app.listen({ port }); 