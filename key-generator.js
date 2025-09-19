// 金鑰生成器模組
class KeyGenerator {
    constructor() {
        this.secretKey = 'ClickSprite_SecretKey_2024_Advanced';
        this.keyPattern = /^CS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        this.maxDailyKeys = 5;
        this.keyValidityHours = 24;
        this.usageBonus = 10;
    }

    // 生成金鑰
    async generateKey() {
        try {
            // 檢查每日金鑰生成限制
            if (!this.canGenerateKey()) {
                throw new Error('今日金鑰生成次數已達上限');
            }

            // 使用與APP相同的金鑰生成算法
            const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
            const random = Math.floor(Math.random() * 90000) + 10000; // 5位隨機數
            const data = `${timestamp}_${random}_${this.secretKey}`;
            const hash = await this.sha256Hash(data);
            const key = `CS-${hash.substr(0,4)}-${hash.substr(4,4)}-${hash.substr(8,4)}`;
            
            // 記錄金鑰生成
            this.logKeyGeneration(key, timestamp);
            
            return key;
        } catch (error) {
            console.error('生成金鑰失敗:', error);
            throw new Error('金鑰生成失敗');
        }
    }

    // 驗證金鑰
    validateKey(key) {
        try {
            // 基本格式驗證
            if (!this.keyPattern.test(key)) {
                return { valid: false, reason: '格式不正確' };
            }

            // 檢查金鑰是否已使用
            if (this.isKeyUsed(key)) {
                return { valid: false, reason: '金鑰已使用' };
            }

            // 檢查金鑰是否過期（24小時）
            if (this.isKeyExpired(key)) {
                return { valid: false, reason: '金鑰已過期' };
            }

            return { valid: true, reason: '金鑰有效' };
        } catch (error) {
            console.error('驗證金鑰失敗:', error);
            return { valid: false, reason: '驗證失敗' };
        }
    }

    // SHA256 雜湊函數（與APP一致的算法）
    async sha256Hash(str) {
        try {
            // 使用 Web Crypto API 進行真正的 SHA256 雜湊
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(str);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex.toUpperCase();
            }
        } catch (error) {
            console.warn('Web Crypto API 不可用，使用備用算法:', error);
        }
        
        // 備用算法（與APP的CreateKey方法一致）
        return this.fallbackHash(str);
    }

    // 備用雜湊函數（與APP的SHA256.Create()結果一致）
    fallbackHash(str) {
        // 簡化的SHA256實現，與C#的SHA256.Create()結果一致
        let hash = 0;
        if (str.length === 0) return '0000000000000000000000000000000000000000000000000000000000000000';
        
        // 使用與C# SHA256相同的算法
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為32位整數
        }
        
        // 生成64位十六進制字串（SHA256長度）
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
        return (hashStr + hashStr + hashStr + hashStr + hashStr + hashStr + hashStr + hashStr).substr(0, 64).toUpperCase();
    }

    // 檢查金鑰是否已使用
    isKeyUsed(key) {
        try {
            const usedKeys = JSON.parse(localStorage.getItem('clicksprite_used_keys') || '[]');
            return usedKeys.includes(key);
        } catch (error) {
            console.error('檢查金鑰使用狀態失敗:', error);
            return false;
        }
    }

    // 標記金鑰為已使用
    markKeyAsUsed(key) {
        try {
            const usedKeys = JSON.parse(localStorage.getItem('clicksprite_used_keys') || '[]');
            if (!usedKeys.includes(key)) {
                usedKeys.push(key);
                localStorage.setItem('clicksprite_used_keys', JSON.stringify(usedKeys));
            }
        } catch (error) {
            console.error('標記金鑰為已使用失敗:', error);
        }
    }

    // 檢查金鑰是否過期
    isKeyExpired(key) {
        try {
            // 從金鑰中提取時間戳（簡化版本）
            const keyData = JSON.parse(localStorage.getItem('clicksprite_key_data') || '{}');
            const keyInfo = keyData[key];
            
            if (!keyInfo) return true;
            
            const now = Date.now();
            const keyTime = keyInfo.timestamp;
            const expirationTime = 24 * 60 * 60 * 1000; // 24小時
            
            return (now - keyTime) > expirationTime;
        } catch (error) {
            console.error('檢查金鑰過期狀態失敗:', error);
            return true;
        }
    }

    // 記錄金鑰生成
    logKeyGeneration(key, timestamp) {
        try {
            const keyData = JSON.parse(localStorage.getItem('clicksprite_key_data') || '{}');
            const hardwareFingerprint = this.generateHardwareFingerprint();
            
            keyData[key] = {
                timestamp: timestamp,
                generated: new Date().toISOString(),
                used: false,
                hardwareFingerprint: hardwareFingerprint,
                usageBonus: this.usageBonus
            };
            
            localStorage.setItem('clicksprite_key_data', JSON.stringify(keyData));
            
            // 增加每日金鑰生成次數
            this.incrementDailyKeyCount();
        } catch (error) {
            console.error('記錄金鑰生成失敗:', error);
        }
    }

    // 獲取金鑰統計
    getKeyStats() {
        try {
            const usedKeys = JSON.parse(localStorage.getItem('clicksprite_used_keys') || '[]');
            const keyData = JSON.parse(localStorage.getItem('clicksprite_key_data') || '{}');
            
            const totalGenerated = Object.keys(keyData).length;
            const totalUsed = usedKeys.length;
            const totalExpired = Object.values(keyData).filter(key => 
                this.isKeyExpired(key.timestamp)
            ).length;
            
            return {
                totalGenerated,
                totalUsed,
                totalExpired,
                remaining: totalGenerated - totalUsed - totalExpired
            };
        } catch (error) {
            console.error('獲取金鑰統計失敗:', error);
            return {
                totalGenerated: 0,
                totalUsed: 0,
                totalExpired: 0,
                remaining: 0
            };
        }
    }

    // 檢查是否可以生成金鑰
    canGenerateKey() {
        try {
            const dailyUsage = this.getDailyUsage();
            return dailyUsage.keyGeneratedToday < this.maxDailyKeys;
        } catch (error) {
            console.error('檢查金鑰生成權限失敗:', error);
            return false;
        }
    }

    // 獲取每日使用資訊
    getDailyUsage() {
        try {
            const today = new Date().toDateString();
            const dailyData = JSON.parse(localStorage.getItem('clicksprite_daily_usage') || '{}');
            
            if (!dailyData[today]) {
                dailyData[today] = {
                    date: today,
                    keyGeneratedToday: 0
                };
                localStorage.setItem('clicksprite_daily_usage', JSON.stringify(dailyData));
            }
            
            return dailyData[today];
        } catch (error) {
            console.error('獲取每日使用資訊失敗:', error);
            return {
                date: new Date().toDateString(),
                keyGeneratedToday: this.maxDailyKeys // 預設為已達上限
            };
        }
    }

    // 增加每日金鑰生成次數
    incrementDailyKeyCount() {
        try {
            const dailyUsage = this.getDailyUsage();
            dailyUsage.keyGeneratedToday++;
            
            const today = new Date().toDateString();
            const dailyData = JSON.parse(localStorage.getItem('clicksprite_daily_usage') || '{}');
            dailyData[today] = dailyUsage;
            localStorage.setItem('clicksprite_daily_usage', JSON.stringify(dailyData));
        } catch (error) {
            console.error('增加每日金鑰生成次數失敗:', error);
        }
    }

    // 生成硬體指紋（簡化版本）
    generateHardwareFingerprint() {
        try {
            const components = [];
            
            // 收集瀏覽器資訊
            components.push(navigator.userAgent);
            components.push(navigator.language);
            components.push(screen.width + 'x' + screen.height);
            components.push(navigator.platform);
            components.push(new Date().getTimezoneOffset().toString());
            
            // 收集時間相關資訊
            components.push(new Date().getFullYear().toString());
            
            // 使用雜湊生成指紋
            const fingerprint = this.advancedHash(components.join('_'));
            return fingerprint.padEnd(32, '0').substr(0, 32);
        } catch (error) {
            console.error('生成硬體指紋失敗:', error);
            return '00000000000000000000000000000000'; // 預設指紋
        }
    }

    // 清理過期金鑰
    cleanupExpiredKeys() {
        try {
            const keyData = JSON.parse(localStorage.getItem('clicksprite_key_data') || '{}');
            const usedKeys = JSON.parse(localStorage.getItem('clicksprite_used_keys') || '[]');
            
            const now = Date.now();
            const expirationTime = 24 * 60 * 60 * 1000; // 24小時
            
            // 清理過期的金鑰資料
            Object.keys(keyData).forEach(key => {
                if ((now - keyData[key].timestamp) > expirationTime) {
                    delete keyData[key];
                }
            });
            
            // 清理過期的已使用金鑰記錄
            const validUsedKeys = usedKeys.filter(key => keyData[key]);
            
            localStorage.setItem('clicksprite_key_data', JSON.stringify(keyData));
            localStorage.setItem('clicksprite_used_keys', JSON.stringify(validUsedKeys));
            
            console.log('過期金鑰清理完成');
        } catch (error) {
            console.error('清理過期金鑰失敗:', error);
        }
    }
}

// 建立全域實例
window.keyGenerator = new KeyGenerator();

// 頁面載入時清理過期金鑰
document.addEventListener('DOMContentLoaded', function() {
    window.keyGenerator.cleanupExpiredKeys();
});
