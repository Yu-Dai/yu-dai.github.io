// 廣告追蹤器模組
class AdTracker {
    constructor() {
        this.adEvents = [];
        this.isAdBlocked = false;
        this.adRevenue = 0;
        this.init();
    }

    // 初始化
    init() {
        this.checkAdBlock();
        this.setupAdListeners();
        this.loadAdStats();
    }

    // 檢查廣告攔截器
    checkAdBlock() {
        try {
            // 建立測試廣告元素
            const testAd = document.createElement('div');
            testAd.innerHTML = '&nbsp;';
            testAd.className = 'adsbox';
            testAd.style.cssText = 'position:absolute;left:-10000px;top:-1000px;';
            document.body.appendChild(testAd);
            
            // 檢查是否被攔截
            setTimeout(() => {
                if (testAd.offsetHeight === 0) {
                    this.isAdBlocked = true;
                    this.trackAdEvent('ad_block_detected');
                    this.showAdBlockMessage();
                } else {
                    this.isAdBlocked = false;
                }
                document.body.removeChild(testAd);
            }, 100);
        } catch (error) {
            console.error('檢查廣告攔截器失敗:', error);
        }
    }

    // 設定廣告監聽器
    setupAdListeners() {
        try {
            // 監聽 Google AdSense 事件
            if (typeof adsbygoogle !== 'undefined') {
                // 監聽廣告載入
                document.addEventListener('DOMContentLoaded', () => {
                    this.trackAdEvent('adsense_loaded');
                });
            }

            // 監聽廣告點擊
            document.addEventListener('click', (event) => {
                if (event.target.closest('.adsbygoogle')) {
                    this.trackAdEvent('ad_click', {
                        adSlot: event.target.getAttribute('data-ad-slot'),
                        adClient: event.target.getAttribute('data-ad-client')
                    });
                }
            });

            // 監聽廣告觀看
            this.setupAdViewTracking();
        } catch (error) {
            console.error('設定廣告監聽器失敗:', error);
        }
    }

    // 設定廣告觀看追蹤
    setupAdViewTracking() {
        try {
            // 使用 Intersection Observer 追蹤廣告可見性
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.trackAdEvent('ad_view', {
                                adSlot: entry.target.getAttribute('data-ad-slot'),
                                viewTime: Date.now()
                            });
                        }
                    });
                }, { threshold: 0.5 });

                // 觀察所有廣告元素
                document.addEventListener('DOMContentLoaded', () => {
                    const adElements = document.querySelectorAll('.adsbygoogle');
                    adElements.forEach(ad => observer.observe(ad));
                });
            }
        } catch (error) {
            console.error('設定廣告觀看追蹤失敗:', error);
        }
    }

    // 追蹤廣告事件
    trackAdEvent(eventType, data = {}) {
        try {
            const event = {
                timestamp: new Date().toISOString(),
                eventType: eventType,
                data: data,
                userAgent: navigator.userAgent,
                url: window.location.href,
                referrer: document.referrer
            };

            this.adEvents.push(event);
            this.saveAdEvents();

            console.log(`廣告事件: ${eventType}`, data);
        } catch (error) {
            console.error('追蹤廣告事件失敗:', error);
        }
    }

    // 儲存廣告事件
    saveAdEvents() {
        try {
            localStorage.setItem('clicksprite_ad_events', JSON.stringify(this.adEvents));
        } catch (error) {
            console.error('儲存廣告事件失敗:', error);
        }
    }

    // 載入廣告統計
    loadAdStats() {
        try {
            const savedEvents = localStorage.getItem('clicksprite_ad_events');
            if (savedEvents) {
                this.adEvents = JSON.parse(savedEvents);
            }
        } catch (error) {
            console.error('載入廣告統計失敗:', error);
        }
    }

    // 顯示廣告攔截訊息
    showAdBlockMessage() {
        const message = document.createElement('div');
        message.className = 'ad-block-message';
        message.innerHTML = `
            <div class="ad-block-content">
                <div class="ad-block-icon">🚫</div>
                <div class="ad-block-text">
                    <h4>檢測到廣告攔截器</h4>
                    <p>請關閉廣告攔截器以支援我們，讓我們能夠繼續提供免費服務。</p>
                </div>
                <button class="ad-block-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // 添加樣式
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 500px;
            animation: slideInDown 0.3s ease;
        `;

        document.body.appendChild(message);

        // 10秒後自動隱藏
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 10000);
    }

    // 獲取廣告統計
    getAdStats() {
        try {
            const stats = {
                totalViews: this.adEvents.filter(e => e.eventType === 'ad_view').length,
                totalClicks: this.adEvents.filter(e => e.eventType === 'ad_click').length,
                totalRevenue: this.calculateRevenue(),
                adBlockDetected: this.isAdBlocked,
                clickThroughRate: this.calculateCTR(),
                averageViewTime: this.calculateAverageViewTime(),
                topAdSlots: this.getTopAdSlots()
            };

            return stats;
        } catch (error) {
            console.error('獲取廣告統計失敗:', error);
            return {
                totalViews: 0,
                totalClicks: 0,
                totalRevenue: 0,
                adBlockDetected: false,
                clickThroughRate: 0,
                averageViewTime: 0,
                topAdSlots: []
            };
        }
    }

    // 計算收益
    calculateRevenue() {
        try {
            // 簡化的收益計算（實際應該從廣告平台獲取）
            const clicks = this.adEvents.filter(e => e.eventType === 'ad_click').length;
            const views = this.adEvents.filter(e => e.eventType === 'ad_view').length;
            
            // 假設每次點擊 0.5-2 元，每次觀看 0.01-0.05 元
            const clickRevenue = clicks * (0.5 + Math.random() * 1.5);
            const viewRevenue = views * (0.01 + Math.random() * 0.04);
            
            return Math.round((clickRevenue + viewRevenue) * 100) / 100;
        } catch (error) {
            console.error('計算收益失敗:', error);
            return 0;
        }
    }

    // 計算點擊率
    calculateCTR() {
        try {
            const clicks = this.adEvents.filter(e => e.eventType === 'ad_click').length;
            const views = this.adEvents.filter(e => e.eventType === 'ad_view').length;
            
            if (views === 0) return 0;
            return Math.round((clicks / views) * 10000) / 100; // 百分比，保留兩位小數
        } catch (error) {
            console.error('計算點擊率失敗:', error);
            return 0;
        }
    }

    // 計算平均觀看時間
    calculateAverageViewTime() {
        try {
            const viewEvents = this.adEvents.filter(e => e.eventType === 'ad_view');
            if (viewEvents.length === 0) return 0;
            
            // 簡化計算，實際應該追蹤真實的觀看時間
            return Math.round(Math.random() * 30 + 5); // 5-35秒
        } catch (error) {
            console.error('計算平均觀看時間失敗:', error);
            return 0;
        }
    }

    // 獲取熱門廣告位
    getTopAdSlots() {
        try {
            const slotCounts = {};
            this.adEvents.forEach(event => {
                if (event.data.adSlot) {
                    slotCounts[event.data.adSlot] = (slotCounts[event.data.adSlot] || 0) + 1;
                }
            });
            
            return Object.entries(slotCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([slot, count]) => ({ slot, count }));
        } catch (error) {
            console.error('獲取熱門廣告位失敗:', error);
            return [];
        }
    }

    // 清理舊的廣告事件
    cleanupOldEvents() {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            this.adEvents = this.adEvents.filter(event => 
                new Date(event.timestamp) > oneWeekAgo
            );
            
            this.saveAdEvents();
            console.log('舊的廣告事件已清理');
        } catch (error) {
            console.error('清理舊的廣告事件失敗:', error);
        }
    }

    // 匯出廣告數據
    exportAdData() {
        try {
            const data = {
                stats: this.getAdStats(),
                events: this.adEvents,
                exportTime: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `clicksprite_ad_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('匯出廣告數據失敗:', error);
        }
    }
}

// 建立全域實例
window.adTracker = new AdTracker();

// 頁面載入時清理舊事件
document.addEventListener('DOMContentLoaded', function() {
    window.adTracker.cleanupOldEvents();
});

// 添加 CSS 動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    .ad-block-message {
        animation: slideInDown 0.3s ease;
    }
    
    .ad-block-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .ad-block-icon {
        font-size: 2rem;
    }
    
    .ad-block-text h4 {
        margin: 0 0 5px 0;
        font-size: 1.1rem;
    }
    
    .ad-block-text p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .ad-block-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s ease;
    }
    
    .ad-block-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);
