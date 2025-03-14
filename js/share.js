class ShareManager {
    constructor() {
        this.shareEndpoint = 'https://api.imgur.com/3/image';
        this.clientId = '8335f9895af22db    '; // احصل على Client ID من Imgur
    }

    async shareImage(imageUrl) {
        try {
            // تحويل URL الصورة إلى Blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // إنشاء FormData
            const formData = new FormData();
            formData.append('image', blob);

            // رفع الصورة إلى Imgur
            const uploadResponse = await fetch(this.shareEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Client-ID ${this.clientId}`
                },
                body: formData
            });

            const result = await uploadResponse.json();

            if (result.success) {
                return {
                    success: true,
                    url: result.data.link,
                    deleteHash: result.data.deletehash
                };
            } else {
                throw new Error('فشل رفع الصورة');
            }
        } catch (error) {
            console.error('خطأ في مشاركة الصورة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إنشاء روابط مشاركة لمنصات مختلفة
    generateShareLinks(imageUrl) {
        return {
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(imageUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`,
            whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(imageUrl)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(imageUrl)}`
        };
    }
}

window.shareManager = new ShareManager();
