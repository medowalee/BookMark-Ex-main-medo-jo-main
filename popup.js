let isSelectMode = false;
const selectedImages = new Set();

// إضافة مستمع للرسائل في بداية الملف
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateImages') {
    loadImages();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadImages();

  document.getElementById('headerSelectBtn').addEventListener('click', toggleSelectMode);
  document.getElementById('selectAllBtn').addEventListener('click', () => {
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
  });

  document.getElementById('downloadSelectedBtn').addEventListener('click', downloadSelected);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
  document.getElementById('cancelSelectBtn').addEventListener('click', toggleSelectMode);
});

function loadImages() {
  chrome.storage.local.get({ images: [] }, (data) => {
    const images = data.images;
    const container = document.getElementById('container');
    container.innerHTML = "";

    if (images.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3 style="text-align: center; color: #666;">لا توجد صور محفوظة</h3>
        </div>
      `;
      return;
    }

    container.className = 'container';

    images.forEach((img) => {
      // إنشاء العنصر الحاوي لكل صورة
      const item = document.createElement('div');
      item.className = "image-item";
      item.draggable = true;
      item.dataset.id = img.id;

      // Show loading for new images only
      if (img.isNew) {
        imageLoader.showLoading(img.id);
        delete img.isNew;
      }

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
      imageEl.addEventListener('click', (e) => {
        if (isSelectMode) {
          // منع فتح الصورة في وضع التحديد
          e.preventDefault();
          const checkbox = e.target.closest('.image-item').querySelector('.select-checkbox');
          checkbox.classList.toggle('checked');
          if (checkbox.classList.contains('checked')) {
            selectedImages.add(img.id);
          } else {
            selectedImages.delete(img.id);
          }
          updateToolbar();
        } else {
          // التحقق من نوع URL الصورة قبل فتحها
          e.preventDefault();
          if (img.url.startsWith('data:')) {
            // إذا كانت الصورة من نوع data URL، نقوم بفتحها في نافذة منبثقة
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
              <html>
                <head><title>معاينة الصورة</title></head>
                <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                  <img src="${img.url}" style="max-width:100%; max-height:100vh; object-fit:contain;">
                </body>
              </html>
            `);
          } else {
            // إذا كانت الصورة من URL عادي، نفتحها مباشرة
            window.open(img.url, '_blank');
          }
        }
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
  });
}

function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  document.body.classList.toggle('select-mode', isSelectMode);
  const toolbar = document.getElementById('toolbar');
  const headerContent = document.querySelector('.header-content');
  
  if (isSelectMode) {
    toolbar.classList.add('active');
    headerContent.style.animation = 'fadeOut 0.3s ease-out forwards';
  } else {
    toolbar.classList.remove('active');
    headerContent.style.animation = 'fadeIn 0.3s ease-out forwards';
    headerContent.style.display = 'flex';
  }
  
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
    imageLoader.showLoading(id);
    const response = await fetch(url);
    const blob = await response.blob();

    // إنشاء شريط التقدم فقط إذا كان لدينا عنصر الصورة
    let downloadProgress = null;
    let progressFill = null;
    let status = null;

    if (item) {
      const elements = createDownloadProgress(item);
      downloadProgress = elements.downloadProgress;
      progressFill = elements.progressFill;
      status = elements.status;
      item.appendChild(downloadProgress);
      downloadProgress.classList.add('active');
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        const blobUrl = URL.createObjectURL(pngBlob);

        chrome.downloads.download({
          url: blobUrl,
          filename: `image_${id}.png`,
          // saveAs option removed to enable direct download
        }, () => {
          URL.revokeObjectURL(blobUrl);
          if (downloadProgress) {
            downloadProgress.classList.remove('active');
          }
        });
      }, 'image/png');
    };

    img.src = URL.createObjectURL(blob);

  } catch (error) {
    console.error('Error:', error);
    if (item) {
      const downloadProgress = item.querySelector('.download-progress');
      if (downloadProgress) {
        downloadProgress.classList.remove('active');
      }
    }
  } finally {
    imageLoader.hideLoading(id);
  }
}

function deleteImage(id) {
  chrome.storage.local.get({ images: [] }, (data) => {
    const imageItem = document.querySelector(`.image-item[data-id="${id}"]`);
    if (imageItem) {
      imageItem.style.transformOrigin = 'center center';
      imageItem.classList.add('removing');
      
      // انتظار انتهاء الرسوم المتحركة قبل إزالة العنصر
      imageItem.addEventListener('animationend', () => {
        const updatedImages = data.images.filter(img => img.id !== id);
        chrome.storage.local.set({ images: updatedImages }, () => {
          loadImages();
        });
      }, { once: true });
    }
  });
}
