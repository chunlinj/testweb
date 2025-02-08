// 添加更详细的 Google Analytics 事件跟踪
gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
}); 