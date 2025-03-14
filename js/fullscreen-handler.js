document.addEventListener('DOMContentLoaded', () => {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                fullscreenBtn.innerHTML = '<i class="ri-fullscreen-exit-line"></i>';
            } else {
                document.exitFullscreen();
                fullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
            }
        });

        // مراقبة تغيير حالة ملء الشاشة
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                fullscreenBtn.innerHTML = '<i class="ri-fullscreen-exit-line"></i>';
            } else {
                fullscreenBtn.innerHTML = '<i class="ri-fullscreen-line"></i>';
            }
        });
    }
});
