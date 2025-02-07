class FloatButtons {
    constructor() {
        this.init();
    }

    init() {
        this.loadComponent();
        this.initEventListeners();
    }

    async loadComponent() {
        try {
            const response = await fetch('/components/float-buttons.html');
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
        } catch (error) {
            console.error('加载悬浮按钮组件失败:', error);
        }
    }

    initEventListeners() {
        // 微信按钮点击事件
        document.getElementById('wechatBtn')?.addEventListener('click', (e) => {
            // 检测是否在移动设备上
            if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                e.preventDefault();
                alert('请使用手机微信扫描二维码添加企业微信');
                // 这里可以选择性地显示二维码
            }
            // 在移动设备上会直接通过 href 跳转到微信
        });
    }
} 