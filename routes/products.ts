import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import type { Product } from "../models/product.ts";
import { db } from "../db/mongo.ts";

export const productsRouter = new Router();

// 获取所有产品
productsRouter.get("/", async (ctx) => {
  const products = await db.collection("products").find().toArray();
  ctx.response.body = products;
});

// 获取单个产品
productsRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  const product = await db.collection("products").findOne({ _id: id });
  ctx.response.body = product;
});

// 创建产品
productsRouter.post("/", async (ctx) => {
  const body = await ctx.request.body().value;
  const result = await db.collection("products").insertOne(body);
  ctx.response.body = result;
});

// 更新产品
productsRouter.put("/:id", async (ctx) => {
  const { id } = ctx.params;
  const body = await ctx.request.body().value;
  const result = await db.collection("products").updateOne(
    { _id: id },
    { $set: body }
  );
  ctx.response.body = result;
});

// 删除产品
productsRouter.delete("/:id", async (ctx) => {
  const { id } = ctx.params;
  const result = await db.collection("products").deleteOne({ _id: id });
  ctx.response.body = result;
}); 