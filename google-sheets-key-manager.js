// Google Sheets 金鑰管理器
class GoogleSheetsKeyManager {
    constructor() {
        // 使用你的實際 Apps Script 部署 URL
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbzC_VzokTNnWlTObcreNMenUTXwzU1ik2ObEtvmoHAyaz9EVJ1r8R2PdT_5dAf8ASHn/exec';
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
            // 檢查每日限制
            const canGenerate = await this.checkDailyLimit();
            if (!canGenerate) {
                throw new Error('今日金鑰生成次數已達上限');
            }

            // 生成金鑰
            const timestamp = this.getCurrentTimestamp();
            const randomData = this.generateRandomData();
            const keyCode = this.createKeyCode(keyType, timestamp, randomData);
            
            console.log(`生成的金鑰: ${keyCode}`);

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
        }
    }

    // 驗證金鑰（網頁端邏輯）
    async validateKey(keyCode) {
        try {
            console.log(`開始驗證金鑰: ${keyCode}`);
            
            // 基本格式驗證
            if (!this.keyPattern.test(keyCode)) {
                return {
                    valid: false,
                    reason: '金鑰格式不正確'
                };
            }

            // 本地完整性驗證
            if (!this.validateKeyIntegrity(keyCode)) {
                return {
                    valid: false,
                    reason: '金鑰格式無效'
                };
            }

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
        }
    }

    // 使用金鑰
    async useKey(keyCode, hardwareFingerprint) {
        try {
            console.log(`開始使用金鑰: ${keyCode}`);
            
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
        }
    }

    // 檢查每日限制（網頁端邏輯）
    async checkDailyLimit() {
        try {
            // 獲取所有金鑰
            const allKeys = await this.getAllKeys();
            if (!allKeys.success) {
                return false;
            }

            // 計算今日生成的金鑰數量
            const today = new Date().toDateString();
            const todayKeys = allKeys.keys.filter(key => {
                const createdDate = new Date(key.createdTime).toDateString();
                return createdDate === today;
            });

            const canGenerate = todayKeys.length < this.maxDailyKeys;
            console.log(`今日已生成 ${todayKeys.length} 個金鑰，限制 ${this.maxDailyKeys} 個，可以生成: ${canGenerate}`);
            
            return canGenerate;
        } catch (error) {
            console.error('檢查每日限制失敗:', error);
            return false;
        }
    }

    // 獲取所有金鑰（使用 GET 請求避免 CORS）
    async getAllKeys() {
        try {
            const url = `${this.apiUrl}?action=GET_ALL_KEYS`;
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('獲取所有金鑰失敗:', error);
            return {
                success: false,
                keys: [],
                total: 0
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
    createKeyCode(keyType, timestamp, randomData) {
        const data = `${timestamp}_${randomData}_${this.secretKey}`;
        const hash = this.sha256Hash(data).substring(0, 8).toUpperCase();
        return `CS-${keyType}-${timestamp}-${hash}`;
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
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status}`);
            }

            const result = await response.json();
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
    validateKeyIntegrity(keyCode) {
        try {
            const parts = keyCode.split('-');
            if (parts.length !== 4) return false;

            const keyType = parts[1];
            const timestamp = parts[2];
            const providedHash = parts[3];

            // 重新計算雜湊
            const randomData = this.extractRandomDataFromTimestamp(timestamp);
            const data = `${timestamp}_${randomData}_${this.secretKey}`;
            const expectedHash = this.sha256Hash(data).substring(0, 8).toUpperCase();

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
}

// 建立全域實例
window.googleSheetsKeyManager = new GoogleSheetsKeyManager();
