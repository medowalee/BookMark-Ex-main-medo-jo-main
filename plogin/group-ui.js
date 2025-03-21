class GroupUI {
    constructor() {
        this.draggedGroup = null;
        this.draggedImage = null;
    }

    renderGroups(groups) {
        let groupsSection = document.querySelector('.groups-section');
        
        // إذا لم تكن هناك مجموعات، نزيل القسم إذا كان موجوداً
        if (!groups || groups.length === 0) {
            if (groupsSection) {
                groupsSection.remove();
            }
            return;
        }

        // إنشاء قسم المجموعات إذا لم يكن موجوداً
        if (!groupsSection) {
            groupsSection = document.createElement('div');
            groupsSection.className = 'groups-section';
            groupsSection.innerHTML = '<div class="groups-list"></div>';
            const container = document.getElementById('groups-section-container');
            container.insertBefore(groupsSection, container.firstChild);
        }

        // إضافة صنف has-groups لإظهار القسم
        groupsSection.classList.add('has-groups');

        // تحديث المجموعات
        const list = groupsSection.querySelector('.groups-list');
        list.innerHTML = '';
        groups.forEach(group => {
            const groupEl = this.createGroupElement(group);
            list.appendChild(groupEl);
        });
    }

    createGroupElement(group) {
        const el = document.createElement('div');
        el.className = 'group-item';
        el.dataset.groupId = group.id;
        el.style.borderColor = group.color;
        el.draggable = true;

        // تحديث التصميم لعرض المعلومات بشكل أفضل
        el.innerHTML = `
            <div class="group-name">
                <i class="ri-folder-line"></i>
                <span>${group.name}</span>
            </div>
            <span class="group-count">
                <i class="ri-image-line"></i>
                ${group.imageIds.length}
            </span>
            <div class="group-actions">
                <button class="group-btn edit-group" title="تعديل">
                    <i class="ri-edit-line"></i>
                </button>
                <button class="group-btn delete-group" title="حذف">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;

        this.setupGroupDragAndDrop(el);
        this.setupGroupActions(el, group);

        return el;
    }

    setupGroupDragAndDrop(groupEl) {
        groupEl.addEventListener('dragstart', (e) => {
            this.draggedGroup = groupEl;
            e.dataTransfer.setData('text/plain', 'group');
            groupEl.classList.add('dragging');
        });

        groupEl.addEventListener('dragend', () => {
            this.draggedGroup = null;
            groupEl.classList.remove('dragging');
        });

        groupEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedImage) {
                groupEl.classList.add('drag-over');
            }
        });

        groupEl.addEventListener('dragleave', () => {
            groupEl.classList.remove('drag-over');
        });

        groupEl.addEventListener('drop', async (e) => {
            e.preventDefault();
            groupEl.classList.remove('drag-over');

            if (this.draggedImage) {
                const imageId = parseInt(this.draggedImage.dataset.id);
                const groupId = parseInt(groupEl.dataset.groupId);
                await groupManager.addImagesToGroup(groupId, [imageId]);
                this.updateGroupCount(groupId);
            }
        });
    }

    setupGroupActions(groupEl, group) {
        groupEl.querySelector('.edit-group').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEditGroupDialog(group);
        });

        groupEl.querySelector('.delete-group').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showDeleteGroupConfirmation(group);
        });

        groupEl.addEventListener('click', async () => {
            const isActive = groupEl.classList.contains('active');
            
            // إزالة الحالة النشطة من كل المجموعات
            document.querySelectorAll('.group-item').forEach(item => {
                item.classList.remove('active');
            });

            if (!isActive) {
                // عرض صور المجموعة المحددة
                await groupManager.showGroupImages(group.id);
                groupEl.classList.add('active');
            } else {
                // إعادة عرض كل الصور
                await groupManager.showAllImages();
            }
        });

        groupEl.addEventListener('click', async () => {
            // إخفاء قسم المجموعات
            const groupsSection = document.querySelector('.groups-section');
            groupsSection.style.display = 'none';
            
            // إخفاء زر إنشاء المجموعة وإظهار زر الرجوع
            const createGroupBtn = document.querySelector('#createGroupBtn');
            createGroupBtn.style.display = 'none';
            
            // إنشاء زر العودة إذا لم يكن موجوداً
            let backBtn = document.querySelector('#backToGroups');
            if (!backBtn) {
                backBtn = document.createElement('button');
                backBtn.id = 'backToGroups';
                backBtn.className = 'header-btn-t';
                backBtn.innerHTML = '<i class="ri-arrow-left-line"></i>';
                backBtn.title = 'العودة للمجموعات';
                
                createGroupBtn.parentNode.insertBefore(backBtn, createGroupBtn);
                
                backBtn.addEventListener('click', () => {
                    // إعادة عرض المجموعات
                    groupsSection.style.display = 'block';
                    // إظهار زر إنشاء المجموعة
                    createGroupBtn.style.display = 'flex';
                    // إخفاء زر العودة
                    backBtn.style.display = 'none';
                    // إعادة عرض جميع الصور
                    groupManager.showAllImages();
                });
            } else {
                backBtn.style.display = 'flex';
            }

            // عرض صور المجموعة المحددة
            await groupManager.showGroupImages(group.id);
        });
    }

    async updateGroupCount(groupId) {
        const groups = await groupManager.getAllGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            const groupEl = document.querySelector(`[data-group-id="${groupId}"]`);
            if (groupEl) {
                groupEl.querySelector('.group-count').textContent = group.imageIds.length;
            }
        }
    }

    showCreateGroupDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'group-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>إنشاء مجموعة جديدة</h3>
                <input type="text" 
                       id="groupName" 
                       class="dialog-input" 
                       placeholder="اسم المجموعة" 
                       autocomplete="off"
                       maxlength="30">
                <div class="color-input-group">
                    <label>لون المجموعة</label>
                    <input type="color" id="groupColor" value="#4299e1">
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn cancel">إلغاء</button>
                    <button class="dialog-btn confirm">إنشاء</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const nameInput = dialog.querySelector('#groupName');
        const colorInput = dialog.querySelector('#groupColor');
        const confirmBtn = dialog.querySelector('.confirm');
        const cancelBtn = dialog.querySelector('.cancel');

        // تركيز تلقائي على حقل الاسم
        nameInput.focus();

        const closeDialog = () => {
            dialog.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => dialog.remove(), 200);
        };

        confirmBtn.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            if (name) {
                const newGroup = await groupManager.createGroup(name, colorInput.value);
                this.renderGroups(await groupManager.getAllGroups());
                closeDialog();
            } else {
                nameInput.classList.add('error');
            }
        });

        cancelBtn.addEventListener('click', closeDialog);
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeDialog();
        });
    }

    showEditGroupDialog(group) {
        const dialog = document.createElement('div');
        dialog.className = 'group-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>تعديل المجموعة</h3>
                <input type="text" 
                       id="groupName" 
                       class="dialog-input" 
                       value="${group.name}"
                       autocomplete="off"
                       maxlength="30">
                <div class="color-input-group">
                    <label>لون المجموعة</label>
                    <input type="color" id="groupColor" value="${group.color}">
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn cancel">إلغاء</button>
                    <button class="dialog-btn confirm">حفظ</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const nameInput = dialog.querySelector('#groupName');
        const colorInput = dialog.querySelector('#groupColor');
        const confirmBtn = dialog.querySelector('.confirm');
        const cancelBtn = dialog.querySelector('.cancel');

        nameInput.focus();
        nameInput.select();

        const closeDialog = () => {
            dialog.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => dialog.remove(), 200);
        };

        confirmBtn.addEventListener('click', async () => {
            const newName = nameInput.value.trim();
            if (newName) {
                await groupManager.updateGroupName(group.id, newName);
                await groupManager.updateGroupColor(group.id, colorInput.value);
                this.renderGroups(await groupManager.getAllGroups());
                closeDialog();
            }
        });

        cancelBtn.addEventListener('click', closeDialog);
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeDialog();
        });
    }

    showDeleteGroupConfirmation(group) {
        if (confirm(`هل أنت متأكد من حذف مجموعة "${group.name}"؟`)) {
            groupManager.deleteGroup(group.id).then(async () => {
                this.renderGroups(await groupManager.getAllGroups());
            });
        }
    }
}

window.groupUI = new GroupUI();
