let isSelectMode = false;
const selectedImages = new Set();

document.addEventListener('DOMContentLoaded', () => {
  // التحقق من نوع الصفحة (عادية أو حفظ)
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');

  if (action === 'save') {
    // صفحة حفظ الصورة
    handleSaveImagePage(urlParams);
  } else {
    // صفحة العرض العادية
    initializeMainPage();
  }
});

function handleSaveImagePage(params) {
  const imageUrl = params.get('imageUrl');
  const imageId = params.get('imageId');
  
  // التأكد من وجود عناصر صفحة الحفظ
  const previewImage = document.getElementById('previewImage');
  const folderContainer = document.getElementById('folderContainer');
  const saveToRoot = document.getElementById('saveToRoot');
  
  if (previewImage) previewImage.src = imageUrl;
  
  if (saveToRoot) {
    saveToRoot.addEventListener('click', () => {
      saveImageToRoot(imageUrl, imageId);
    });
  }

  // تحميل المجلدات
  loadFoldersForSelection(folderContainer);
}

function initializeMainPage() {
  loadImages();

  const elements = {
    headerSelectBtn: document.getElementById('headerSelectBtn'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    downloadSelectedBtn: document.getElementById('downloadSelectedBtn'),
    deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
    cancelSelectBtn: document.getElementById('cancelSelectBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    newFolderBtn: document.getElementById('newFolderBtn'),
    backBtn: document.getElementById('backBtn')
  };

  // إضافة معالجات الأحداث فقط للعناصر الموجودة
  if (elements.headerSelectBtn) {
    elements.headerSelectBtn.addEventListener('click', toggleSelectMode);
  }

  if (elements.selectAllBtn) {
    elements.selectAllBtn.addEventListener('click', handleSelectAll);
  }

  if (elements.downloadSelectedBtn) {
    elements.downloadSelectedBtn.addEventListener('click', downloadSelected);
  }

  if (elements.deleteSelectedBtn) {
    elements.deleteSelectedBtn.addEventListener('click', deleteSelected);
  }

  if (elements.cancelSelectBtn) {
    elements.cancelSelectBtn.addEventListener('click', toggleSelectMode);
  }

  if (elements.settingsBtn) {
    elements.settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  if (elements.newFolderBtn) {
    elements.newFolderBtn.addEventListener('click', showNewFolderModal);
  }

  if (elements.backBtn) {
    elements.backBtn.addEventListener('click', navigateBack);
  }
}

function handleSelectAll() {
  const checkboxes = document.querySelectorAll('.select-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.classList.contains('checked'));

  checkboxes.forEach(checkbox => {
    checkbox.classList.toggle('checked', !allChecked);
    const imgId = parseInt(checkbox.closest('.image-item').dataset.id);
    if (!allChecked) {
      selectedImages.add(imgId);
    } else {
      selectedImages.delete(imgId);
    }
  });

  updateToolbar();
}

function saveImageToRoot(imageUrl, imageId) {
  chrome.storage.local.get({ images: [] }, (result) => {
    const images = result.images;
    const newImage = { id: parseInt(imageId), url: imageUrl };
    
    if (!images.some(img => img.url === imageUrl)) {
      images.push(newImage);
      chrome.storage.local.set({ images }, () => {
        showNotification('تم الحفظ', 'تم حفظ الصورة في المجلد الرئيسي');
        window.close();
      });
    } else {
      showNotification('تنبيه', 'الصورة موجودة مسبقاً');
      window.close();
    }
  });
}

function loadImages() {
  const container = document.getElementById('container');
  // إضافة حالة التحميل
  container.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
    </div>
  `;

  chrome.storage.local.get({ images: [] }, (data) => {
    const images = data.images;
    const headerSelectBtn = document.getElementById('headerSelectBtn');
    
    headerSelectBtn.style.display = images.length > 0 ? 'flex' : 'none';
    
    // تأخير صغير لإظهار حالة التحميل
    setTimeout(() => {
      container.innerHTML = "";

      if (images.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>لا توجد صور محفوظة</h3>
          </div>
        `;
        return;
      }

      images.forEach((img) => {
        // إنشاء العنصر الحاوي لكل صورة
        const item = document.createElement('div');
        item.className = "image-item";
        item.draggable = true;
        item.dataset.id = img.id;

        // إضافة معالجات أحداث السحب
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);

        // إضافة معالج الضغطة المطولة للموبايل
        item.addEventListener('touchstart', handleTouchStart);
        item.addEventListener('touchmove', handleTouchMove);
        item.addEventListener('touchend', handleTouchEnd);

        // إنشاء عنصر الصورة
        const imageEl = document.createElement('img');
        imageEl.src = img.url;
        imageEl.title = "اضغط لعرض الصورة بالحجم الكامل";
        imageEl.addEventListener('click', () => {
          // فتح الصورة في تبويب جديد بالحجم الكامل
          window.open(img.url, '_blank');
        });

        // إنشاء حاوية لأزرار التحميل والحذف
        const actionsDiv = document.createElement('div');
        actionsDiv.className = "actions regular-actions";

        // زر التحميل والحذف فقط (بدون زر التحديد)
        const downloadBtn = document.createElement('button');
        downloadBtn.className = "action-btn";
        downloadBtn.innerHTML = '<i class="ri-download-2-line"></i>';
        downloadBtn.title = "تحميل";
        downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // منع تفعيل حدث الضغط على الصورة
          downloadImage(img.url, img.id, item);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "action-btn";
        deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
        deleteBtn.title = "حذف";
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteImage(img.id);
        });

        actionsDiv.appendChild(downloadBtn);
        actionsDiv.appendChild(deleteBtn);

        // تحسين مربع التحديد
        const checkbox = document.createElement('div');
        checkbox.className = 'select-checkbox';
        checkbox.innerHTML = '<button id="headerSelectBtn-8" class="header-btn"></button>';
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          checkbox.classList.toggle('checked');
          if (checkbox.classList.contains('checked')) {
            selectedImages.add(img.id);
          } else {
            selectedImages.delete(img.id);
          }
          updateToolbar();
        });

        item.appendChild(checkbox);
        item.appendChild(imageEl);
        item.appendChild(actionsDiv);
        container.appendChild(item);
      });
    }, 500); // تأخير نصف ثانية لإظهار حالة التحميل
  });
}

function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  document.body.classList.toggle('select-mode', isSelectMode);
  document.getElementById('toolbar').classList.toggle('active', isSelectMode);
  selectedImages.clear();
  updateToolbar();
}

function updateToolbar() {
  const count = selectedImages.size;
  const downloadBtn = document.getElementById('downloadSelectedBtn');
  const deleteBtn = document.getElementById('deleteSelectedBtn');

  downloadBtn.textContent = `تحميل (${count})`;
  deleteBtn.textContent = `حذف (${count})`;
}

function downloadSelected() {
  chrome.storage.local.get({ images: [] }, (data) => {
    const selectedItems = data.images.filter(img => selectedImages.has(img.id));
    // حذف شريط التقدم للتحميلات المتعددة
    selectedItems.forEach(img => downloadImage(img.url, img.id, null));
    toggleSelectMode();
  });
}

function deleteSelected() {
  chrome.storage.local.get({ images: [] }, (data) => {
    const updatedImages = data.images.filter(img => !selectedImages.has(img.id));
    chrome.storage.local.set({ images: updatedImages }, () => {
      toggleSelectMode();
      loadImages();
    });
  });
}

// وظائف السحب والإفلات
let draggedItem = null;
let initialX = 0;
let initialY = 0;

function handleDragStart(e) {
  draggedItem = this;
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}

function handleDragEnd(e) {
  draggedItem = null;
  this.classList.remove('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  if (this !== draggedItem) {
    const items = Array.from(document.querySelectorAll('.image-item'));
    const fromIndex = items.indexOf(draggedItem);
    const toIndex = items.indexOf(this);

    // تحديث الترتيب في المخزن
    chrome.storage.local.get({ images: [] }, (data) => {
      const images = data.images;
      const [movedItem] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, movedItem);
      chrome.storage.local.set({ images }, () => {
        loadImages();
      });
    });
  }
}

// وظائف اللمس للموبايل
function handleTouchStart(e) {
  if (e.touches.length === 1) {
    initialX = e.touches[0].clientX;
    initialY = e.touches[0].clientY;
    this.classList.add('dragging');
  }
}

function handleTouchMove(e) {
  if (e.touches.length === 1) {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - initialX;
    const deltaY = touch.clientY - initialY;

    this.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }
}

function handleTouchEnd(e) {
  this.classList.remove('dragging');
  this.style.transform = '';
  // هنا يمكنك إضافة منطق إعادة الترتيب
}

// تحديث وظيفة الإشعارات لاستخدام إشعارات المتصفح الأصلية
function showNotification(title, message) {
  // استخدام alert بدلاً من الإشعارات
  alert(`${title}: ${message}`);
}

function createDownloadProgress(item) {
  const downloadProgress = document.createElement('div');
  downloadProgress.className = 'download-progress';

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';

  const status = document.createElement('span');
  status.className = 'download-status';

  progressBar.appendChild(progressFill);
  downloadProgress.appendChild(progressBar);
  downloadProgress.appendChild(status);

  return { downloadProgress, progressFill, status };
}

async function downloadImage(url, id, item = null) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // استرجاع إعدادات التنسيق
    chrome.storage.sync.get({
        useCustomFormat: false,
        defaultFormat: 'original',
        keepGif: true
    }, async function(result) {
        let downloadBlob = blob;
        let fileExtension = 'png';
        
        // تحديد نوع الملف الأصلي
        const fileType = blob.type.split('/')[1];
        const isGif = fileType.toLowerCase() === 'gif';
        
        // التحقق من إعدادات التنسيق
        if (!result.useCustomFormat || (isGif && result.keepGif)) {
            // استخدام الصيغة الأصلية
            downloadBlob = blob;
            fileExtension = fileType;
        } else {
            // تحويل الصورة حسب التنسيق المختار
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            await new Promise((resolve) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const format = result.defaultFormat === 'original' ? 'png' : result.defaultFormat;
                    canvas.toBlob((convertedBlob) => {
                        downloadBlob = convertedBlob;
                        fileExtension = format;
                        resolve();
                    }, `image/${format}`);
                };
                img.src = URL.createObjectURL(blob);
            });
        }

        // تنزيل الصورة
        const blobUrl = URL.createObjectURL(downloadBlob);
        chrome.downloads.download({
            url: blobUrl,
            filename: `image_${id}.${fileExtension}`,
        }, () => {
            URL.revokeObjectURL(blobUrl);
            if (item) {
                const downloadProgress = item.querySelector('.download-progress');
                if (downloadProgress) {
                    downloadProgress.classList.remove('active');
                }
            }
        });
    });
  } catch (error) {
    console.error('Error:', error);
    if (item) {
      const downloadProgress = item.querySelector('.download-progress');
      if (downloadProgress) {
        downloadProgress.classList.remove('active');
      }
    }
  }
}

function deleteImage(id) {
  chrome.storage.local.get({ images: [] }, (data) => {
    const updatedImages = data.images.filter(img => img.id !== id);
    chrome.storage.local.set({ images: updatedImages }, () => {
      // تحديث الصورة المحددة فقط بدلاً من إعادة تحميل كل الصور
      const imageElement = document.querySelector(`[data-id="${id}"]`);
      if (imageElement) {
        imageElement.remove();
      }
      
      // تحديث زر التحديد إذا لم يتبق صور
      if (updatedImages.length === 0) {
        document.getElementById('headerSelectBtn').style.display = 'none';
        document.getElementById('container').innerHTML = `
          <div class="empty-state">
            <h3>لا توجد صور محفوظة</h3>
          </div>
        `;
      }
    });
  });
}

let currentFolderId = null;
let folderHistory = [];

function showNewFolderModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="new-folder-modal">
            <div class="modal-title">مجلد جديد</div>
            <input type="text" class="modal-input" placeholder="اسم المجلد">
            <div class="modal-actions">
                <button class="toolbar-btn cancel">إلغاء</button>
                <button class="toolbar-btn">إنشاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const overlay = modal.querySelector('.modal-overlay');
    const cancelBtn = modal.querySelector('.cancel');
    const createBtn = modal.querySelector('.toolbar-btn:not(.cancel)');
    const input = modal.querySelector('.modal-input');

    overlay.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());
    createBtn.addEventListener('click', () => {
        const folderName = input.value.trim();
        if (folderName) {
            createFolder(folderName);
            modal.remove();
        }
    });
}

function createFolder(name) {
    chrome.storage.local.get({ folders: [] }, (result) => {
        const newFolder = {
            id: Date.now(),
            name: name,
            parentId: currentFolderId,
            images: []
        };
        const folders = result.folders;
        folders.push(newFolder);
        chrome.storage.local.set({ folders }, () => {
            loadContent();
        });
    });
}

function loadContent() {
    const container = document.getElementById('container');
    container.innerHTML = '';

    chrome.storage.local.get({ folders: [], images: [] }, (result) => {
        const currentFolders = result.folders.filter(f => f.parentId === currentFolderId);
        const currentImages = currentFolderId ? 
            result.folders.find(f => f.id === currentFolderId)?.images || [] :
            result.images;

        // عرض المجلدات
        currentFolders.forEach(folder => {
            const folderElement = createFolderElement(folder);
            container.appendChild(folderElement);
        });

        // عرض الصور
        currentImages.forEach(img => {
            const imageElement = createImageElement(img);
            container.appendChild(imageElement);
        });
    });
}

function createFolderElement(folder) {
    const element = document.createElement('div');
    element.className = 'folder-item';
    element.innerHTML = `
        <div class="folder-content">
            <div class="folder-icon">
                <i class="ri-folder-fill"></i>
            </div>
            <div class="folder-info">
                <div class="folder-name">${folder.name}</div>
                <div class="folder-count">${folder.images.length} صور</div>
            </div>
        </div>
    `;

    element.addEventListener('click', () => {
        navigateToFolder(folder.id);
    });

    return element;
}

function navigateToFolder(folderId) {
    folderHistory.push(currentFolderId);
    currentFolderId = folderId;
    document.getElementById('backBtn').disabled = false;
    updateCurrentFolder(folderId);
    loadContent();
}

function navigateBack() {
    if (folderHistory.length > 0) {
        currentFolderId = folderHistory.pop();
        document.getElementById('backBtn').disabled = folderHistory.length === 0;
        updateCurrentFolder(currentFolderId);
        loadContent();
    }
}

function updateCurrentFolder(folderId) {
    const folderNameElement = document.querySelector('.current-folder');
    if (!folderId) {
        folderNameElement.textContent = 'الرئيسية';
        return;
    }

    chrome.storage.local.get({ folders: [] }, (result) => {
        const folder = result.folders.find(f => f.id === folderId);
        if (folder) {
            folderNameElement.textContent = folder.name;
        }
    });
}

function createImageElement(img) {
    const item = document.createElement('div');
    item.className = "image-item";
    item.draggable = true;
    item.dataset.id = img.id;

    const imageEl = document.createElement('img');
    imageEl.src = img.url;
    imageEl.title = "اضغط للخيارات";
    
    // تعديل معالج النقر على الصورة
    imageEl.addEventListener('click', (e) => {
        e.stopPropagation();
        showImageOptions(img, e.target);
    });

    // إنشاء حاوية لأزرار التحميل والحذف
    const actionsDiv = document.createElement('div');
    actionsDiv.className = "actions regular-actions";

    // زر التحميل والحذف فقط (بدون زر التحديد)
    const downloadBtn = document.createElement('button');
    downloadBtn.className = "action-btn";
    downloadBtn.innerHTML = '<i class="ri-download-2-line"></i>';
    downloadBtn.title = "تحميل";
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // منع تفعيل حدث الضغط على الصورة
      downloadImage(img.url, img.id, item);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = "action-btn";
    deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
    deleteBtn.title = "حذف";
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteImage(img.id);
    });

    actionsDiv.appendChild(downloadBtn);
    actionsDiv.appendChild(deleteBtn);

    // تحسين مربع التحديد
    const checkbox = document.createElement('div');
    checkbox.className = 'select-checkbox';
    checkbox.innerHTML = '<button id="headerSelectBtn-8" class="header-btn"></button>';
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      checkbox.classList.toggle('checked');
      if (checkbox.classList.contains('checked')) {
        selectedImages.add(img.id);
      } else {
        selectedImages.delete(img.id);
      }
      updateToolbar();
    });

    item.appendChild(checkbox);
    item.appendChild(imageEl);
    item.appendChild(actionsDiv);
    return item;
}

// إضافة دالة لعرض خيارات الصورة
function showImageOptions(img, element) {
    chrome.storage.local.get({ folders: [] }, (result) => {
        const folders = result.folders.filter(f => f.parentId === currentFolderId);
        
        // إزالة أي قوائم منبثقة سابقة
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        // إضافة خيار فتح الصورة
        const openOption = document.createElement('div');
        openOption.className = 'menu-item';
        openOption.innerHTML = '<i class="ri-external-link-line"></i> فتح الصورة';
        openOption.addEventListener('click', () => {
            window.open(img.url, '_blank');
            menu.remove();
        });
        menu.appendChild(openOption);

        // إضافة قسم المجلدات إذا وجدت
        if (folders.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'menu-separator';
            menu.appendChild(separator);

            const foldersTitle = document.createElement('div');
            foldersTitle.className = 'menu-title';
            foldersTitle.textContent = 'إضافة إلى مجلد';
            menu.appendChild(foldersTitle);

            folders.forEach(folder => {
                const folderOption = document.createElement('div');
                folderOption.className = 'menu-item';
                folderOption.innerHTML = `<i class="ri-folder-line"></i> ${folder.name}`;
                folderOption.addEventListener('click', () => {
                    addImageToFolder(img, folder.id);
                    menu.remove();
                });
                menu.appendChild(folderOption);
            });
        }

        // تحديد موقع القائمة
        const rect = element.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;

        document.body.appendChild(menu);

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== element) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    });
}

// إضافة دالة لإضافة الصورة إلى مجلد
function addImageToFolder(img, folderId) {
    chrome.storage.local.get({ folders: [] }, (result) => {
        const folders = result.folders;
        const folderIndex = folders.findIndex(f => f.id === folderId);
        
        if (folderIndex !== -1) {
            if (!folders[folderIndex].images) {
                folders[folderIndex].images = [];
            }
            
            // التحقق من عدم وجود الصورة مسبقاً
            if (!folders[folderIndex].images.some(i => i.id === img.id)) {
                folders[folderIndex].images.push(img);
                chrome.storage.local.set({ folders }, () => {
                    showNotification('تم الإضافة', 'تمت إضافة الصورة إلى المجلد بنجاح');
                });
            }
        }
    });
}

function handleImageClick(img, element) {
    chrome.storage.local.get({ folders: [] }, (result) => {
        const folders = result.folders.filter(f => f.parentId === currentFolderId);
        
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        
        contextMenu.innerHTML = `
            <div class="menu-item" data-action="open">
                <i class="ri-external-link-line"></i> فتح الصورة
            </div>
            ${folders.length > 0 ? `
                <div class="menu-separator"></div>
                <div class="menu-header">إضافة إلى مجلد:</div>
                ${folders.map(folder => `
                    <div class="menu-item" data-folder-id="${folder.id}">
                        <i class="ri-folder-line"></i> ${folder.name}
                    </div>
                `).join('')}
            ` : ''}
        `;

        // إضافة معالجات الأحداث
        contextMenu.querySelector('[data-action="open"]').addEventListener('click', () => {
            window.open(img.url, '_blank');
            contextMenu.remove();
        });

        folders.forEach(folder => {
            const item = contextMenu.querySelector(`[data-folder-id="${folder.id}"]`);
            if (item) {
                item.addEventListener('click', () => {
                    addImageToFolder(img, folder.id);
                    contextMenu.remove();
                });
            }
        });

        // تحديد موقع القائمة
        const rect = element.getBoundingClientRect();
        contextMenu.style.position = 'fixed';
        contextMenu.style.top = rect.bottom + 5 + 'px';
        contextMenu.style.left = rect.left + 'px';

        // إزالة أي قوائم سابقة
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        
        document.body.appendChild(contextMenu);

        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function closeMenu(e) {
            if (!contextMenu.contains(e.target) && e.target !== element) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    });
}

function addImageToFolder(img, folderId) {
    chrome.storage.local.get({ folders: [] }, (result) => {
        const folders = result.folders;
        const folder = folders.find(f => f.id === folderId);
        
        if (folder) {
            if (!folder.images) folder.images = [];
            if (!folder.images.some(i => i.id === img.id)) {
                folder.images.push(img);
                chrome.storage.local.set({ folders }, () => {
                    showNotification('تم بنجاح', 'تم إضافة الصورة إلى المجلد');
                });
            }
        }
    });
}
