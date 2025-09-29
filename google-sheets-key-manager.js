// Google Sheets 金鑰管理器
class GoogleSheetsKeyManager {
    constructor() {
        // 使用你的實際 Apps Script 部署 URL
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbzm08H3I3sY8Z7m5fb0VLFvQ0I73GFaCnOIegLH395B5q2NtbT2VxG5xukDMIZkwapv/exec';
        this.secretKey = 'ClickSprite_SecretKey_2024_Advanced_v2';
        this.keyPattern = /^CS-(FREE|PAID)-\d{8}-[A-Z0-9]{8}$/;
        this.maxDailyKeys = 5;
        this.freeUsageBonus = 20;
        this.paidUsageBonus = -1; // -1 表示無限次數
    }

    // 生成免費金鑰
    async generateFreeKey() {
        console.log('開始生成免費金鑰...');
        return await this.generateKey('FREE', this.freeUsageBonus);
    }

    // 生成付費金鑰
    async generatePaidKey() {
        console.log('開始生成付費金鑰...');
        return await this.generateKey('PAID', this.paidUsageBonus);
    }

    // 生成金鑰的核心方法
    async generateKey(keyType, usageBonus) {
        try {
            // 顯示載入狀態
            this.showLoadingState('正在檢查每日限制...');
            
            // 檢查每日限制
            const canGenerate = await this.checkDailyLimit();
            if (!canGenerate) {
                throw new Error('今日金鑰生成次數已達上限');
            }

            // 更新載入狀態
            this.updateLoadingState('正在生成金鑰...');

            // 生成金鑰
            const timestamp = this.getCurrentTimestamp();
            const randomData = this.generateRandomData();
            const keyCode = await this.createKeyCode(keyType, timestamp, randomData);
            
            console.log(`生成的金鑰: ${keyCode}`);

            // 更新載入狀態
            this.updateLoadingState('正在儲存金鑰...');

            // 儲存到 Google Sheets
            const saveResult = await this.saveKeyToDatabase(keyCode, keyType, usageBonus);
            if (!saveResult.success) {
                throw new Error('金鑰儲存失敗: ' + saveResult.error);
            }

            // 記錄本地生成
            this.logKeyGeneration(keyCode, keyType);
            
            return {
                success: true,
                key: keyCode,
                type: keyType,
                usageBonus: usageBonus,
                message: `${keyType}金鑰生成成功`
            };
        } catch (error) {
            console.error('生成金鑰失敗:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            // 隱藏載入狀態
            this.hideLoadingState();
        }
    }

    // 驗證金鑰（網頁端邏輯）
    async validateKey(keyCode) {
        try {
            console.log(`開始驗證金鑰: ${keyCode}`);
            
            // 顯示載入狀態
            this.showLoadingState('正在驗證金鑰格式...');
            
            // 基本格式驗證
            if (!this.keyPattern.test(keyCode)) {
                return {
                    valid: false,
                    reason: '金鑰格式不正確'
                };
            }

            // 更新載入狀態
            this.updateLoadingState('正在檢查金鑰完整性...');

            // 本地完整性驗證
            if (!(await this.validateKeyIntegrity(keyCode))) {
                return {
                    valid: false,
                    reason: '金鑰格式無效'
                };
            }

            // 更新載入狀態
            this.updateLoadingState('正在查詢金鑰狀態...');

            // 查詢金鑰是否存在（使用 GET 請求避免 CORS）
            const params = new URLSearchParams({
                action: 'VALIDATE_KEY',
                key: keyCode
            });

            const url = `${this.apiUrl}?${params.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status}`);
            }

            const result = await response.json();
            console.log('查詢結果:', result);

            // 網頁端邏輯判斷
            if (!result.exists) {
                return {
                    valid: false,
                    reason: '金鑰不存在'
                };
            }

            if (result.used) {
                return {
                    valid: false,
                    reason: '金鑰已被使用'
                };
            }

            // 檢查是否過期
            if (result.validUntil) {
                const validUntil = new Date(result.validUntil);
                const now = new Date();
                if (now > validUntil) {
                    return {
                        valid: false,
                        reason: '金鑰已過期'
                    };
                }
            }

            return {
                valid: true,
                reason: '金鑰有效',
                usageBonus: result.usageBonus,
                keyType: result.type,
                validUntil: result.validUntil
            };
        } catch (error) {
            console.error('驗證金鑰失敗:', error);
            return {
                valid: false,
                reason: '驗證失敗: ' + error.message
            };
        } finally {
            // 隱藏載入狀態
            this.hideLoadingState();
        }
    }

    // 使用金鑰
    async useKey(keyCode, hardwareFingerprint) {
        try {
            console.log(`開始使用金鑰: ${keyCode}`);
            
            // 顯示載入狀態
            this.showLoadingState('正在使用金鑰...');
            
            const params = new URLSearchParams({
                action: 'USE_KEY',
                key: keyCode,
                hardwareFingerprint: hardwareFingerprint
            });

            const url = `${this.apiUrl}?${params.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status}`);
            }

            const result = await response.json();
            console.log('使用金鑰結果:', result);
            return result;
        } catch (error) {
            console.error('使用金鑰失敗:', error);
            return {
                success: false,
                message: '使用金鑰失敗: ' + error.message
            };
        } finally {
            // 隱藏載入狀態
            this.hideLoadingState();
        }
    }

    // 檢查每日限制（網頁端邏輯）
    async checkDailyLimit() {
        try {
            // 獲取所有金鑰
            const allKeys = await this.getAllKeys();
            console.log('getAllKeys 結果:', allKeys);
            
            // 如果無法獲取金鑰，允許生成（避免阻擋用戶）
            if (!allKeys.success) {
                console.warn('無法獲取金鑰資料，允許生成以避免阻擋用戶');
                return true;
            }

            // 確保有 keys 陣列
            const keys = allKeys.keys || [];
            console.log('可用金鑰數量:', keys.length);

            // 計算今日生成的金鑰數量
            const today = new Date().toDateString();
            console.log('檢查日期:', today);
            
            const todayKeys = keys.filter(key => {
                if (!key.createdTime) {
                    console.log(`金鑰 ${key.code} 沒有創建時間`);
                    return false;
                }
                const createdDate = new Date(key.createdTime).toDateString();
                console.log(`金鑰 ${key.code} 創建日期: ${createdDate}, 今日: ${today}, 匹配: ${createdDate === today}`);
                return createdDate === today;
            });

            const canGenerate = todayKeys.length < this.maxDailyKeys;
            console.log(`今日已生成 ${todayKeys.length} 個金鑰，限制 ${this.maxDailyKeys} 個，可以生成: ${canGenerate}`);
            console.log('今日金鑰列表:', todayKeys.map(k => ({ code: k.code, createdTime: k.createdTime })));
            
            return canGenerate;
        } catch (error) {
            console.error('檢查每日限制失敗:', error);
            // 發生錯誤時允許生成，避免阻擋用戶
            console.warn('檢查限制時發生錯誤，允許生成以避免阻擋用戶');
            return true;
        }
    }

    // 獲取所有金鑰（使用 GET 請求避免 CORS）
    async getAllKeys() {
        try {
            const url = `${this.apiUrl}?action=GET_ALL_KEYS`;
            console.log('請求 URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status}`);
            }

            const result = await response.json();
            console.log('getAllKeys 回應:', result);
            
            // 檢查回應格式
            if (result.success === false) {
                console.error('API 返回錯誤:', result.error);
                return {
                    success: false,
                    keys: [],
                    total: 0,
                    error: result.error
                };
            }
            
            // 確保有 keys 陣列
            if (!result.keys) {
                console.warn('回應中沒有 keys 陣列，使用空陣列');
                return {
                    success: true,
                    keys: [],
                    total: 0
                };
            }
            
            return result;
        } catch (error) {
            console.error('獲取所有金鑰失敗:', error);
            return {
                success: false,
                keys: [],
                total: 0,
                error: error.message
            };
        }
    }

    // 獲取金鑰統計（網頁端邏輯）
    async getKeyStats() {
        try {
            const allKeys = await this.getAllKeys();
            if (!allKeys.success) {
                return {
                    totalGenerated: 0,
                    totalUsed: 0,
                    totalExpired: 0,
                    remaining: 0
                };
            }

            const now = new Date();
            let totalGenerated = 0;
            let totalUsed = 0;
            let totalExpired = 0;

            allKeys.keys.forEach(key => {
                totalGenerated++;
                
                if (key.used) {
                    totalUsed++;
                } else {
                    // 檢查是否過期（30天）
                    if (key.validUntil) {
                        const validUntil = new Date(key.validUntil);
                        if (now > validUntil) {
                            totalExpired++;
                        }
                    }
                }
            });

            const remaining = totalGenerated - totalUsed - totalExpired;

            return {
                totalGenerated,
                totalUsed,
                totalExpired,
                remaining
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

    // 創建金鑰代碼
    async createKeyCode(keyType, timestamp, randomData) {
        const data = `${timestamp}_${randomData}_${this.secretKey}`;
        const hash = await this.sha256Hash(data);
        return `CS-${keyType}-${timestamp}-${hash.substring(0, 8).toUpperCase()}`;
    }

    // 儲存金鑰到 Google Sheets（使用 GET 請求避免 CORS）
    async saveKeyToDatabase(keyCode, keyType, usageBonus) {
        try {
            // 計算有效期（30天）
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 30);

            const params = new URLSearchParams({
                action: 'CREATE_KEY',
                code: keyCode,
                type: keyType,
                usageBonus: usageBonus.toString(),
                validUntil: validUntil.toISOString(),
                createdBy: 'WEB'
            });

            const url = `${this.apiUrl}?${params.toString()}`;
            console.log('儲存金鑰請求 URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status}`);
            }

            const result = await response.json();
            console.log('儲存金鑰回應:', result);
            return result;
        } catch (error) {
            console.error('儲存金鑰到資料庫失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 驗證金鑰完整性
    async validateKeyIntegrity(keyCode) {
        try {
            const parts = keyCode.split('-');
            if (parts.length !== 4) return false;

            const keyType = parts[1];
            const timestamp = parts[2];
            const providedHash = parts[3];

            // 重新計算雜湊
            const randomData = this.extractRandomDataFromTimestamp(timestamp);
            const data = `${timestamp}_${randomData}_${this.secretKey}`;
            const hash = await this.sha256Hash(data);
            const expectedHash = hash.substring(0, 8).toUpperCase();

            return providedHash === expectedHash;
        } catch {
            return false;
        }
    }

    // 獲取當前時間戳（YYYYMMDD格式）
    getCurrentTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 生成隨機數據
    generateRandomData() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 從時間戳提取隨機數據
    extractRandomDataFromTimestamp(timestamp) {
        const seed = timestamp.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        let currentSeed = seed;
        
        for (let i = 0; i < 16; i++) {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            result += chars[Math.floor(currentSeed / 233280 * chars.length)];
        }
        
        return result;
    }

    // SHA256 雜湊
    async sha256Hash(str) {
        try {
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(str);
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (error) {
            console.warn('Web Crypto API 不可用，使用備用算法');
        }
        
        return this.fallbackHash(str);
    }

    // 備用雜湊算法
    fallbackHash(str) {
        let hash = 0;
        if (str.length === 0) return '0000000000000000000000000000000000000000000000000000000000000000';
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
        return (hashStr + hashStr + hashStr + hashStr + hashStr + hashStr + hashStr + hashStr).substring(0, 64);
    }

    // 生成硬體指紋
    generateHardwareFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            navigator.platform,
            new Date().getTimezoneOffset().toString(),
            new Date().getFullYear().toString()
        ];
        
        const fingerprint = this.advancedHash(components.join('_'));
        return fingerprint.padEnd(32, '0').substring(0, 32);
    }

    // 進階雜湊函數
    advancedHash(str) {
        let hash = 0;
        if (str.length === 0) return '0';
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(16);
    }

    // 記錄金鑰生成
    logKeyGeneration(keyCode, keyType) {
        try {
            const keyData = JSON.parse(localStorage.getItem('clicksprite_key_log') || '[]');
            keyData.push({
                key: keyCode,
                type: keyType,
                generated: new Date().toISOString(),
                timestamp: Date.now()
            });
            
            // 只保留最近100筆記錄
            if (keyData.length > 100) {
                keyData.splice(0, keyData.length - 100);
            }
            
            localStorage.setItem('clicksprite_key_log', JSON.stringify(keyData));
        } catch (error) {
            console.error('記錄金鑰生成失敗:', error);
        }
    }

    // 顯示載入狀態
    showLoadingState(message) {
        // 如果已經有載入狀態，先移除
        this.hideLoadingState();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'googleSheetsLoadingState';
        loadingDiv.className = 'google-sheets-loading-state';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            font-size: 16px;
            text-align: center;
            max-width: 300px;
        `;
        
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(messageDiv);
        
        // 加入 CSS 動畫
        if (!document.getElementById('googleSheetsLoadingCSS')) {
            const style = document.createElement('style');
            style.id = 'googleSheetsLoadingCSS';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loadingDiv);
    }

    // 更新載入狀態訊息
    updateLoadingState(message) {
        const loadingDiv = document.getElementById('googleSheetsLoadingState');
        if (loadingDiv) {
            const messageDiv = loadingDiv.querySelector('div:last-child');
            if (messageDiv) {
                messageDiv.textContent = message;
            }
        }
    }

    // 隱藏載入狀態
    hideLoadingState() {
        const loadingDiv = document.getElementById('googleSheetsLoadingState');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

// 建立全域實例
window.googleSheetsKeyManager = new GoogleSheetsKeyManager();
