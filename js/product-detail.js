class ProductDetail {
    constructor() {
        this.init();
    }

    init() {
        this.loadProductData();
        this.initEventListeners();
    }

    loadProductData() {
        // 获取URL中的商品ID
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        // 获取商品数据
        const product = products[productId];
        if (!product) {
            window.location.href = '/'; // 如果商品不存在，返回首页
            return;
        }

        // 更新页面内容
        this.updatePageContent(product);
    }

    updatePageContent(product) {
        // 更新标题
        document.title = `${product.title} | sorryios`;
        document.querySelector('.product-title').textContent = product.title;

        // 更新商品信息
        document.querySelector('.meta-item:nth-child(1) span').textContent = product.stock;
        document.querySelector('.meta-item:nth-child(2) span').textContent = `(${product.limit})`;
        document.querySelector('.meta-item:nth-child(3) .price').textContent = `￥${product.price.toFixed(2)}`;

        // 更新商品描述
        const descContent = document.querySelector('.description-content');
        descContent.querySelector('h3').textContent = product.description.intro;
        // ... 更新其他描述内容
    }

    initEventListeners() {
        // 下单按钮点击事件
        document.querySelector('.submit-btn').addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.querySelector('input[type="email"]').value;
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            
            if (!email) {
                alert('请输入邮箱地址');
                return;
            }

            // TODO: 这里添加下单逻辑
            console.log('提交订单:', {
                email,
                paymentMethod
            });
        });
    }
} 