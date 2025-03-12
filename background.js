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
        showNotification('تنبيه', 'هذه الصورة محفوظة مسبقاً!');
      } else {
        images.push({ id: Date.now(), url: imageUrl });
        chrome.storage.local.set({ images }, () => {
          showNotification('تم الحفظ', 'تم حفظ الصورة بنجاح');
        });
      }
    });
  }
});

// إضافة معالج للرسائل
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showTestNotification') {
    showNotification('إشعار تجريبي', 
      request.type === 'browser' ? 
      'هذا إشعار تجريبي داخل المتصفح' : 
      'هذا إشعار تجريبي في نظام التشغيل'
    );
  }
});

function showNotification(title, message) {
  chrome.storage.sync.get(['notifications', 'notificationType'], function(result) {
    if (!result.notifications) return;

    const notificationType = result.notificationType || 'browser';
    
    if (notificationType === 'system') {
      // إشعارات النظام
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: title,
        message: message,
        requireInteraction: true
      });
    } else {
      // إشعارات المتصفح
      chrome.action.setBadgeText({ text: "●" });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 3000);
    }
  });
}

// استمع للتغييرات في الإعدادات
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.notifications) {
    const notificationsEnabled = changes.notifications.newValue;
    if (!notificationsEnabled) {
      // إلغاء جميع الإشعارات النشطة عند تعطيل الإشعارات
      chrome.notifications.getAll((notifications) => {
        for (let id in notifications) {
          chrome.notifications.clear(id);
        }
      });
    }
  }
});