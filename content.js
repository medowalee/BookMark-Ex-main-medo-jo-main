// // إضافة مستمع للرسائل في بداية الملف
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'updateImages') {
//     loadImages();
//   }
// });

// document.addEventListener('DOMContentLoaded', async () => {
//   loadImages();
//   // تعديل: إزالة initializeGroups لأننا نقوم بإدارة زر المجموعات مباشرة

//   // التحقق من وجود الأزرار قبل إضافة مستمعات الأحداث
//   const createGroupBtn = document.getElementById('createGroupBtn');
//   const headerSelectBtn = document.getElementById('headerSelectBtn');
//   const selectAllBtn = document.getElementById('selectAllBtn');
//   const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
//   const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
//   const cancelSelectBtn = document.getElementById('cancelSelectBtn');
//   const fullscreenBtn = document.getElementById('fullscreenBtn');
//   // إضافة زر المشاركة
//   const shareSelectedBtn = document.createElement('button');
//   shareSelectedBtn.className = 'toolbar-btn';
//   shareSelectedBtn.innerHTML = '<i class="ri-share-line"></i> مشاركة المحدد';
  
//   // إضافة الزر إلى مجموعة الأزرار
//   document.querySelector('.toolbar-group:last-child').insertBefore(
//     shareSelectedBtn,
//     deleteSelectedBtn
//   );

//   // إضافة مستمع الحدث للزر الجديد
//   shareSelectedBtn.addEventListener('click', shareSelected);

//   if (createGroupBtn) {
//     createGroupBtn.addEventListener('click', () => {
//       groupUI.showCreateGroupDialog();
//     });
//   }

//   if (headerSelectBtn) headerSelectBtn.addEventListener('click', toggleSelectMode);
//   if (selectAllBtn) {
//     selectAllBtn.addEventListener('click', () => {
//       const checkboxes = document.querySelectorAll('.select-checkbox');
//       const allChecked = Array.from(checkboxes).every(cb => cb.classList.contains('checked'));

//       checkboxes.forEach(checkbox => {
//         checkbox.classList.toggle('checked', !allChecked);
//         const imgId = parseInt(checkbox.closest('.image-item').dataset.id);
//         if (!allChecked) {
//           selectedImages.add(imgId);
//         } else {
//           selectedImages.delete(imgId);
//         }
//       });

//       updateToolbar();
//     });
//   }

//   if (downloadSelectedBtn) downloadSelectedBtn.addEventListener('click', downloadSelected);
//   if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelected);
//   if (cancelSelectBtn) cancelSelectBtn.addEventListener('click', toggleSelectMode);
//   if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

//   // تهيئة حالة الصور في المجموعات
//   await groupManager.initializeImageStates();
//   await groupManager.showAllImages();
// });

// function loadImages() {
//   chrome.storage.local.get({ images: [] }, async (data) => {
//     const images = data.images;
//     const container = document.getElementById('container');
//     container.innerHTML = "";

//     // إضافة قائمة المجموعات في بداية تحميل الصور
//     const groups = await groupManager.getAllGroups();
//     const groupsList = groupUI.renderGroups(groups);

//     if (images.length === 0 && groups.length === 0) {
//       container.innerHTML = `
//         <div class="empty-state">
//           <h3 style="text-align: center; color: #666;">لا توجد صور محفوظة</h3>
//         </div>
//       `;
//       return;
//     }

//     container.className = 'container';

//     images.forEach((img) => {
//       // إنشاء العنصر الحاوي لكل صورة
//       const item = document.createElement('div');
//       item.className = "image-item";
//       item.draggable = true;
//       item.dataset.id = img.id;

//       // Show loading for new images only
//       if (img.isNew) {
//         imageLoader.showLoading(img.id);
//         delete img.isNew;
//       }

//       // إضافة معالجات أحداث السحب
//       item.addEventListener('dragstart', handleDragStart);
//       item.addEventListener('dragend', handleDragEnd);
//       item.addEventListener('dragover', handleDragOver);
//       item.addEventListener('drop', handleDrop);

//       // Add this to the image item creation:
//       item.addEventListener('dragstart', (e) => {
//         groupUI.draggedImage = item;
//         e.dataTransfer.setData('text/plain', 'image');
//       });

//       item.addEventListener('dragend', () => {
//         groupUI.draggedImage = null;
//       });

//       // إضافة معالج الضغطة المطولة للموبايل
//       item.addEventListener('touchstart', handleTouchStart);
//       item.addEventListener('touchmove', handleTouchMove);
//       item.addEventListener('touchend', handleTouchEnd);

//       // إنشاء عنصر الصورة
//       const imageEl = document.createElement('img');
//       imageEl.src = img.url;
//       imageEl.title = "اضغط لعرض الصورة بالحجم الكامل";
//       imageEl.addEventListener('click', (e) => {
//         if (isSelectMode) {
//           // منع فتح الصورة في وضع التحديد
//           e.preventDefault();
//           const checkbox = e.target.closest('.image-item').querySelector('.select-checkbox');
//           checkbox.classList.toggle('checked');
//           if (checkbox.classList.contains('checked')) {
//             selectedImages.add(img.id);
//           } else {
//             selectedImages.delete(img.id);
//           }
//           updateToolbar();
//         } else {
//           // التحقق من نوع URL الصورة قبل فتحها
//           e.preventDefault();
//           if (img.url.startsWith('data:')) {
//             // إذا كانت الصورة من نوع data URL، نقوم بفتحها في نافذة منبثقة
//             const newWindow = window.open('', '_blank');
//             newWindow.document.write(`
//               <html>
//                 <head><title>معاينة الصورة</title></head>
//                 <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
//                   <img src="${img.url}" style="max-width:100%; max-height:100vh; object-fit:contain;">
//                 </body>
//               </html>
//             `);
//           } else {
//             // إذا كانت الصورة من URL عادي، نفتحها مباشرة
//             window.open(img.url, '_blank');
//           }
//         }
//       });

//       // إنشاء حاوية لأزرار التحميل والحذف
//       const actionsDiv = document.createElement('div');
//       actionsDiv.className = "actions regular-actions";

//       // زر التحميل والحذف فقط (بدون زر التحديد)
//       const downloadBtn = document.createElement('button');
//       downloadBtn.className = "action-btn";
//       downloadBtn.innerHTML = '<i class="ri-download-2-line"></i>';
//       downloadBtn.title = "تحميل";
//       downloadBtn.addEventListener('click', (e) => {
//         e.stopPropagation(); // منع تفعيل حدث الضغط على الصورة
//         downloadImage(img.url, img.id, item);
//       });

//       const deleteBtn = document.createElement('button');
//       deleteBtn.className = "action-btn";
//       deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
//       deleteBtn.title = "حذف";
//       deleteBtn.addEventListener('click', (e) => {
//         e.stopPropagation();
//         deleteImage(img.id);
//       });

//       // إنشاء زر تكبير الشاشة
//       const fullscreenBtn = document.createElement('button');
//       fullscreenBtn.className = "action-btn";
//       fullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
//       fullscreenBtn.title = "تكبير الشاشة";
//       fullscreenBtn.addEventListener('click', (e) => {
//         e.stopPropagation();
//         toggleFullscreen(img.url, img.id);
//       });

//       actionsDiv.appendChild(downloadBtn);
//       actionsDiv.appendChild(deleteBtn);
//       actionsDiv.appendChild(fullscreenBtn);

//       // تحسين مربع التحديد
//       const checkbox = document.createElement('div');
//       checkbox.className = 'select-checkbox';
//       checkbox.innerHTML = '<button id="headerSelectBtn-8" class="header-btn"></button>';
//       checkbox.addEventListener('click', (e) => {
//         e.stopPropagation();
//         checkbox.classList.toggle('checked');
//         if (checkbox.classList.contains('checked')) {
//           selectedImages.add(img.id);
//         } else {
//           selectedImages.delete(img.id);
//         }
//         updateToolbar();
//       });

//       item.appendChild(checkbox);
//       item.appendChild(imageEl);
//       item.appendChild(actionsDiv);
//       container.appendChild(item);
//     });
//   });
// }

// function toggleSelectMode() {
//   isSelectMode = !isSelectMode;
//   document.body.classList.toggle('select-mode', isSelectMode);
//   const toolbar = document.getElementById('toolbar');
//   const headerContent = document.querySelector('.header-content');
  
//   if (isSelectMode) {
//     toolbar.classList.add('active');
//     headerContent.style.animation = 'fadeOut 0.3s ease-out forwards';
//   } else {
//     toolbar.classList.remove('active');
//     headerContent.style.animation = 'fadeIn 0.3s ease-out forwards';
//     headerContent.style.display = 'flex';
//   }
  
//   selectedImages.clear();
//   updateToolbar();
// }

// function updateToolbar() {
//   const count = selectedImages.size;
//   const downloadBtn = document.getElementById('downloadSelectedBtn');
//   const deleteBtn = document.getElementById('deleteSelectedBtn');

//   downloadBtn.textContent = `تحميل (${count})`;
//   deleteBtn.textContent = `حذف (${count})`;
// }

// function downloadSelected() {
//   chrome.storage.local.get({ images: [] }, (data) => {
//     const selectedItems = data.images.filter(img => selectedImages.has(img.id));
//     // حذف شريط التقدم للتحميلات المتعددة
//     selectedItems.forEach(img => downloadImage(img.url, img.id, null));
//     toggleSelectMode();
//   });
// }

// function deleteSelected() {
//   chrome.storage.local.get({ images: [] }, (data) => {
//     const updatedImages = data.images.filter(img => !selectedImages.has(img.id));
//     chrome.storage.local.set({ images: updatedImages }, () => {
//       toggleSelectMode();
//       loadImages();
//     });
//   });
// }

// // وظائف السحب والإفلات
// let draggedItem = null;
// let initialX = 0;
// let initialY = 0;

// function handleDragStart(e) {
//   draggedItem = this;
//   e.dataTransfer.effectAllowed = 'move';
//   this.classList.add('dragging');
// }

// function handleDragEnd(e) {
//   draggedItem = null;
//   this.classList.remove('dragging');
// }

// function handleDragOver(e) {
//   e.preventDefault();
//   e.dataTransfer.dropEffect = 'move';
// }

// function handleDrop(e) {
//   e.preventDefault();
//   if (this !== draggedItem) {
//     const items = Array.from(document.querySelectorAll('.image-item'));
//     const fromIndex = items.indexOf(draggedItem);
//     const toIndex = items.indexOf(this);

//     // تحديث الترتيب في المخزن
//     chrome.storage.local.get({ images: [] }, (data) => {
//       const images = data.images;
//       const [movedItem] = images.splice(fromIndex, 1);
//       images.splice(toIndex, 0, movedItem);
//       chrome.storage.local.set({ images }, () => {
//         loadImages();
//       });
//     });
//   }
// }

// // وظائف اللمس للموبايل
// function handleTouchStart(e) {
//   if (e.touches.length === 1) {
//     initialX = e.touches[0].clientX;
//     initialY = e.touches[0].clientY;
//     this.classList.add('dragging');
//   }
// }

// function handleTouchMove(e) {
//   if (e.touches.length === 1) {
//     e.preventDefault();
//     const touch = e.touches[0];
//     const deltaX = touch.clientX - initialX;
//     const deltaY = touch.clientY - initialY;

//     this.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
//   }
// }

// function handleTouchEnd(e) {
//   this.classList.remove('dragging');
//   this.style.transform = '';
//   // هنا يمكنك إضافة منطق إعادة الترتيب
// }

// // تحديث وظيفة الإشعارات لاستخدام إشعارات المتصفح الأصلية
// function showNotification(title, message) {
//   // استخدام alert بدلاً من الإشعارات
//   alert(`${title}: ${message}`);
// }

// function createDownloadProgress(item) {
//   const downloadProgress = document.createElement('div');
//   downloadProgress.className = 'download-progress';

//   const progressBar = document.createElement('div');
//   progressBar.className = 'progress-bar';

//   const progressFill = document.createElement('div');
//   progressFill.className = 'progress-fill';

//   const status = document.createElement('span');
//   status.className = 'download-status';

//   progressBar.appendChild(progressFill);
//   downloadProgress.appendChild(progressBar);
//   downloadProgress.appendChild(status);

//   return { downloadProgress, progressFill, status };
// }

// async function downloadImage(url, id, item = null) {
//   try {
//     imageLoader.showLoading(id);
//     const response = await fetch(url);
//     const blob = await response.blob();

//     // إنشاء شريط التقدم فقط إذا كان لدينا عنصر الصورة
//     let downloadProgress = null;
//     let progressFill = null;
//     let status = null;

//     if (item) {
//       const elements = createDownloadProgress(item);
//       downloadProgress = elements.downloadProgress;
//       progressFill = elements.progressFill;
//       status = elements.status;
//       item.appendChild(downloadProgress);
//       downloadProgress.classList.add('active');
//     }

//     const img = new Image();
//     img.crossOrigin = "anonymous";

//     img.onload = () => {
//       const canvas = document.createElement('canvas');
//       canvas.width = img.width;
//       canvas.height = img.height;

//       const ctx = canvas.getContext('2d');
//       ctx.drawImage(img, 0, 0);

//       canvas.toBlob((pngBlob) => {
//         const blobUrl = URL.createObjectURL(pngBlob);

//         chrome.downloads.download({
//           url: blobUrl,
//           filename: `image_${id}.png`,
//           // saveAs option removed to enable direct download
//         }, () => {
//           URL.revokeObjectURL(blobUrl);
//           if (downloadProgress) {
//             downloadProgress.classList.remove('active');
//           }
//         });
//       }, 'image/png');
//     };

//     img.src = URL.createObjectURL(blob);

//   } catch (error) {
//     console.error('Error:', error);
//     if (item) {
//       const downloadProgress = item.querySelector('.download-progress');
//       if (downloadProgress) {
//         downloadProgress.classList.remove('active');
//       }
//     }
//   } finally {
//     imageLoader.hideLoading(id);
//   }
// }

// function deleteImage(id) {
//   chrome.storage.local.get({ images: [] }, (data) => {
//     const imageItem = document.querySelector(`.image-item[data-id="${id}"]`);
//     if (imageItem) {
//       imageItem.style.transformOrigin = 'center center';
//       imageItem.classList.add('removing');
      
//       // انتظار انتهاء الرسوم المتحركة قبل إزالة العنصر
//       imageItem.addEventListener('animationend', () => {
//         const updatedImages = data.images.filter(img => img.id !== id);
//         chrome.storage.local.set({ images: updatedImages }, () => {
//           loadImages();
//         });
//       }, { once: true });
//     }
//   });
// }

// async function toggleFullscreen(url, imgId) {
//   try {
//     const fullscreenContainer = document.createElement('div');
//     fullscreenContainer.className = 'fullscreen-container discord-style';
    
//     const overlay = document.createElement('div');
//     overlay.className = 'fullscreen-overlay';
    
//     const imageWrapper = document.createElement('div');
//     imageWrapper.className = 'image-wrapper';
    
//     const image = document.createElement('img');
//     image.src = url;
//     image.className = 'fullscreen-image';
    
//     // إضافة شريط الأدوات
//     const actionsBar = document.createElement('div');
//     actionsBar.className = 'fullscreen-actions';
    
//     // زر الإغلاق
//     const closeButton = document.createElement('button');
//     closeButton.className = 'fullscreen-action-btn';
//     closeButton.innerHTML = '<i class="ri-close-line"></i>';
//     closeButton.title = 'إغلاق';
    
//     // زر التحميل
//     const downloadButton = document.createElement('button');
//     downloadButton.className = 'fullscreen-action-btn';
//     downloadButton.innerHTML = '<i class="ri-download-2-line"></i>';
//     downloadButton.title = 'تحميل';
    
//     // زر مشاركة الرابط
//     const shareButton = document.createElement('button');
//     shareButton.className = 'fullscreen-action-btn';
//     shareButton.innerHTML = '<i class="ri-share-line"></i>';
//     shareButton.title = 'مشاركة';

//     actionsBar.appendChild(downloadButton);
//     actionsBar.appendChild(shareButton);
//     actionsBar.appendChild(closeButton);
    
//     imageWrapper.appendChild(image);
//     fullscreenContainer.appendChild(overlay);
//     fullscreenContainer.appendChild(imageWrapper);
//     fullscreenContainer.appendChild(actionsBar);
    
//     requestAnimationFrame(() => {
//       document.body.appendChild(fullscreenContainer);
//       requestAnimationFrame(() => {
//         fullscreenContainer.classList.add('show');
//       });
//     });
    
//     const closeFullscreen = () => {
//       fullscreenContainer.classList.add('hiding');
//       setTimeout(() => {
//         if (fullscreenContainer && fullscreenContainer.parentNode) {
//           document.body.removeChild(fullscreenContainer);
//         }
//       }, 300);
//     };
    
//     // إضافة معالجات الأحداث
//     overlay.addEventListener('click', closeFullscreen);
//     closeButton.addEventListener('click', closeFullscreen);
    
//     downloadButton.addEventListener('click', () => {
//       downloadImage(url, imgId);
//     });
    
//     shareButton.addEventListener('click', async () => {
//       const shareMenu = document.createElement('div');
//       shareMenu.className = 'share-menu';
      
//       // Convert base64 to blob URL if needed
//       let shareUrl = url;
//       if (url.startsWith('data:')) {
//         try {
//           const response = await fetch(url);
//           const blob = await response.blob();
//           shareUrl = URL.createObjectURL(blob);
//         } catch (error) {
//           console.error('Error converting base64 to blob:', error);
//           showNotification('خطأ', 'لا يمكن مشاركة هذه الصورة');
//           return;
//         }
//       }
      
//       const shareOptions = {
//         copy: shareUrl,
//         twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
//         facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
//         whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`,
//         telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`
//       };

//       const platforms = {
//         copy: { icon: 'ri-file-copy-line', text: 'نسخ الرابط' },
//         twitter: { icon: 'ri-twitter-fill', text: 'Twitter' },
//         facebook: { icon: 'ri-facebook-fill', text: 'Facebook' },
//         whatsapp: { icon: 'ri-whatsapp-fill', text: 'WhatsApp' },
//         telegram: { icon: 'ri-telegram-fill', text: 'Telegram' }
//       };

//       for (const [platform, option] of Object.entries(platforms)) {
//         const button = document.createElement('button');
//         button.className = 'share-option';
//         button.innerHTML = `
//           <i class="${option.icon}"></i>
//           <span>${option.text}</span>
//         `;

//         button.addEventListener('click', async () => {
//           if (platform === 'copy') {
//             await navigator.clipboard.writeText(shareOptions[platform]);
//             showNotification('نجاح', 'تم نسخ الرابط');
//           } else {
//             window.open(shareOptions[platform], '_blank');
//           }
//           shareMenu.remove();

//           // Clean up blob URL
//           if (shareUrl !== url) {
//             URL.revokeObjectURL(shareUrl);
//           }
//         });

//         shareMenu.appendChild(button);
//       }

//       // إضافة القائمة إلى الصفحة
//       shareMenu.style.top = `${shareButton.offsetTop + shareButton.offsetHeight}px`;
//       shareMenu.style.left = `${shareButton.offsetLeft}px`;
//       fullscreenContainer.appendChild(shareMenu);
  
//       // إغلاق القائمة عند النقر خارجها
//       const closeMenu = (e) => {
//           if (!shareMenu.contains(e.target) && e.target !== shareButton) {
//               shareMenu.remove();
//               document.removeEventListener('click', closeMenu);
//           }
//       };
//       setTimeout(() => document.addEventListener('click', closeMenu), 0);
//     });
    
//     document.addEventListener('keydown', function handleEsc(e) {
//       if (e.key === 'Escape') {
//         closeFullscreen();
//         document.removeEventListener('keydown', handleEsc);
//       }
//     });
    
//   } catch (error) {
//     console.error('خطأ في تفعيل وضع ملء الشاشة:', error);
//   }
// }

// // إضافة دالة مشاركة الصور المحددة
// async function shareSelected() {
//   if (selectedImages.size === 0) return;

//   const shareMenu = document.createElement('div');
//   shareMenu.className = 'share-menu';
//   shareMenu.style.position = 'fixed';
//   shareMenu.style.top = '50%';
//   shareMenu.style.left = '50%';
//   shareMenu.style.transform = 'translate(-50%, -50%)';

//   const shareOptions = [
//     { id: 'copyLinks', icon: 'ri-file-copy-line', text: 'نسخ الروابط' },
//     { id: 'shareWhatsApp', icon: 'ri-whatsapp-fill', text: 'WhatsApp' },
//     { id: 'shareTelegram', icon: 'ri-telegram-fill', text: 'Telegram' },
//     { id: 'shareTwitter', icon: 'ri-twitter-fill', text: 'Twitter' }
//   ];

//   chrome.storage.local.get({ images: [] }, async (data) => {
//     const selectedUrls = data.images
//       .filter(img => selectedImages.has(img.id))
//       .map(img => img.url);

//     shareOptions.forEach(option => {
//       const button = document.createElement('button');
//       button.className = 'share-option';
//       button.innerHTML = `
//         <i class="${option.icon}"></i>
//         <span>${option.text}</span>
//       `;

//       button.addEventListener('click', async () => {
//         switch (option.id) {
//           case 'copyLinks':
//             const links = selectedUrls.join('\n');
//             await navigator.clipboard.writeText(links);
//             showNotification('نجاح', 'تم نسخ الروابط');
//             break;
//           case 'shareWhatsApp':
//             const whatsappText = selectedUrls.join('\n\n');
//             window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
//             break;
//           case 'shareTelegram':
//             const telegramText = selectedUrls.join('\n\n');
//             window.open(`https://t.me/share/url?url=${encodeURIComponent(telegramText)}`, '_blank');
//             break;
//           case 'shareTwitter':
//             const twitterText = selectedUrls.join('\n\n');
//             window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`, '_blank');
//             break;
//         }
//         shareMenu.remove();
//       });

//       shareMenu.appendChild(button);
//     });

//     document.body.appendChild(shareMenu);

//     // إغلاق القائمة عند النقر خارجها
//     const closeMenu = (e) => {
//       if (!shareMenu.contains(e.target)) {
//         shareMenu.remove();
//         document.removeEventListener('click', closeMenu);
//       }
//     };
    
//     setTimeout(() => document.addEventListener('click', closeMenu), 0);
//   });
// }

// // ...existing code...

// async function showBookmarkDialog(imageUrl) {
//     // الحصول على المجموعات المتاحة
//     const groups = await new Promise(resolve => {
//         chrome.storage.local.get({ groups: [] }, result => resolve(result.groups));
//     });

//     const dialog = document.createElement('div');
//     dialog.className = 'bookmark-dialog';
//     dialog.innerHTML = `
//         <div class="dialog-content">
//             <h3>حفظ الصورة</h3>
//             <div class="group-select">
//                 <label>اختر المجموعة</label>
//                 <select id="groupSelect" class="dialog-select">
//                     <option value="">بدون مجموعة</option>
//                     ${groups.map(g => `
//                         <option value="${g.id}" style="color: ${g.color}">
//                             ${g.name}
//                         </option>
//                     `).join('')}
//                 </select>
//             </div>
//             <div class="dialog-actions">
//                 <button class="dialog-btn confirm">حفظ</button>
//                 <button class="dialog-btn cancel">إلغاء</button>
//             </div>
//         </div>
//     `;

//     document.body.appendChild(dialog);

//     const confirmBtn = dialog.querySelector('.confirm');
//     const cancelBtn = dialog.querySelector('.cancel');
//     const groupSelect = dialog.querySelector('#groupSelect');

//     const closeDialog = () => {
//         dialog.style.animation = 'fadeOut 0.2s ease';
//         setTimeout(() => dialog.remove(), 200);
//     };

//     cancelBtn.addEventListener('click', closeDialog);

//     confirmBtn.addEventListener('click', async () => {
//         const selectedGroupId = parseInt(groupSelect.value) || null;
        
//         // إضافة الصورة
//         const imageId = Date.now();
//         const images = await new Promise(resolve => {
//             chrome.storage.local.get({ images: [] }, result => resolve(result.images));
//         });

//         const newImage = { id: imageId, url: imageUrl, isNew: true };
//         images.push(newImage);
        
//         await new Promise(resolve => {
//             chrome.storage.local.set({ images }, resolve);
//         });

//         // إذا تم اختيار مجموعة، أضف الصورة إليها
//         if (selectedGroupId) {
//             const groups = await new Promise(resolve => {
//                 chrome.storage.local.get({ groups: [] }, result => resolve(result.groups));
//             });
            
//             const group = groups.find(g => g.id === selectedGroupId);
//             if (group) {
//                 group.imageIds.push(imageId);
//                 await new Promise(resolve => {
//                     chrome.storage.local.set({ groups }, resolve);
//                 });

//                 // حفظ حالة الصورة في المجموعة
//                 const imageStates = await new Promise(resolve => {
//                     chrome.storage.local.get({ imageStates: {} }, result => resolve(result.imageStates));
//                 });
//                 imageStates[imageId] = selectedGroupId;
//                 await new Promise(resolve => {
//                     chrome.storage.local.set({ imageStates }, resolve);
//                 });
//             }
//         }

//         closeDialog();
//         showNotification('تم حفظ الصورة بنجاح');
//     });
// }

// // أضف الأنماط الجديدة
// const style = document.createElement('style');
// style.textContent = `
//     .bookmark-dialog {
//         position: fixed;
//         top: 0;
//         left: 0;
//         right: 0;
//         bottom: 0;
//         background: rgba(0, 0, 0, 0.8);
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         z-index: 999999;
//         backdrop-filter: blur(5px);
//     }

//     .dialog-content {
//         background: #2d3748;
//         padding: 24px;
//         border-radius: 12px;
//         width: 300px;
//         box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
//     }

//     .dialog-content h3 {
//         margin: 0 0 20px 0;
//         color: white;
//         font-size: 18px;
//     }

//     .group-select {
//         margin-bottom: 24px;
//     }

//     .group-select label {
//         display: block;
//         margin-bottom: 8px;
//         color: #a0aec0;
//         font-size: 14px;
//     }

//     .dialog-select {
//         width: 100%;
//         padding: 8px 12px;
//         background: rgba(255, 255, 255, 0.05);
//         border: 1px solid rgba(255, 255, 255, 0.1);
//         border-radius: 6px;
//         color: white;
//         font-size: 14px;
//     }

//     .dialog-select:focus {
//         outline: none;
//         border-color: #4299e1;
//     }

//     .dialog-actions {
//         display: flex;
//         gap: 12px;
//         justify-content: flex-end;
//     }

//     .dialog-btn {
//         padding: 8px 16px;
//         border-radius: 6px;
//         border: none;
//         font-weight: 500;
//         cursor: pointer;
//         transition: all 0.2s ease;
//     }

//     .dialog-btn.confirm {
//         background: #4299e1;
//         color: white;
//     }

//     .dialog-btn.cancel {
//         background: rgba(255, 255, 255, 0.1);
//         color: #a0aec0;
//     }

//     .dialog-btn:hover {
//         transform: translateY(-1px);
//     }

//     .dialog-btn:active {
//         transform: scale(0.98);
//     }

//     @keyframes fadeOut {
//         from { opacity: 1; }
//         to { opacity: 0; }
//     }
// `;

// document.head.appendChild(style);

// // ...existing code...