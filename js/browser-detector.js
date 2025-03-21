function loadBrowserSpecificCSS() {
    let cssFile = 'chrome.css'; // القيمة الافتراضية

    // تحسين الكشف عن متصفح Arc
    const isArc = () => {
        // طرق متعددة للكشف عن Arc
        return window.navigator.userAgent.includes('Arc') ||
               window.chrome?.arc !== undefined ||
               document.documentElement.style.hasOwnProperty('--arc-palette-foregroundPrimary') ||
               // إضافة خاصية CSS خاصة بـ Arc
               getComputedStyle(document.documentElement)
                   .getPropertyValue('--arc-palette-maxWidth') !== '';
    };

    if (isArc()) {
        cssFile = 'arc.css';
    } else if (navigator.userAgent.toLowerCase().includes('edg/')) {
        cssFile = 'Microsoft_Edge.css';
    } else if (navigator.userAgent.toLowerCase().includes('brave')) {
        cssFile = 'brave.css';
    }

    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/${cssFile}`;
    document.head.appendChild(link);
    // console.log('Detected browser CSS:', link);
}

// تنفيذ الكشف بعد تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBrowserSpecificCSS);
} else {
    loadBrowserSpecificCSS();
}
