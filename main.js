import { Auth0Client } from '@auth0/auth0-spa-js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import Clerk from '@clerk/clerk-js';

const auth0 = new Auth0Client({
    domain: 'YOUR_AUTH0_DOMAIN',
    client_id: 'YOUR_CLIENT_ID',
    redirect_uri: window.location.origin
});

const firebaseConfig = {
    // 你的Firebase配置
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY');

const clerk = new Clerk('YOUR_PUBLISHABLE_KEY');

document.addEventListener('DOMContentLoaded', () => {
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 按钮点击事件
    const ctaButton = document.querySelector('.cta-button');
    ctaButton.addEventListener('click', () => {
        alert('感谢您的关注！');
    });

    // 获取DOM元素
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const notLoggedIn = document.getElementById('notLoggedIn');
    const loggedIn = document.getElementById('loggedIn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const sendVerifyCode = document.getElementById('sendVerifyCode');

    // 检查登录状态
    const token = localStorage.getItem('token');
    if (token) {
        notLoggedIn.classList.add('hidden');
        loggedIn.classList.remove('hidden');
    } else {
        notLoggedIn.classList.remove('hidden');
        loggedIn.classList.add('hidden');
    }

    // 切换模态框显示
    function showModal(modal) {
        if (!modal) {
            console.error('模态框元素不存在');
            return;
        }
        // 先隐藏所有模态框
        document.querySelectorAll('.modal').forEach(m => {
            m.classList.add('hidden');
            m.classList.remove('show');
        });
        // 显示指定的模态框
        modal.classList.remove('hidden');
        modal.classList.add('show');
        console.log('显示模态框:', modal.id);
    }

    // 隐藏所有模态框
    function hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('show');
        });
    }

    // 登录按钮点击事件
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('点击登录按钮');
            showModal(loginModal);
        });
    }

    // 退出登录
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            notLoggedIn.classList.remove('hidden');
            loggedIn.classList.add('hidden');
        });
    }

    // 切换到注册
    if (switchToRegister) {
        switchToRegister.addEventListener('click', () => {
            console.log('切换到注册');
            showModal(registerModal);
        });
    }

    // 切换到登录
    if (switchToLogin) {
        switchToLogin.addEventListener('click', () => {
            console.log('切换到登录');
            showModal(loginModal);
        });
    }

    // 头像预览
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // 发送验证码
    if (sendVerifyCode) {
        let countdown = 60;
        let timer = null;
        sendVerifyCode.addEventListener('click', async function() {
            // 如果按钮已经禁用，直接返回
            if (this.disabled) {
                return;
            }

            const email = document.getElementById('registerEmail').value;
            if (!email || !email.includes('@')) {
                alert('请输入有效的邮箱地址');
                return;
            }

            try {
                // 先禁用按钮
                this.disabled = true;
                this.classList.add('disabled');
                countdown = 60;  // 重置倒计时
                this.textContent = `${countdown}秒后重试`;  // 立即更新文本

                const response = await fetch('/api/send-verification-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();
                if (data.success) {
                    // 清除可能存在的旧定时器
                    if (timer) {
                        clearInterval(timer);
                    }

                    // 启动新的倒计时
                    timer = setInterval(() => {
                        countdown--;
                        if (countdown <= 0) {
                            // 倒计时结束
                            clearInterval(timer);
                            this.disabled = false;  // 取消禁用状态
                            this.classList.remove('disabled');  // 移除禁用样式
                            this.style.backgroundColor = '#28a745';  // 恢复绿色背景
                            this.style.cursor = 'pointer';  // 恢复指针样式
                            this.textContent = '发送验证码';  // 恢复原始文本
                        } else {
                            // 更新倒计时文本
                            this.textContent = `${countdown}秒后重试`;
                        }
                    }, 1000);
                } else {
                    // 发送失败时恢复按钮状态
                    this.disabled = false;
                    this.classList.remove('disabled');
                    this.textContent = '发送验证码';
                    alert(data.error || '发送失败，请稍后重试');
                }
            } catch (error) {
                // 发生错误时恢复按钮状态
                this.disabled = false;
                this.classList.remove('disabled');
                this.textContent = '发送验证码';
                console.error('发送验证码错误:', error);
                alert('发送失败，请稍后重试');
            }
        });
    }

    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... 登录逻辑保持不变 ...
        });
    }

    // 处理注册表单提交
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... 注册逻辑保持不变 ...
        });
    }

    // 关闭按钮点击事件
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', hideModals);
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModals();
        }
    });

    // Clerk 使用内置UI组件
    clerk.mountSignIn(document.getElementById('sign-in'));

    // Supabase 登录
    const { user, error } = await supabase.auth.signIn({
        email: 'example@email.com',
        password: 'password'
    });

    // 分类标签切换
    const categoryTags = document.querySelectorAll('.category-tag');
    categoryTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除所有标签的 active 类
            categoryTags.forEach(t => t.classList.remove('active'));
            // 给当前点击的标签添加 active 类
            tag.classList.add('active');
            
            // 这里可以添加筛选产品的逻辑
            const category = tag.getAttribute('href').replace('#', '');
            console.log('选择的分类:', category);
        });
    });
}); 