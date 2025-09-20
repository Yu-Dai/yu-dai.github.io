// 全域變數
let userStats = {
    remainingUses: 20,
    totalUses: 0,
    dailyAdViews: 0,
    maxDailyAdViews: 5,
    totalAdViews: 0,
    isPremium: false,
    lastResetDate: new Date().toDateString()
};

let adTimer = null;
let isWatchingAd = false;

// IPark 功能驗證相關變數
let verifyApp = null;

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadUserStats();
    updateUI();
    initializeVerify();
    initializeKeyGenerator();
    
    // 添加鍵盤事件監聽器
    document.addEventListener('keydown', handleKeyPress);
});

// 初始化頁面
function initializePage() {
    try {
        // 載入用戶統計
        loadUserStats();
        
        // 更新 UI
        updateUI();
        
        // 初始化 Google Analytics（如果有的話）
        initializeAnalytics();
        
        // 初始化廣告追蹤
        initializeAdTracking();
        
        console.log('頁面初始化完成');
    } catch (error) {
        console.error('頁面初始化失敗:', error);
        showNotification('頁面載入失敗，請重新整理', 'error');
    }
}

// 載入用戶統計
function loadUserStats() {
    try {
        const savedStats = localStorage.getItem('clicksprite_user_stats');
        if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            
            // 檢查是否需要重置每日限制
            const today = new Date().toDateString();
            if (parsedStats.lastResetDate !== today) {
                parsedStats.dailyAdViews = 0;
                parsedStats.lastResetDate = today;
                saveUserStats(parsedStats);
            }
            
            userStats = parsedStats;
        } else {
            // 新用戶，給予初始 20 次
            userStats = {
                remainingUses: 20,
                totalUses: 0,
                dailyAdViews: 0,
                maxDailyAdViews: 5,
                totalAdViews: 0,
                isPremium: false,
                lastResetDate: new Date().toDateString()
            };
            saveUserStats(userStats);
        }
    } catch (error) {
        console.error('載入用戶統計失敗:', error);
        // 使用預設資料
        userStats = {
            remainingUses: 20,
            totalUses: 0,
            dailyAdViews: 0,
            maxDailyAdViews: 5,
            totalAdViews: 0,
            isPremium: false,
            lastResetDate: new Date().toDateString()
        };
    }
}

// 儲存用戶統計
function saveUserStats(stats) {
    try {
        localStorage.setItem('clicksprite_user_stats', JSON.stringify(stats));
    } catch (error) {
        console.error('儲存用戶統計失敗:', error);
    }
}

// 更新 UI
function updateUI() {
    try {
        // 更新剩餘次數
        const remainingUsesElement = document.getElementById('remainingUses');
        if (remainingUsesElement) {
            if (userStats.isPremium) {
                remainingUsesElement.textContent = '∞ (付費用戶)';
                remainingUsesElement.style.color = '#f39c12';
            } else {
                remainingUsesElement.textContent = userStats.remainingUses;
                remainingUsesElement.style.color = userStats.remainingUses <= 5 ? '#e74c3c' : 
                                                 userStats.remainingUses <= 20 ? '#f39c12' : '#27ae60';
            }
        }
        
        // 更新今日觀看次數
        const dailyViewsElement = document.getElementById('dailyViews');
        if (dailyViewsElement) {
            const dailyUsage = window.keyGenerator ? window.keyGenerator.getDailyUsage() : { keyGeneratedToday: 0 };
            const remainingKeys = Math.max(0, 5 - dailyUsage.keyGeneratedToday);
            dailyViewsElement.textContent = `${dailyUsage.keyGeneratedToday}/5 (剩餘 ${remainingKeys} 次)`;
        }
        
        // 更新廣告按鈕狀態
        updateAdButton();
        
        console.log('UI 更新完成');
    } catch (error) {
        console.error('更新 UI 失敗:', error);
    }
}

// 更新廣告按鈕狀態
function updateAdButton() {
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (!watchAdBtn) return;
    
    if (userStats.isPremium) {
        watchAdBtn.textContent = '付費用戶無需觀看廣告';
        watchAdBtn.disabled = true;
        watchAdBtn.style.background = '#bdc3c7';
    } else if (!window.keyGenerator || !window.keyGenerator.canGenerateKey()) {
        watchAdBtn.textContent = '今日金鑰生成次數已達上限';
        watchAdBtn.disabled = true;
        watchAdBtn.style.background = '#bdc3c7';
    } else {
        watchAdBtn.textContent = '觀看廣告獲得金鑰';
        watchAdBtn.disabled = false;
        watchAdBtn.style.background = '#27ae60';
    }
}

// 滾動到下載區域
function scrollToDownload() {
    const downloadSection = document.getElementById('download');
    if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// 下載程式
function downloadProgram() {
    try {
        // 追蹤下載事件
        trackEvent('download', 'program_download');
        
        // 這裡應該替換為實際的下載連結
        const downloadUrl = 'https://github.com/yourusername/clicksprite/releases/latest/download/ClickSprite.exe';
        
        // 建立下載連結
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'ClickSprite.exe';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('程式下載已開始！', 'success');
        
        // 更新下載統計
        userStats.totalUses += 1;
        saveUserStats(userStats);
        
    } catch (error) {
        console.error('下載程式失敗:', error);
        showNotification('下載失敗，請重試', 'error');
    }
}

// 觀看廣告
async function watchAd() {
    if (isWatchingAd || userStats.isPremium) return;
    
    try {
        console.log('開始觀看廣告...');
        
        // 檢查是否可以生成金鑰
        const canGenerate = await window.googleSheetsKeyManager.checkDailyLimit();
        if (!canGenerate) {
            showNotification('今日金鑰生成次數已達上限，請明天再試', 'warning');
            return;
        }
        
        // 顯示廣告獎勵視窗
        showAdRewardModal();
        
    } catch (error) {
        console.error('觀看廣告失敗:', error);
        showNotification('觀看廣告失敗，請重試', 'error');
    }
}

// 顯示廣告獎勵視窗
function showAdRewardModal() {
    const modal = document.getElementById('adRewardModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滾動
        
        // 開始廣告播放
        startAdPlayback();
    }
}

// 關閉廣告獎勵視窗
function closeAdReward() {
    const modal = document.getElementById('adRewardModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢復背景滾動
        
        // 停止廣告播放
        stopAdPlayback();
    }
}

// 點擊遮罩關閉視窗
function handleOverlayClick(event) {
    if (event.target.classList.contains('ad-reward-overlay')) {
        closeAdReward();
    }
}

// ESC 鍵關閉視窗
function handleKeyPress(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('adRewardModal');
        if (modal && (modal.style.display === 'flex' || modal.style.display === 'block')) {
            closeAdReward();
        }
    }
}

// 廣告播放系統
let adPlayback = {
    isPlaying: false,
    isCompleted: false, // 防止重複完成
    totalTime: 30, // 總觀看時間（秒）
    watchedTime: 0,
    currentAdIndex: 0,
    timer: null,
    ads: [
        {
            title: "風之國度 Online",
            description: "風之國度Online以療癒風格打造全新PC MMO,帶你展開充滿愛與勇氣的暖心冒險",
            duration: 15,
            logo: "📱"
        },
        {
            title: "熱門手遊推薦",
            description: "探索最新的手機遊戲，享受精彩的遊戲體驗",
            duration: 20,
            logo: "🎮"
        },
        {
            title: "科技產品特惠",
            description: "最新科技產品限時優惠，錯過就沒有了！",
            duration: 10,
            logo: "💻"
        }
    ]
};

// 開始廣告播放
function startAdPlayback() {
    if (adPlayback.isPlaying) return;
    
    adPlayback.isPlaying = true;
    adPlayback.isCompleted = false; // 重置完成狀態
    adPlayback.watchedTime = 0;
    adPlayback.currentAdIndex = 0;
    
    // 追蹤廣告觀看事件
    trackEvent('ad', 'ad_watch_start');
    
    // 載入第一個廣告
    loadAd(adPlayback.currentAdIndex);
    
    // 開始計時器
    adPlayback.timer = setInterval(() => {
        updateAdPlayback();
    }, 1000);
    
    // 更新按鈕狀態
    updateAdButtons();
}

// 停止廣告播放
function stopAdPlayback() {
    adPlayback.isPlaying = false;
    
    if (adPlayback.timer) {
        clearInterval(adPlayback.timer);
        adPlayback.timer = null;
    }
    
    // 重置按鈕
    resetAdButton();
}

// 載入廣告
function loadAd(adIndex) {
    const ad = adPlayback.ads[adIndex];
    if (!ad) return;
    
    // 重新載入 AdSense 廣告
    if (window.adsbygoogle) {
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
    
    // 重置進度條
    const progressFill = document.getElementById('adProgressFill');
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    
    console.log(`載入廣告 ${adIndex + 1}: ${ad.title}`);
}

// 更新廣告播放進度
function updateAdPlayback() {
    if (!adPlayback.isPlaying) return;
    
    adPlayback.watchedTime++;
    
    // 更新顯示
    updateAdDisplay();
    
    // 檢查是否需要載入下一個廣告
    const currentAd = adPlayback.ads[adPlayback.currentAdIndex];
    if (currentAd && adPlayback.watchedTime >= currentAd.duration) {
        // 載入下一個廣告
        adPlayback.currentAdIndex++;
        if (adPlayback.currentAdIndex < adPlayback.ads.length) {
            loadAd(adPlayback.currentAdIndex);
        }
    }
    
    // 檢查是否完成總觀看時間（只停止計時器，不自動獲得獎勵）
    if (adPlayback.watchedTime >= adPlayback.totalTime) {
        // 停止播放，但不自動獲得獎勵
        stopAdPlayback();
        // 不調用 completeAdWatch()，讓用戶手動點擊按鈕
    }
}

// 更新廣告顯示
function updateAdDisplay() {
    const timeRemainingEl = document.getElementById('adTimeRemaining');
    const progressFill = document.getElementById('adProgressFill');
    
    const remainingTime = Math.max(0, adPlayback.totalTime - adPlayback.watchedTime);
    
    if (timeRemainingEl) timeRemainingEl.textContent = remainingTime;
    
    // 更新進度條
    if (progressFill) {
        const progress = (adPlayback.watchedTime / adPlayback.totalTime) * 100;
        progressFill.style.width = `${Math.min(progress, 100)}%`;
    }
    
    // 更新跳過按鈕
    updateAdButtons();
}

// 更新廣告按鈕狀態
function updateAdButtons() {
    const skipBtn = document.getElementById('adSkipBtn');
    const remainingTime = Math.max(0, adPlayback.totalTime - adPlayback.watchedTime);
    
    if (skipBtn) {
        if (adPlayback.watchedTime >= adPlayback.totalTime) {
            skipBtn.disabled = false;
            skipBtn.textContent = '獲得獎勵';
            skipBtn.onclick = () => {
                completeAdWatch();
                closeAdReward(); // 立即關閉視窗
            };
        } else if (adPlayback.watchedTime >= 30) {
            skipBtn.disabled = false;
            skipBtn.textContent = `跳過廣告 (${remainingTime}秒後完成)`;
            skipBtn.onclick = skipAd;
        } else {
            skipBtn.disabled = true;
            skipBtn.textContent = `跳過廣告 (${Math.max(0, 30 - adPlayback.watchedTime)}秒後可用)`;
        }
    }
}

// 跳過廣告
function skipAd() {
    if (adPlayback.watchedTime < 30) {
        showNotification('需要觀看至少 30 秒才能跳過', 'warning');
        return;
    }
    
    completeAdWatch();
}

// 完成廣告觀看
async function completeAdWatch() {
    // 防止重複執行
    if (adPlayback.isCompleted) return;
    adPlayback.isCompleted = true;
    
    try {
        // 檢查是否可以生成金鑰
        if (!window.keyGenerator || !window.keyGenerator.canGenerateKey()) {
            showNotification('今日金鑰生成次數已達上限，請明天再試', 'warning');
            return;
        }

        // 生成金鑰（異步）
        const key = await window.keyGenerator.generateKey();
        
        // 更新用戶統計（只增加廣告觀看次數，不影響金鑰生成次數）
        userStats.dailyAdViews++;
        userStats.totalAdViews++;
        userStats.canWatchAd = userStats.dailyAdViews < userStats.maxDailyAdViews;
        
        // 儲存統計
        saveUserStats(userStats);
        
        // 顯示金鑰
        showKey(key);
        
        // 更新 UI
        updateUI();
        
        // 追蹤廣告完成事件
        trackEvent('ad', 'ad_watch_complete', { 
            key: key, 
            watchedTime: adPlayback.watchedTime,
            totalTime: adPlayback.totalTime
        });
        
        showNotification('恭喜！您獲得了免費金鑰！', 'success');
        
    } catch (error) {
        console.error('完成廣告觀看失敗:', error);
        showNotification('獲得金鑰失敗：' + error.message, 'error');
    }
}

// 模擬廣告播放
function simulateAdPlay() {
    // 這裡可以整合真實的廣告平台
    // 目前使用模擬廣告
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

// 完成廣告觀看
async function completeAdWatch() {
    try {
        // 檢查是否可以生成金鑰
        if (!window.keyGenerator.canGenerateKey()) {
            showNotification('今日金鑰生成次數已達上限，請明天再試', 'warning');
            resetAdButton();
            return;
        }

        // 生成金鑰（異步）
        const key = await window.keyGenerator.generateKey();
        
        // 更新用戶統計
        userStats.dailyAdViews++;
        userStats.totalAdViews++;
        userStats.canWatchAd = userStats.dailyAdViews < userStats.maxDailyAdViews;
        
        // 儲存統計
        saveUserStats(userStats);
        
        // 顯示金鑰
        showKey(key);
        
        // 更新 UI
        updateUI();
        
        // 追蹤廣告完成事件
        trackEvent('ad', 'ad_watch_complete', { key: key });
        
        showNotification('恭喜！您獲得了免費金鑰！', 'success');
        
    } catch (error) {
        console.error('完成廣告觀看失敗:', error);
        showNotification('獲得金鑰失敗：' + error.message, 'error');
    } finally {
        resetAdButton();
    }
}

// 生成免費金鑰（使用 Google Sheets）
async function generateFreeKey() {
    try {
        console.log('開始生成免費金鑰...');
        
        // 顯示載入狀態
        showLoadingState('正在生成金鑰...');
        
        // 生成金鑰
        const result = await window.googleSheetsKeyManager.generateFreeKey();
        
        if (result.success) {
            // 顯示金鑰
            showKey(result.key);
            
            // 更新統計
            await updateUserStats();
            
            showNotification('免費金鑰生成成功！', 'success');
        } else {
            showNotification('金鑰生成失敗: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('生成免費金鑰失敗:', error);
        showNotification('金鑰生成失敗，請重試', 'error');
    } finally {
        hideLoadingState();
    }
}

// 生成金鑰（舊版本，保持向後兼容）
function generateKey() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    const hash = btoa(timestamp + random).substr(0, 12);
    return `CS-${hash.substr(0,4)}-${hash.substr(4,4)}-${hash.substr(8,4)}`;
}

// 顯示金鑰
function showKey(key) {
    const keyDisplay = document.getElementById('keyDisplay');
    const keyCode = document.getElementById('keyCode');
    
    if (keyDisplay && keyCode) {
        keyCode.textContent = key;
        keyDisplay.style.display = 'block';
        
        // 滾動到金鑰區域
        keyDisplay.scrollIntoView({ behavior: 'smooth' });
    }
}

// 複製金鑰
async function copyKey() {
    try {
        const keyCode = document.getElementById('keyCode');
        if (keyCode) {
            await navigator.clipboard.writeText(keyCode.textContent);
            showNotification('金鑰已複製到剪貼簿！', 'success');
        }
    } catch (error) {
        console.error('複製金鑰失敗:', error);
        // 回退方案
        const keyCode = document.getElementById('keyCode');
        if (keyCode) {
            const textArea = document.createElement('textarea');
            textArea.value = keyCode.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('金鑰已複製到剪貼簿！', 'success');
        }
    }
}

// 重置廣告按鈕
function resetAdButton() {
    isWatchingAd = false;
    const watchAdBtn = document.getElementById('watchAdBtn');
    const adTimerElement = document.getElementById('adTimer');
    
    if (watchAdBtn) {
        watchAdBtn.disabled = userStats.dailyAdViews >= userStats.maxDailyAdViews;
        watchAdBtn.textContent = userStats.dailyAdViews >= userStats.maxDailyAdViews ? 
            '今日已達觀看上限' : '觀看廣告獲得金鑰';
    }
    
    if (adTimerElement) {
        adTimerElement.textContent = '5';
    }
    
    if (adTimer) {
        clearInterval(adTimer);
        adTimer = null;
    }
}

// 升級為付費用戶
function upgradeToPremium() {
    try {
        // 顯示確認對話框
        const confirmed = confirm('確定要升級為付費用戶嗎？\n\n費用：NT$ 299\n\n升級後將享有無限制使用次數！');
        
        if (!confirmed) return;
        
        // 追蹤付費事件
        trackEvent('payment', 'upgrade_click');
        
        // 這裡應該整合真實的金流系統
        // 目前使用模擬付費
        showNotification('正在處理付款...', 'info');
        
        setTimeout(() => {
            // 模擬付費成功
            userStats.isPremium = true;
            userStats.remainingUses = -1; // 無限制
            userStats.premiumActivationDate = new Date().toISOString();
            
            saveUserStats(userStats);
            updateUI();
            
            showNotification('升級成功！您現在是付費用戶了！', 'success');
            
            // 追蹤付費成功事件
            trackEvent('payment', 'upgrade_success');
        }, 2000);
        
    } catch (error) {
        console.error('升級失敗:', error);
        showNotification('升級失敗，請重試', 'error');
    }
}

// 初始化 Google Analytics
function initializeAnalytics() {
    // 這裡可以整合 Google Analytics
    // 目前使用簡單的追蹤
    console.log('Analytics 初始化完成');
}

// 初始化廣告追蹤
function initializeAdTracking() {
    // 這裡可以整合廣告追蹤系統
    console.log('廣告追蹤初始化完成');
}

// 追蹤事件
function trackEvent(category, action, label = '') {
    try {
        // 這裡可以整合 Google Analytics 或其他追蹤系統
        console.log(`事件追蹤: ${category} - ${action} - ${label}`);
        
        // 簡單的本地追蹤
        const events = JSON.parse(localStorage.getItem('clicksprite_events') || '[]');
        events.push({
            timestamp: new Date().toISOString(),
            category: category,
            action: action,
            label: label
        });
        localStorage.setItem('clicksprite_events', JSON.stringify(events));
        
    } catch (error) {
        console.error('追蹤事件失敗:', error);
    }
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 移除現有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 建立新通知
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 自動移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// 獲取通知圖示
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return 'ℹ️';
    }
}

// 獲取通知顏色
function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'linear-gradient(45deg, #27ae60, #2ecc71)';
        case 'error': return 'linear-gradient(45deg, #e74c3c, #c0392b)';
        case 'warning': return 'linear-gradient(45deg, #f39c12, #e67e22)';
        case 'info': return 'linear-gradient(45deg, #3498db, #2980b9)';
        default: return 'linear-gradient(45deg, #6b7280, #4b5563)';
    }
}

// 添加 CSS 動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-icon {
        font-size: 1.2rem;
    }
    
    .notification-message {
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// IPark 功能驗證類別
class IParkVerify {
    constructor() {
        this.isTestRunning = false;
        this.testCount = 0;
        this.targetButtons = [];
        this.targetAppearTime = null;
        this.targetClickTime = null;
        this.nextClickTime = null;
        this.targetButtonClicked = false;
        this.nextButtonClicked = false;
        this.testTimer = null;
        this.targetColor = '#ff0000';
        
        // 顏色名稱對應
        this.colorNames = {
            '#ff0000': '紅色',
            '#00ff00': '綠色',
            '#0000ff': '藍色',
            '#ffff00': '黃色',
            '#ff00ff': '洋紅色',
            '#00ffff': '青色',
            '#ffa500': '橙色',
            '#800080': '紫色',
            '#ffc0cb': '粉色',
            '#a52a2a': '棕色',
            '#808080': '灰色',
            '#008000': '深綠色'
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateStatusDisplay();
    }
    
    // 初始化 DOM 元素
    initializeElements() {
        this.testArea = document.getElementById('testArea');
        this.status = document.getElementById('status');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.targetAppearTimeEl = document.getElementById('targetAppearTime');
        this.targetClickTimeEl = document.getElementById('targetClickTime');
        this.nextClickTimeEl = document.getElementById('nextClickTime');
        this.testCountEl = document.getElementById('testCount');
        this.intervalInput = document.getElementById('intervalInput');
        this.durationInput = document.getElementById('durationInput');
        this.colorInput = document.getElementById('colorInput');
        this.colorName = document.getElementById('colorName');
    }
    
    // 綁定事件
    bindEvents() {
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startTest());
        if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stopTest());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextButtonClick());
        if (this.colorInput) this.colorInput.addEventListener('change', () => this.updateColor());
        
        // 測試區域點擊事件（用於除錯）
        if (this.testArea) this.testArea.addEventListener('click', (e) => this.testAreaClick(e));
    }
    
    // 開始測試
    startTest() {
        if (this.isTestRunning) return;
        
        this.isTestRunning = true;
        this.testCount = 0;
        this.targetClickTime = null;
        this.nextClickTime = null;
        this.targetButtonClicked = false;
        this.nextButtonClicked = false;
        
        // 清除所有現有的目標按鈕
        this.clearTargetButtons();
        
        // 更新 UI 狀態
        if (this.startBtn) this.startBtn.disabled = true;
        if (this.stopBtn) this.stopBtn.disabled = false;
        
        // 清除統計顯示
        if (this.targetClickTimeEl) this.targetClickTimeEl.textContent = '-';
        if (this.nextClickTimeEl) this.nextClickTimeEl.textContent = '-';
        
        // 開始計時器
        const interval = this.intervalInput ? parseInt(this.intervalInput.value) : 3000;
        this.testTimer = setInterval(() => this.createTargetButton(), interval);
        
        this.updateStatusDisplay();
        console.log('測試開始');
    }
    
    // 停止測試
    stopTest() {
        if (!this.isTestRunning) return;
        
        this.isTestRunning = false;
        
        // 停止計時器
        if (this.testTimer) {
            clearInterval(this.testTimer);
            this.testTimer = null;
        }
        
        // 清除所有目標按鈕
        this.clearTargetButtons();
        
        // 重置點擊狀態
        this.targetButtonClicked = false;
        this.nextButtonClicked = false;
        
        // 更新 UI 狀態
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.stopBtn) this.stopBtn.disabled = true;
        
        this.updateStatusDisplay();
        console.log('測試停止');
    }
    
    // 建立目標按鈕
    createTargetButton() {
        if (!this.isTestRunning || !this.testArea) return;
        
        // 計算隨機位置（避免邊界）
        const testAreaRect = this.testArea.getBoundingClientRect();
        const x = Math.random() * (testAreaRect.width - 20) + 10;
        const y = Math.random() * (testAreaRect.height - 20) + 10;
        
        // 建立按鈕元素
        const button = document.createElement('div');
        button.className = 'target-button';
        button.style.left = x + 'px';
        button.style.top = y + 'px';
        button.style.backgroundColor = this.targetColor;
        
        // 添加點擊事件
        button.addEventListener('click', (e) => this.targetButtonClick(e, button));
        
        // 添加到測試區域
        this.testArea.appendChild(button);
        this.targetButtons.push(button);
        
        // 記錄出現時間（只有第一個按鈕時記錄）
        if (this.targetButtons.length === 1) {
            this.targetAppearTime = new Date();
        }
        
        // 設定自動消失計時器
        const duration = this.durationInput ? parseInt(this.durationInput.value) : 2000;
        setTimeout(() => {
            this.removeTargetButton(button);
        }, duration);
        
        this.updateStatusDisplay();
        console.log(`目標按鈕建立: 位置(${x.toFixed(1)}, ${y.toFixed(1)})`);
    }
    
    // 移除目標按鈕
    removeTargetButton(button) {
        if (button && button.parentNode) {
            button.classList.add('removing');
            setTimeout(() => {
                if (button.parentNode) {
                    button.parentNode.removeChild(button);
                }
                const index = this.targetButtons.indexOf(button);
                if (index > -1) {
                    this.targetButtons.splice(index, 1);
                }
                
                // 如果沒有目標按鈕了，重置點擊狀態
                if (this.targetButtons.length === 0) {
                    this.targetButtonClicked = false;
                    this.nextButtonClicked = false;
                    this.targetClickTime = null;
                    this.nextClickTime = null;
                    this.testCount++;
                    this.updateStatusDisplay();
                }
            }, 200);
        }
    }
    
    // 清除所有目標按鈕
    clearTargetButtons() {
        this.targetButtons.forEach(button => {
            if (button.parentNode) {
                button.parentNode.removeChild(button);
            }
        });
        this.targetButtons = [];
    }
    
    // 目標按鈕點擊事件
    targetButtonClick(e, button) {
        e.stopPropagation();
        
        if (!this.targetButtonClicked) {
            this.targetClickTime = new Date();
            this.targetButtonClicked = true;
            
            // 計算反應時間
            if (this.targetAppearTime && this.targetClickTimeEl) {
                const responseTime = this.targetClickTime - this.targetAppearTime;
                this.targetClickTimeEl.textContent = `${responseTime}ms`;
            }
            
            this.updateStatusDisplay();
            console.log('目標按鈕被點擊');
        }
    }
    
    // 下一步按鈕點擊事件
    nextButtonClick() {
        if (this.targetButtons.length > 0 && !this.nextButtonClicked) {
            this.nextClickTime = new Date();
            this.nextButtonClicked = true;
            
            // 計算反應時間
            if (this.targetAppearTime && this.nextClickTimeEl) {
                const responseTime = this.nextClickTime - this.targetAppearTime;
                this.nextClickTimeEl.textContent = `${responseTime}ms`;
            }
            
            this.updateStatusDisplay();
            console.log('下一步按鈕被點擊');
        }
    }
    
    // 測試區域點擊事件（除錯用）
    testAreaClick(e) {
        if (e.target === this.testArea) {
            console.log('測試區域被點擊，但沒有命中目標按鈕');
        }
    }
    
    // 更新顏色
    updateColor() {
        if (this.colorInput) {
            this.targetColor = this.colorInput.value;
            const colorName = this.colorNames[this.targetColor] || this.targetColor;
            if (this.colorName) this.colorName.textContent = colorName;
            console.log(`目標顏色更新為: ${colorName}`);
        }
    }
    
    // 更新狀態顯示
    updateStatusDisplay() {
        // 更新按鈕出現時間
        if (this.targetButtons.length > 0 && this.targetAppearTime && this.targetAppearTimeEl) {
            const elapsedTime = new Date() - this.targetAppearTime;
            this.targetAppearTimeEl.textContent = `${elapsedTime}ms (共${this.targetButtons.length}個)`;
        } else if (this.targetAppearTimeEl) {
            this.targetAppearTimeEl.textContent = '-';
        }
        
        // 更新測試次數
        if (this.testCountEl) {
            this.testCountEl.textContent = this.testCount;
        }
    }
}

// 初始化功能驗證
function initializeVerify() {
    if (document.getElementById('testArea')) {
        verifyApp = new IParkVerify();
        console.log('IPark 功能驗證程式已載入');
    }
}

// 初始化金鑰生成器
function initializeKeyGenerator() {
    try {
        if (typeof KeyGenerator !== 'undefined') {
            window.keyGenerator = new KeyGenerator();
            console.log('金鑰生成器已初始化');
        } else {
            console.warn('KeyGenerator 類別未載入');
        }
    } catch (error) {
        console.error('初始化金鑰生成器失敗:', error);
    }
}

// 更新用戶統計（使用 Google Sheets）
async function updateUserStats() {
    try {
        const stats = await window.googleSheetsKeyManager.getKeyStats();
        
        // 更新頁面顯示
        const remainingUses = document.getElementById('remainingUses');
        if (remainingUses) {
            remainingUses.textContent = stats.remaining;
        }
        
        // 更新每日觀看次數
        const dailyViews = document.getElementById('dailyViews');
        if (dailyViews) {
            const canGenerate = await window.googleSheetsKeyManager.checkDailyLimit();
            const dailyCount = 5 - (canGenerate ? 0 : 1); // 簡化計算
            dailyViews.textContent = `${dailyCount}/5`;
        }
        
    } catch (error) {
        console.error('更新統計失敗:', error);
    }
}

// 顯示載入狀態
function showLoadingState(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingState';
    loadingDiv.className = 'loading-state';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
    `;
    loadingDiv.innerHTML = `
        <div style="margin-bottom: 10px;">⏳</div>
        <div>${message}</div>
    `;
    
    document.body.appendChild(loadingDiv);
}

// 隱藏載入狀態
function hideLoadingState() {
    const loadingDiv = document.getElementById('loadingState');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 顯示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
