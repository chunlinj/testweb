import { MongoClient } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

const client = new MongoClient();

try {
  // 使用完整的连接配置
  await client.connect({
    db: "sorryios",
    tls: false, // 禁用 TLS/SSL
    servers: [
      {
        host: "45.136.15.204",
        port: 27017,
      },
    ],
  });
  
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("Failed to connect to MongoDB:", err);
  throw err;
}

export const db = client.database("sorryios"); 