chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addBookmark",
    title: "إضافة بوك مارك الصورة",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addBookmark") {
    const imageUrl = info.srcUrl;
    
    chrome.storage.local.get({ images: [] }, (result) => {
      const images = result.images;
      const isDuplicate = images.some(img => img.url === imageUrl);
      
      if (isDuplicate) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: 'تنبيه',
          message: 'هذه الصورة محفوظة مسبقاً!'
        });
      } else {
        images.push({ id: Date.now(), url: imageUrl });
        chrome.storage.local.set({ images }, () => {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon128.png',
            title: 'تم الحفظ',
            message: 'تم حفظ الصورة بنجاح'
          });
        });
      }
    });
  }
});

// إضافة مراقب للتغييرات في التخزين
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.images) {
    // إرسال رسالة إلى popup.js لتحديث الصور
    chrome.runtime.sendMessage({ action: 'updateImages' });
  }
});