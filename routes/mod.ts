import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { productsRouter } from "./products.ts";

export const router = new Router();

// Google 验证路由
router.get("/google12e945de79f560bc.html", (ctx) => {
  ctx.response.type = "text/html";
  ctx.response.body = "google-site-verification: google12e945de79f560bc.html";
});

// 首页路由
router.get("/", (ctx) => {
  ctx.response.body = "Welcome to SorryIOS Admin API";
});

// 产品路由
router.use("/api/products", productsRouter.routes()); 