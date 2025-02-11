// 添加获取商品列表的函数
async function loadProducts() {
  try {
    console.log('开始请求商品数据...');
    const response = await fetch('/api/products');
    console.log('收到响应:', response);
    
    const result = await response.json();
    console.log('解析后的数据:', result);
    
    if (result.success && result.data) {
      const productGrid = document.querySelector('.product-grid');
      if (!productGrid) {
        console.error('找不到 product-grid 元素');
        return;
      }
      
      console.log(`准备渲染 ${result.data.length} 个商品`);
      productGrid.innerHTML = '';
      
      result.data.forEach((product, index) => {
        console.log(`渲染第 ${index + 1} 个商品:`, product);
        const productCard = `
          <div class="product-card">
            <div class="share-label">共享账号</div>
            <div class="product-icon">
              <img src="${product.main_image || '/path/to/default-image.png'}" 
                   alt="${product.product_name}"
                   onerror="this.src='/path/to/default-image.png'">
            </div>
            <h3>${product.product_name}</h3>
            <div class="product-subtitle">ChatGPT账号</div>
            <div class="product-type">ChatGPT 4.0</div>
            <div class="product-price">¥${Number(product.price).toFixed(2)}</div>
            <div class="product-stock">库存: ${product.stock}</div>
            <a href="/product-detail.html?id=${product.id}" class="buy-now-btn">下单</a>
          </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', productCard);
      });
    } else {
      console.error('获取商品数据失败:', result.error);
    }
  } catch (error) {
    console.error('加载商品列表失败:', error);
  }
}

// 在页面加载完成后获取商品列表
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  // ... 其他初始化代码 ...
}); 