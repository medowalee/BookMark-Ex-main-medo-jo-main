class ImageLoader {
    constructor() {
        this.loadingImages = new Set();
    }

    showLoading(imageId) {
        const imageItem = document.querySelector(`.image-item[data-id="${imageId}"]`);
        if (!imageItem) return;

        this.loadingImages.add(imageId);
        
        const loader = document.createElement('div');
        loader.className = 'image-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-text">جاري التحميل...</div>
        `;
        
        imageItem.appendChild(loader);
    }

    hideLoading(imageId) {
        const imageItem = document.querySelector(`.image-item[data-id="${imageId}"]`);
        if (!imageItem) return;

        this.loadingImages.delete(imageId);
        
        const loader = imageItem.querySelector('.image-loader');
        if (loader) {
            loader.remove();
        }
    }

    isLoading(imageId) {
        return this.loadingImages.has(imageId);
    }
}

// Make imageLoader globally available
window.imageLoader = new ImageLoader();
