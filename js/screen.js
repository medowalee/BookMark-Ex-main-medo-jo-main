class ScreenManager {
    constructor() {
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.imageViewer = null;
        this.init();
    }

    init() {
        // إضافة مستمع لزر ملء الشاشة
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // مراقبة تغييرات حالة ملء الشاشة
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        
        // تعديل طريقة فتح الصور
        this.setupImageViewer();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    handleFullscreenChange() {
        const icon = document.fullscreenElement ? 
            '<i class="ri-fullscreen-exit-line"></i>' : 
            '<i class="ri-fullscreen-line"></i>';
        this.fullscreenBtn.innerHTML = icon;
    }

    setupImageViewer() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'IMG' && target.closest('.image-item')) {
                e.preventDefault();
                this.openImageViewer(target.src);
            }
        });
    }

    openImageViewer(imageUrl) {
        if (this.imageViewer) {
            this.imageViewer.remove();
        }

        this.imageViewer = document.createElement('div');
        this.imageViewer.className = 'image-viewer';
        this.imageViewer.innerHTML = `
            <div class="viewer-overlay"></div>
            <div class="viewer-content">
                <button class="close-viewer"><i class="ri-close-line"></i></button>
                <img src="${imageUrl}" alt="صورة مكبرة">
            </div>
        `;

        // إضافة مستمعات الأحداث
        this.imageViewer.querySelector('.viewer-overlay').addEventListener('click', () => {
            this.closeImageViewer();
        });

        this.imageViewer.querySelector('.close-viewer').addEventListener('click', () => {
            this.closeImageViewer();
        });

        // إضافة مستمع للـ Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeImageViewer();
            }
        });

        document.body.appendChild(this.imageViewer);
    }

    closeImageViewer() {
        if (this.imageViewer) {
            this.imageViewer.classList.add('closing');
            setTimeout(() => {
                this.imageViewer.remove();
                this.imageViewer = null;
            }, 300);
        }
    }
}

// تهيئة مدير الشاشة عند تحميل المستند
document.addEventListener('DOMContentLoaded', () => {
    window.screenManager = new ScreenManager();
});
