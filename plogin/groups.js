class GroupManager {
    constructor() {
        this.storage = chrome.storage.local;
    }

    // إنشاء مجموعة جديدة
    async createGroup(name, color = '#4299e1') {
        const groups = await this.getAllGroups();
        const newGroup = {
            id: Date.now(),
            name,
            color,
            imageIds: []
        };
        groups.push(newGroup);
        await this.saveGroups(groups);
        return newGroup;
    }

    // حذف مجموعة
    async deleteGroup(groupId) {
        const groups = await this.getAllGroups();
        const updatedGroups = groups.filter(group => group.id !== groupId);
        await this.saveGroups(updatedGroups);
    }

    // إضافة صور إلى مجموعة
    async addImagesToGroup(groupId, imageIds) {
        const groups = await this.getAllGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.imageIds = [...new Set([...group.imageIds, ...imageIds])];
            await this.saveGroups(groups);
            
            // حفظ حالة الصور في المجموعة
            await this.saveImageStates(imageIds, groupId);
            
            imageIds.forEach(id => {
                const imageElement = document.querySelector(`.image-item[data-id="${id}"]`);
                if (imageElement) {
                    imageElement.style.display = 'none';
                    imageElement.dataset.groupId = groupId;
                }
            });
        }
    }

    // إزالة صور من مجموعة
    async removeImagesFromGroup(groupId, imageIds) {
        const groups = await this.getAllGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.imageIds = group.imageIds.filter(id => !imageIds.includes(id));
            await this.saveGroups(groups);
            
            // إظهار السور التي تم إزالتها من المجموعة
            imageIds.forEach(id => {
                const imageElement = document.querySelector(`.image-item[data-id="${id}"]`);
                if (imageElement) {
                    imageElement.style.display = 'block';
                    delete imageElement.dataset.groupId;
                }
            });
        }
    }

    // الحصول على جميع المجموعات
    getAllGroups() {
        return new Promise((resolve) => {
            this.storage.get({ groups: [] }, (result) => {
                resolve(result.groups);
            });
        });
    }

    // حفظ المجموعات
    saveGroups(groups) {
        return new Promise((resolve) => {
            this.storage.set({ groups }, resolve);
        });
    }

    // الحصول على صور مجموعة معينة
    async getGroupImages(groupId) {
        const [groups, images] = await Promise.all([
            this.getAllGroups(),
            this.getStoredImages()
        ]);

        const group = groups.find(g => g.id === groupId);
        if (!group) return [];

        return images.filter(img => group.imageIds.includes(img.id));
    }

    // الحصول على جميع الصور المخزنة
    getStoredImages() {
        return new Promise((resolve) => {
            this.storage.get({ images: [] }, (result) => {
                resolve(result.images);
            });
        });
    }

    // تحديث اسم المجموعة
    async updateGroupName(groupId, newName) {
        const groups = await this.getAllGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.name = newName;
            await this.saveGroups(groups);
        }
    }

    // تحديث لون المجموعة
    async updateGroupColor(groupId, newColor) {
        const groups = await this.getAllGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.color = newColor;
            await this.saveGroups(groups);
        }
    }

    // دالة جديدة لعرض صور مجموعة معينة
    async showGroupImages(groupId) {
        const [images, states] = await Promise.all([
            this.getStoredImages(),
            this.getImageStates()
        ]);

        const allImageElements = document.querySelectorAll('.image-item');
        allImageElements.forEach(img => {
            const imgId = parseInt(img.dataset.id);
            if (states[imgId] === groupId) {
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
        });
    }

    // دالة جديدة لإعادة عرض كل الصور
    async showAllImages() {
        const states = await this.getImageStates();
        const allImageElements = document.querySelectorAll('.image-item');
        
        allImageElements.forEach(img => {
            const imgId = parseInt(img.dataset.id);
            if (!states[imgId]) {
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }
        });
    }

    // دالة جديدة لحفظ حالة الصور
    async saveImageStates(imageIds, groupId) {
        const states = await this.getImageStates();
        imageIds.forEach(id => {
            states[id] = groupId;
        });
        await new Promise(resolve => {
            this.storage.set({ imageStates: states }, resolve);
        });
    }

    // دالة جديدة للحصول على حالة الصور
    async getImageStates() {
        return new Promise(resolve => {
            this.storage.get({ imageStates: {} }, result => {
                resolve(result.imageStates);
            });
        });
    }

    // دالة جديدة لتحميل الحالة الأولية
    async initializeImageStates() {
        const states = await this.getImageStates();
        Object.entries(states).forEach(([imageId, groupId]) => {
            const imageElement = document.querySelector(`.image-item[data-id="${imageId}"]`);
            if (imageElement) {
                imageElement.style.display = 'none';
                imageElement.dataset.groupId = groupId;
            }
        });
    }
}

// تصدير كائن GroupManager
window.groupManager = new GroupManager();
