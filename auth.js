// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 使用全局的 auth0Client
        const auth0 = window.auth0Client;

        if (!auth0) {
            throw new Error('Auth0 客户端未初始化');
        }

        // 登录按钮点击事件
        document.getElementById('loginBtn').addEventListener('click', async () => {
            try {
                console.log('开始登录...');
                await auth0.loginWithPopup();
                const user = await auth0.getUser();
                console.log('用户信息:', user);
                
                if (user) {
                    // 更新UI
                    document.getElementById('loginBtn').style.display = 'none';
                    document.getElementById('user-profile').style.display = 'flex';
                    document.getElementById('user-name').textContent = user.name;
                    document.getElementById('user-avatar').src = user.picture || 'default-avatar.png';
                    
                    // 保存到MongoDB
                    await saveUserToMongoDB(user);
                }
            } catch (error) {
                console.error('登录错误:', error);
            }
        });

        // 退出按钮点击事件
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                await auth0.logout({
                    returnTo: window.location.origin
                });
                document.getElementById('loginBtn').style.display = 'block';
                document.getElementById('user-profile').style.display = 'none';
            } catch (error) {
                console.error('退出错误:', error);
            }
        });

        // 检查是否已登录
        const isAuthenticated = await auth0.isAuthenticated();
        if (isAuthenticated) {
            const user = await auth0.getUser();
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('user-profile').style.display = 'flex';
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-avatar').src = user.picture || 'default-avatar.png';
        }

    } catch (error) {
        console.error('Auth0 初始化错误:', error);
    }
});

// 保存用户信息到MongoDB
async function saveUserToMongoDB(user) {
    try {
        const response = await fetch('/api/save-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auth0Id: user.sub,
                email: user.email,
                name: user.name,
                picture: user.picture,
                lastLogin: new Date()
            })
        });
        
        if (!response.ok) {
            throw new Error('保存用户信息失败');
        }
    } catch (err) {
        console.error("保存用户信息错误:", err);
    }
} 