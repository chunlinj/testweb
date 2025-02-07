import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";
import { create, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { crypto } from "https://deno.land/std@0.220.1/crypto/mod.ts";

// 声明数据库相关变量
let db: any;
let users: any;
let verificationCodes: any;

// 初始化 MongoDB 连接
const client = new MongoClient();
try {
    await client.connect({
        db: "userSystem",
        tls: false,
        servers: [{
            host: "127.0.0.1",
            port: 27017,
        }],
    });
    console.log("MongoDB 连接成功");

    // 初始化数据库和集合
    db = client.database("userSystem");
    users = db.collection("users");
    verificationCodes = db.collection("verificationCodes");

    // 创建索引
    try {
        // 为用户集合创建索引
        await users.createIndexes({
            indexes: [{
                key: { username: 1 },
                name: "username_unique",
                unique: true
            }, {
                key: { email: 1 },
                name: "email_index"
            }]
        });

        // 为验证码集合创建索引
        await verificationCodes.createIndexes({
            indexes: [{
                key: { email: 1, code: 1 },
                name: "email_code_index"
            }, {
                key: { createdAt: 1 },
                name: "ttl_index",
                expireAfterSeconds: 300
            }]
        });

        console.log("索引创建成功");
    } catch (error) {
        console.error("创建索引失败:", error);
    }
} catch (err) {
    console.error("MongoDB 连接失败:", err);
    throw err;
}

// 修改验证码保存逻辑
async function saveVerificationCode(email: string, code: string) {
    if (!verificationCodes) {
        throw new Error("数据库未连接");
    }
    await verificationCodes.insertOne({
        email,
        code,
        createdAt: new Date(),
        expired: false
    });
}

// 修改验证码验证逻辑
async function verifyCode(email: string, code: string): Promise<boolean> {
    const result = await verificationCodes.findOne({
        email,
        code,
        expired: false,
        createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });
    return result !== null;
}

// 修改用户注册逻辑
async function registerUser(username: string, password: string, email: string, avatar: string) {
    await users.insertOne({
        username,
        password,
        email,
        avatar,
        createdAt: new Date()
    });
}

// 修改用户登录逻辑
async function findUser(username: string): Promise<any> {
    const result = await users.findOne({ username });
    return result;
}

// 创建 Oak 应用
const app = new Application();
const router = new Router();

// 修改 body 解析中间件
app.use(async (ctx, next) => {
    if (ctx.request.hasBody) {
        const body = await ctx.request.body().value;
        ctx.state.body = body;  // 将解析后的 body 存储在 state 中
    }
    await next();
});

// 添加 CORS 中间件
app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    
    if (ctx.request.method === "OPTIONS") {
        ctx.response.status = 200;
        return;
    }
    
    await next();
});

// JWT 密钥
const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"]
);

// 邮件客户端配置
const smtp = new SMTPClient({
    connection: {
        hostname: "smtp.qq.com",
        port: 465,
        tls: true,
        auth: {
            username: "1499831507@qq.com",
            password: "lixtzwsexpvifffc",
        },
    },
});

// 生成验证码
function generateVerificationCode(): string {
    return Math.random().toString().slice(2, 8);
}

// 添加数据库连接检查中间件
app.use(async (ctx, next) => {
    if (!db || !users || !verificationCodes) {
        ctx.response.status = 503;
        ctx.response.body = { 
            success: false, 
            error: "数据库服务不可用，请稍后重试" 
        };
        return;
    }
    await next();
});

// API 路由
router
    // 发送验证码
    .post("/api/send-verification-code", async (ctx) => {
        try {
            const body = ctx.state.body;  // 从 state 中获取 body
            if (!body || typeof body !== 'object') {
                throw new Error('Invalid request body');
            }
            
            const email = body.email;
            if (!email) {
                ctx.response.status = 400;
                ctx.response.body = { success: false, error: "邮箱地址不能为空" };
                return;
            }

            // 检查是否在一分钟内发送过验证码
            const recentCode = await verificationCodes.findOne({
                email,
                createdAt: { $gt: new Date(Date.now() - 60 * 1000) }  // 1分钟内
            });

            if (recentCode) {
                ctx.response.status = 400;
                ctx.response.body = { 
                    success: false, 
                    error: "请等待60秒后再次发送验证码",
                    remainingTime: Math.ceil((recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000)
                };
                return;
            }

            const code = generateVerificationCode();
            
            try {
                // 保存验证码到数据库
                await saveVerificationCode(email, code);

                // 发送验证码邮件
                await smtp.send({
                    from: "1499831507@qq.com",
                    to: email,
                    subject: "注册验证码",
                    html: `
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                            <h2 style="color: #333; text-align: center;">验证码</h2>
                            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center;">
                                <p style="font-size: 16px; color: #666;">您的验证码是：</p>
                                <h1 style="color: #007bff; font-size: 32px; margin: 20px 0;">${code}</h1>
                                <p style="color: #999; font-size: 14px;">验证码有效期为5分钟，请尽快使用。</p>
                            </div>
                            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                                此邮件由系统自动发送，请勿回复。
                            </p>
                        </div>
                    `
                });

                ctx.response.body = { 
                    success: true,
                    message: "验证码已发送到您的邮箱" 
                };
            } catch (emailError) {
                console.error("发送邮件失败:", emailError);
                ctx.response.status = 500;
                ctx.response.body = { 
                    success: false, 
                    error: "发送验证码失败，请稍后重试" 
                };
            }
        } catch (error) {
            console.error("处理请求错误:", error);
            ctx.response.status = 500;
            ctx.response.body = { 
                success: false, 
                error: "服务器内部错误" 
            };
        }
    })

    // 用户注册
    .post("/api/register", async (ctx) => {
        const body = ctx.state.body;
        const { username, password, email, verificationCode, avatar } = body;

        try {
            // 验证验证码
            const validCode = await verifyCode(email, verificationCode);

            if (!validCode) {
                ctx.response.status = 400;
                ctx.response.body = { error: "验证码无效或已过期" };
                return;
            }

            // 检查用户名是否存在
            const existingUser = await findUser(username);
            if (existingUser) {
                ctx.response.status = 400;
                ctx.response.body = { error: "用户名已存在" };
                return;
            }

            // 密码加密
            const hashedPassword = await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(password)
            );

            // 保存用户信息
            await registerUser(username, hashedPassword, email, avatar);

            // 使验证码失效
            await verificationCodes.updateOne(
                { email, code: verificationCode },
                { $set: { expired: true } }
            );

            // 生成 JWT token
            const token = await create({ alg: "HS512", typ: "JWT" }, { username }, key);

            ctx.response.body = { 
                success: true, 
                token,
                user: {
                    username,
                    email,
                    avatar
                }
            };
        } catch (error) {
            console.error("注册错误:", error);
            ctx.response.status = 500;
            ctx.response.body = { error: "注册失败，请稍后重试" };
        }
    })

    // 用户登录
    .post("/api/login", async (ctx) => {
        const body = ctx.state.body;
        const { username, password } = body;

        // 查找用户
        const user = await findUser(username);
        if (!user) {
            ctx.response.status = 401;
            ctx.response.body = { error: "用户名或密码错误" };
            return;
        }

        // 验证密码
        const hashedPassword = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );

        if (hashedPassword !== user.password) {
            ctx.response.status = 401;
            ctx.response.body = { error: "用户名或密码错误" };
            return;
        }

        // 生成 JWT token
        const token = await create({ alg: "HS512", typ: "JWT" }, { username }, key);

        ctx.response.body = {
            success: true,
            token,
            user: {
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        };
    })

    // 上传头像
    .post("/api/upload-avatar", async (ctx) => {
        const body = await ctx.request.body().value;
        const file = body.get("avatar");
        
        // 保存文件到服务器
        const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        await Deno.writeFile(`./uploads/${fileName}`, file.content);

        ctx.response.body = {
            success: true,
            url: `/uploads/${fileName}`
        };
    })

    // 添加保存用户API路由
    .post("/api/save-user", async (ctx) => {
        try {
            const userData = ctx.state.body;
            
            // 查找是否存在该用户
            const existingUser = await users.findOne({ auth0Id: userData.auth0Id });
            
            if (existingUser) {
                // 更新用户信息
                await users.updateOne(
                    { auth0Id: userData.auth0Id },
                    { $set: {
                        lastLogin: userData.lastLogin,
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture
                    }}
                );
            } else {
                // 创建新用户
                await users.insertOne({
                    ...userData,
                    createdAt: new Date()
                });
            }
            
            ctx.response.body = { success: true };
        } catch (error) {
            console.error("保存用户错误:", error);
            ctx.response.status = 500;
            ctx.response.body = { 
                success: false, 
                error: "保存用户信息失败" 
            };
        }
    });

// 添加路由
app.use(router.routes());
app.use(router.allowedMethods());

// 静态文件服务放在最后
app.use(async (ctx) => {
    try {
        await ctx.send({
            root: Deno.cwd(),
            index: "index.html",
        });
    } catch {
        ctx.response.status = 404;
        ctx.response.body = "404 Not Found";
    }
});

// 启动服务器
console.log("服务器运行在 http://localhost:8000");
await app.listen({ port: 8000 }); 