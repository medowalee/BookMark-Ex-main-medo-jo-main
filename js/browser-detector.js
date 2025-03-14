function loadBrowserSpecificCSS() {
    const userAgent = navigator.userAgent.toLowerCase();
    let cssFile = 'chrome.css'; // القيمة الافتراضية
    
    // التحقق من Arc أولاً لأنه قد يحتوي على سلاسل Chrome
    if (userAgent.includes('arc/') || 
        (window.chrome && navigator.vendor === 'Arc') || 
        document.documentElement.style.hasOwnProperty('--arc-palette-background')) {
        cssFile = 'arc.css';
    } else if (userAgent.includes('edg/')) {
        cssFile = 'Microsoft_Edge.css';
    } else if (userAgent.includes('brave')) {
        cssFile = 'brave.css';
    }
    
    console.log('Detected browser CSS:', cssFile); // للتأكد من عمل الكشف بشكل صحيح
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/${cssFile}`;
    document.head.appendChild(link);
}

// انتظار تحميل DOM ثم تنفيذ الكشف
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBrowserSpecificCSS);
} else {
    loadBrowserSpecificCSS();
}
