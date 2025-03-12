document.addEventListener('DOMContentLoaded', () => {
    const notificationsCheckbox = document.getElementById('notifications');
    const notificationOptions = document.getElementById('notification-options');
    const browserNotification = document.getElementById('browserNotification');
    const systemNotification = document.getElementById('systemNotification');

    // استرجاع الإعدادات المحفوظة
    chrome.storage.sync.get(['notifications', 'notificationType'], (result) => {
        notificationsCheckbox.checked = result.notifications || false;
        notificationOptions.style.display = result.notifications ? 'block' : 'none';
        
        const type = result.notificationType || 'browser';
        if (type === 'browser') {
            browserNotification.checked = true;
        } else {
            systemNotification.checked = true;
        }
    });

    // معالجة تغيير حالة الإشعارات
    notificationsCheckbox.addEventListener('change', function() {
        const isEnabled = this.checked;
        notificationOptions.style.display = isEnabled ? 'block' : 'none';
        
        chrome.storage.sync.set({
            notifications: isEnabled
        });

        // إظهار إشعار تجريبي عند التفعيل
        if (isEnabled) {
            const type = document.querySelector('input[name="notificationType"]:checked').value;
            chrome.runtime.sendMessage({
                action: 'showTestNotification',
                type: type
            });
        }
    });

    // معالجة تغيير نوع الإشعارات
    document.querySelectorAll('input[name="notificationType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            chrome.storage.sync.set({
                notificationType: this.value
            });

            // إظهار إشعار تجريبي
            if (notificationsCheckbox.checked) {
                chrome.runtime.sendMessage({
                    action: 'showTestNotification',
                    type: this.value
                });
            }
        });
    });

    // إدارة اختصارات لوحة المفاتيح
    const shortcutInput = document.getElementById('shortcutInput');
    const shortcutText = document.getElementById('shortcutText');
    let isRecording = false;
    let currentKeys = [];

    // استرجاع الاختصار المحفوظ
    chrome.storage.sync.get(['autoSaveShortcut'], function(result) {
        if (result.autoSaveShortcut) {
            shortcutText.textContent = result.autoSaveShortcut;
        }
    });

    shortcutInput.addEventListener('click', () => {
        if (!isRecording) {
            startRecording();
        }
    });

    function startRecording() {
        isRecording = true;
        currentKeys = [];
        shortcutInput.classList.add('recording');
        shortcutText.textContent = 'اضغط المفاتيح المطلوبة...';
    }

    function stopRecording() {
        isRecording = false;
        shortcutInput.classList.remove('recording');
    }

    document.addEventListener('keydown', (e) => {
        if (isRecording) {
            e.preventDefault();
            
            // إضافة المفتاح إلى المصفوفة إذا لم يكن موجوداً
            const key = e.key.toUpperCase();
            if (!currentKeys.includes(key)) {
                currentKeys.push(key);
            }

            // تحديث النص
            shortcutText.textContent = currentKeys.join(' + ');

            // إنهاء التسجيل إذا تم الضغط على Enter
            if (e.key === 'Enter') {
                const shortcut = currentKeys.join('+');
                chrome.storage.sync.set({ autoSaveShortcut: shortcut });
                stopRecording();
            }

            // إلغاء التسجيل إذا تم الضغط على Escape
            if (e.key === 'Escape') {
                stopRecording();
                shortcutText.textContent = 'انقر لتعيين الاختصار';
            }
        }
    });
});

// Create template content
const templates = {
    general: `
        <div class="settings-container">
            <h2>إعدادات عامة</h2>
            <div class="setting-item">
                <div class="setting-title">حفظ تلقائي للصور</div>
                <div class="setting-description">حفظ الصور تلقائياً عند النسخ</div>
                <div class="setting-control">
                    <label class="switch">
                        <input type="checkbox" id="autoSave">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        </div>
    `,
    notifications: `
        <div class="settings-container">
            <h2>الإشعارات</h2>
            <div class="setting-item">
                <div class="setting-title">الإشعارات</div>
                <div class="setting-description">اختر نوع الإشعارات المفضل لديك</div>
                <div class="setting-control">
                    <label class="switch">
                        <input type="checkbox" id="notifications">
                        <span class="slider"></span>
                    </label>
                </div>
                <div id="notification-options" class="notification-options">
                    <div class="notification-type">
                        <input type="radio" id="browserNotification" name="notificationType" value="browser">
                        <label for="browserNotification">
                            <i class="ri-chrome-line"></i>
                            <div class="notification-type-title">إشعارات المتصفح</div>
                            <div class="notification-type-desc">تظهر داخل المتصفح فقط</div>
                        </label>
                    </div>
                    <div class="notification-type">
                        <input type="radio" id="systemNotification" name="notificationType" value="system">
                        <label for="systemNotification">
                            <i class="ri-computer-line"></i>
                            <div class="notification-type-title">إشعارات النظام</div>
                            <div class="notification-type-desc">تظهر في نظام التشغيل</div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `,
    downloads: `
        <div class="settings-container">
            <h2>التنزيلات</h2>
            <div class="setting-item">
                <div class="setting-title">تنسيق التحميل الافتراضي</div>
                <div class="setting-description">اختر تنسيق الصور عند التحميل</div>
                <div class="setting-control">
                    <select id="defaultFormat">
                        <option value="original">تنسيق أصلي</option>
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                    </select>
                </div>
            </div>
        </div>
    `
};

// Initialize pages
function initializePages() {
    Object.keys(templates).forEach(pageId => {
        const page = document.getElementById(`${pageId}-page`);
        if (page) {
            page.innerHTML = templates[pageId];
        }
    });
}

// إدارة التبديل بين صفحات الإعدادات
const pages = {
    'general': document.createElement('div'),
    'notifications': document.createElement('div'),
    'downloads': document.createElement('div')
};

// تهيئة محتوى الصفحات
pages.general.innerHTML = `
    <div class="settings-container fade-enter">
        <h2>إعدادات عامة</h2>
        <div class="setting-item">
            <div class="setting-title">حفظ تلقائي للصور</div>
            <div class="setting-description">حفظ الصور تلقائياً عند النسخ</div>
            <div class="setting-control">
                <label class="switch">
                    <input type="checkbox" id="autoSave">
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    </div>
`;

pages.notifications.innerHTML = `
    <div class="settings-container fade-enter">
        <h2>الإشعارات</h2>
        <div class="setting-item">
            <div class="setting-title">الإشعارات</div>
            <div class="setting-description">اختر نوع الإشعارات المفضل لديك</div>
            <div class="setting-control">
                <label class="switch">
                    <input type="checkbox" id="notifications">
                    <span class="slider"></span>
                </label>
            </div>
            <div id="notification-options" class="notification-options">
                <div class="notification-type">
                    <input type="radio" id="browserNotification" name="notificationType" value="browser">
                    <label for="browserNotification">
                        <i class="ri-chrome-line"></i>
                        <div class="notification-type-title">إشعارات المتصفح</div>
                        <div class="notification-type-desc">تظهر داخل المتصفح فقط</div>
                    </label>
                </div>
                <div class="notification-type">
                    <input type="radio" id="systemNotification" name="notificationType" value="system">
                    <label for="systemNotification">
                        <i class="ri-computer-line"></i>
                        <div class="notification-type-title">إشعارات النظام</div>
                        <div class="notification-type-desc">تظهر في نظام التشغيل</div>
                    </label>
                </div>
            </div>
        </div>
    </div>
`;

pages.downloads.innerHTML = `
    <div class="settings-container fade-enter">
        <h2>التنزيلات</h2>
        <div class="setting-item">
            <div class="setting-title">تنسيق التحميل الافتراضي</div>
            <div class="setting-description">اختر تنسيق الصور عند التحميل</div>
            <div class="setting-control">
                <select id="defaultFormat">
                    <option value="original">تنسيق أصلي</option>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                </select>
            </div>
        </div>
    </div>
`;

function showPage(pageId) {
    const settingsContent = document.querySelector('.settings-content');
    const currentPage = settingsContent.querySelector('.settings-container');
    
    if (currentPage) {
        currentPage.classList.add('fade-exit');
        setTimeout(() => {
            settingsContent.innerHTML = '';
            settingsContent.appendChild(pages[pageId]);
            const newPage = settingsContent.querySelector('.settings-container');
            newPage.classList.add('fade-enter');
        }, 300);
    } else {
        settingsContent.appendChild(pages[pageId]);
    }
}

document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        const pageId = this.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        showPage(pageId === 'إعدادات-عامة' ? 'general' : 
                pageId === 'الإشعارات' ? 'notifications' : 'downloads');
    });
});

// عرض الصفحة الافتراضية عند التحميل
showPage('general');
