// 下載管理器模組
class DownloadManager {
    constructor() {
        this.downloadUrl = 'https://github.com/yourusername/clicksprite/releases/latest/download/ClickSprite.exe';
        this.fallbackUrl = 'https://github.com/yourusername/clicksprite/releases';
        this.version = '1.0.0';
        this.fileSize = '2.5 MB';
    }

    // 下載程式
    async downloadProgram() {
        try {
            // 追蹤下載事件
            this.trackDownload('program_download_start');
            
            // 顯示下載進度
            this.showDownloadProgress();
            
            // 嘗試直接下載
            const success = await this.attemptDirectDownload();
            
            if (success) {
                this.trackDownload('program_download_success');
                this.showNotification('程式下載已開始！', 'success');
            } else {
                // 回退到 GitHub 頁面
                this.redirectToGitHub();
            }
            
        } catch (error) {
            console.error('下載程式失敗:', error);
            this.trackDownload('program_download_error', error.message);
            this.showNotification('下載失敗，正在重定向到 GitHub...', 'warning');
            this.redirectToGitHub();
        }
    }

    // 嘗試直接下載
    async attemptDirectDownload() {
        try {
            // 檢查瀏覽器是否支援下載
            if (!this.supportsDownload()) {
                return false;
            }

            // 建立下載連結
            const link = document.createElement('a');
            link.href = this.downloadUrl;
            link.download = 'ClickSprite.exe';
            link.style.display = 'none';
            
            // 添加到頁面並點擊
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('直接下載失敗:', error);
            return false;
        }
    }

    // 檢查瀏覽器是否支援下載
    supportsDownload() {
        try {
            // 檢查是否支援 HTML5 下載
            const a = document.createElement('a');
            return typeof a.download !== 'undefined';
        } catch (error) {
            return false;
        }
    }

    // 重定向到 GitHub
    redirectToGitHub() {
        try {
            // 在新視窗中開啟 GitHub 下載頁面
            window.open(this.fallbackUrl, '_blank');
            
            // 追蹤重定向事件
            this.trackDownload('program_download_redirect');
            
            this.showNotification('已開啟 GitHub 下載頁面', 'info');
        } catch (error) {
            console.error('重定向到 GitHub 失敗:', error);
            this.showNotification('請手動前往 GitHub 下載', 'error');
        }
    }

    // 顯示下載進度
    showDownloadProgress() {
        const progressHtml = `
            <div id="downloadProgress" class="download-progress">
                <div class="progress-content">
                    <div class="progress-icon">📥</div>
                    <div class="progress-text">正在準備下載...</div>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到頁面
        document.body.insertAdjacentHTML('beforeend', progressHtml);
        
        // 模擬進度
        this.simulateProgress();
    }

    // 模擬下載進度
    simulateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) progress = 100;
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (progressText) {
                if (progress < 30) {
                    progressText.textContent = '正在準備下載...';
                } else if (progress < 70) {
                    progressText.textContent = '正在下載程式...';
                } else if (progress < 100) {
                    progressText.textContent = '即將完成...';
                } else {
                    progressText.textContent = '下載完成！';
                }
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.hideDownloadProgress();
                }, 1000);
            }
        }, 200);
    }

    // 隱藏下載進度
    hideDownloadProgress() {
        const progress = document.getElementById('downloadProgress');
        if (progress) {
            progress.remove();
        }
    }

    // 獲取最新版本資訊
    async getLatestVersion() {
        try {
            // 這裡可以呼叫 GitHub API 獲取最新版本
            // 目前返回模擬資料
            return {
                version: this.version,
                size: this.fileSize,
                downloadUrl: this.downloadUrl,
                releaseNotes: '修復已知問題，提升穩定性'
            };
        } catch (error) {
            console.error('獲取版本資訊失敗:', error);
            return {
                version: this.version,
                size: this.fileSize,
                downloadUrl: this.downloadUrl,
                releaseNotes: '無法獲取最新版本資訊'
            };
        }
    }

    // 檢查更新
    async checkForUpdates() {
        try {
            const latestVersion = await this.getLatestVersion();
            const currentVersion = this.getCurrentVersion();
            
            if (this.isNewerVersion(latestVersion.version, currentVersion)) {
                this.showUpdateNotification(latestVersion);
            } else {
                console.log('已是最新版本');
            }
        } catch (error) {
            console.error('檢查更新失敗:', error);
        }
    }

    // 獲取當前版本
    getCurrentVersion() {
        // 從 localStorage 獲取當前版本
        return localStorage.getItem('clicksprite_version') || '1.0.0';
    }

    // 比較版本號
    isNewerVersion(version1, version2) {
        const v1 = version1.split('.').map(Number);
        const v2 = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            
            if (num1 > num2) return true;
            if (num1 < num2) return false;
        }
        
        return false;
    }

    // 顯示更新通知
    showUpdateNotification(versionInfo) {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-icon">🔄</div>
                <div class="update-text">
                    <h4>發現新版本 ${versionInfo.version}</h4>
                    <p>${versionInfo.releaseNotes}</p>
                </div>
                <button class="update-btn" onclick="downloadManager.downloadProgram()">
                    立即更新
                </button>
            </div>
        `;
        
        // 添加樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: white;
            border: 2px solid #3498db;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 400px;
            animation: slideInLeft 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 5秒後自動隱藏
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // 追蹤下載事件
    trackDownload(action, details = '') {
        try {
            const downloadEvents = JSON.parse(localStorage.getItem('clicksprite_download_events') || '[]');
            downloadEvents.push({
                timestamp: new Date().toISOString(),
                action: action,
                details: details,
                userAgent: navigator.userAgent
            });
            localStorage.setItem('clicksprite_download_events', JSON.stringify(downloadEvents));
            
            console.log(`下載事件: ${action} - ${details}`);
        } catch (error) {
            console.error('追蹤下載事件失敗:', error);
        }
    }

    // 獲取下載統計
    getDownloadStats() {
        try {
            const downloadEvents = JSON.parse(localStorage.getItem('clicksprite_download_events') || '[]');
            
            const stats = {
                totalDownloads: downloadEvents.filter(e => e.action === 'program_download_success').length,
                totalErrors: downloadEvents.filter(e => e.action === 'program_download_error').length,
                totalRedirects: downloadEvents.filter(e => e.action === 'program_download_redirect').length,
                lastDownload: downloadEvents
                    .filter(e => e.action === 'program_download_success')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp
            };
            
            return stats;
        } catch (error) {
            console.error('獲取下載統計失敗:', error);
            return {
                totalDownloads: 0,
                totalErrors: 0,
                totalRedirects: 0,
                lastDownload: null
            };
        }
    }

    // 顯示通知
    showNotification(message, type = 'info') {
        // 使用全域通知函數
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`通知 (${type}): ${message}`);
        }
    }
}

// 建立全域實例
window.downloadManager = new DownloadManager();

// 頁面載入時檢查更新
document.addEventListener('DOMContentLoaded', function() {
    window.downloadManager.checkForUpdates();
});

// 添加 CSS 動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .download-progress {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 10px;
        padding: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        min-width: 300px;
    }
    
    .progress-content {
        text-align: center;
    }
    
    .progress-icon {
        font-size: 2rem;
        margin-bottom: 15px;
    }
    
    .progress-text {
        font-size: 1.1rem;
        margin-bottom: 20px;
        color: #333;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: #ecf0f1;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(45deg, #3498db, #2980b9);
        width: 0%;
        transition: width 0.3s ease;
    }
    
    .update-notification {
        animation: slideInLeft 0.3s ease;
    }
    
    .update-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .update-icon {
        font-size: 2rem;
    }
    
    .update-text h4 {
        margin: 0 0 5px 0;
        color: #2c3e50;
    }
    
    .update-text p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
    }
    
    .update-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    
    .update-btn:hover {
        background: #2980b9;
    }
`;
document.head.appendChild(style);
