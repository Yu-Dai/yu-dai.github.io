// ClickSprite 金鑰系統負載測試腳本
// 用於模擬多人同時存取 Google Sheets 的場景

class LoadTestRunner {
    constructor() {
        this.results = {
            totalRequests: 0,
            successRequests: 0,
            errorRequests: 0,
            responseTimes: [],
            errors: [],
            startTime: null,
            endTime: null,
            concurrentUsers: 0,
            maxConcurrentUsers: 0
        };
        
        this.isRunning = false;
        this.activeRequests = new Set();
        
        // 錯誤統計
        this.errorStats = new Map();
        
        // 回應時間統計
        this.responseTimeStats = {
            min: Infinity,
            max: 0,
            sum: 0,
            count: 0
        };
    }

    /**
     * 執行負載測試
     * @param {Object} config 測試配置
     */
    async runLoadTest(config) {
        const {
            userCount = 10,
            requestDelay = 100,
            testDuration = 30000, // 30秒
            testType = 'mixed' // 'keygen', 'validation', 'mixed'
        } = config;

        console.log('開始負載測試...', config);
        
        this.isRunning = true;
        this.results.startTime = Date.now();
        
        try {
            switch (testType) {
                case 'keygen':
                    await this.runKeyGenerationTest(userCount, requestDelay, testDuration);
                    break;
                case 'validation':
                    await this.runKeyValidationTest(userCount, requestDelay, testDuration);
                    break;
                case 'mixed':
                default:
                    await this.runMixedTest(userCount, requestDelay, testDuration);
                    break;
            }
        } catch (error) {
            console.error('負載測試失敗:', error);
        } finally {
            this.isRunning = false;
            this.results.endTime = Date.now();
            this.generateReport();
        }
    }

    /**
     * 執行金鑰生成測試
     */
    async runKeyGenerationTest(userCount, requestDelay, testDuration) {
        const promises = [];
        
        for (let i = 0; i < userCount; i++) {
            promises.push(this.simulateUser(i, 'keygen', requestDelay, testDuration));
        }
        
        await Promise.all(promises);
    }

    /**
     * 執行金鑰驗證測試
     */
    async runKeyValidationTest(userCount, requestDelay, testDuration) {
        // 先生成一些測試金鑰
        const testKeys = await this.generateTestKeys(Math.min(10, userCount));
        
        const promises = [];
        for (let i = 0; i < userCount; i++) {
            const testKey = testKeys[i % testKeys.length];
            promises.push(this.simulateUser(i, 'validation', requestDelay, testDuration, testKey));
        }
        
        await Promise.all(promises);
    }

    /**
     * 執行混合測試
     */
    async runMixedTest(userCount, requestDelay, testDuration) {
        // 生成測試金鑰
        const testKeys = await this.generateTestKeys(Math.min(5, userCount));
        
        const promises = [];
        for (let i = 0; i < userCount; i++) {
            const testKey = testKeys[i % testKeys.length];
            const testType = i % 3 === 0 ? 'keygen' : 
                           i % 3 === 1 ? 'validation' : 'sheets';
            promises.push(this.simulateUser(i, testType, requestDelay, testDuration, testKey));
        }
        
        await Promise.all(promises);
    }

    /**
     * 模擬用戶行為
     */
    async simulateUser(userId, testType, requestDelay, testDuration, testKey = null) {
        const startTime = Date.now();
        
        while (this.isRunning && (Date.now() - startTime) < testDuration) {
            try {
                await this.executeRequest(userId, testType, testKey);
                
                // 等待隨機延遲
                const delay = Math.random() * requestDelay;
                await this.sleep(delay);
                
            } catch (error) {
                console.error(`用戶 ${userId} 執行 ${testType} 測試時發生錯誤:`, error);
            }
        }
    }

    /**
     * 執行單個請求
     */
    async executeRequest(userId, testType, testKey = null) {
        const requestId = `${userId}_${Date.now()}_${Math.random()}`;
        this.activeRequests.add(requestId);
        this.results.concurrentUsers++;
        this.results.maxConcurrentUsers = Math.max(
            this.results.maxConcurrentUsers, 
            this.results.concurrentUsers
        );
        
        const startTime = Date.now();
        
        try {
            let result;
            
            switch (testType) {
                case 'keygen':
                    result = await this.testKeyGeneration();
                    break;
                case 'validation':
                    result = await this.testKeyValidation(testKey);
                    break;
                case 'sheets':
                    result = await this.testGoogleSheetsAccess();
                    break;
                default:
                    throw new Error(`未知的測試類型: ${testType}`);
            }
            
            const responseTime = Date.now() - startTime;
            this.recordResponseTime(responseTime);
            
            if (result.success) {
                this.results.successRequests++;
                console.log(`用戶 ${userId}: ${testType} 成功 (${responseTime}ms)`);
            } else {
                this.results.errorRequests++;
                this.recordError(result.error || '未知錯誤');
                console.error(`用戶 ${userId}: ${testType} 失敗 - ${result.error}`);
            }
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.recordResponseTime(responseTime);
            this.results.errorRequests++;
            this.recordError(error.message);
            console.error(`用戶 ${userId}: ${testType} 異常 - ${error.message}`);
        } finally {
            this.results.totalRequests++;
            this.results.concurrentUsers--;
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * 測試金鑰生成
     */
    async testKeyGeneration() {
        try {
            // 檢查每日限制
            const canGenerate = await window.googleSheetsKeyManager.checkDailyLimit();
            if (!canGenerate) {
                return { success: false, error: '每日金鑰生成限制' };
            }
            
            // 生成金鑰
            const key = await window.keyGenerator.generateKey();
            return { success: !!key, key: key };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 測試金鑰驗證
     */
    async testKeyValidation(key) {
        try {
            if (!key) {
                return { success: false, error: '沒有測試金鑰' };
            }
            
            const result = await window.keyGenerator.validateKey(key);
            return { success: result.valid, reason: result.reason };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 測試 Google Sheets 存取
     */
    async testGoogleSheetsAccess() {
        try {
            const result = await window.googleSheetsKeyManager.getAllKeys();
            return { success: result.success !== false, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 生成測試金鑰
     */
    async generateTestKeys(count) {
        const keys = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const key = await window.keyGenerator.generateKey();
                if (key) {
                    keys.push(key);
                }
            } catch (error) {
                console.warn(`生成測試金鑰 ${i} 失敗:`, error.message);
            }
        }
        
        console.log(`成功生成 ${keys.length} 個測試金鑰`);
        return keys;
    }

    /**
     * 記錄回應時間
     */
    recordResponseTime(responseTime) {
        this.results.responseTimes.push(responseTime);
        this.responseTimeStats.min = Math.min(this.responseTimeStats.min, responseTime);
        this.responseTimeStats.max = Math.max(this.responseTimeStats.max, responseTime);
        this.responseTimeStats.sum += responseTime;
        this.responseTimeStats.count++;
    }

    /**
     * 記錄錯誤
     */
    recordError(error) {
        this.results.errors.push({
            error: error,
            timestamp: new Date().toISOString()
        });
        
        const count = this.errorStats.get(error) || 0;
        this.errorStats.set(error, count + 1);
    }

    /**
     * 睡眠函數
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 生成測試報告
     */
    generateReport() {
        const duration = this.results.endTime - this.results.startTime;
        const successRate = this.results.totalRequests > 0 ? 
            (this.results.successRequests / this.results.totalRequests) * 100 : 0;
        
        const avgResponseTime = this.responseTimeStats.count > 0 ?
            this.responseTimeStats.sum / this.responseTimeStats.count : 0;
        
        const report = {
            summary: {
                testDuration: duration,
                totalRequests: this.results.totalRequests,
                successRequests: this.results.successRequests,
                errorRequests: this.results.errorRequests,
                successRate: Math.round(successRate * 100) / 100,
                maxConcurrentUsers: this.results.maxConcurrentUsers,
                avgResponseTime: Math.round(avgResponseTime * 100) / 100,
                minResponseTime: this.responseTimeStats.min === Infinity ? 0 : this.responseTimeStats.min,
                maxResponseTime: this.responseTimeStats.max
            },
            errors: Object.fromEntries(this.errorStats),
            recommendations: this.generateRecommendations(successRate, avgResponseTime)
        };
        
        console.log('=== 負載測試報告 ===');
        console.log(JSON.stringify(report, null, 2));
        
        return report;
    }

    /**
     * 生成建議
     */
    generateRecommendations(successRate, avgResponseTime) {
        const recommendations = [];
        
        if (successRate < 90) {
            recommendations.push('成功率低於90%，建議檢查Google Sheets API限制和錯誤處理');
        }
        
        if (avgResponseTime > 5000) {
            recommendations.push('平均回應時間超過5秒，建議優化API調用或增加快取機制');
        }
        
        if (this.results.maxConcurrentUsers > 50) {
            recommendations.push('最大並發用戶數超過50，建議實作請求佇列和限流機制');
        }
        
        if (this.errorStats.size > 5) {
            recommendations.push('錯誤類型過多，建議檢查錯誤處理和重試機制');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('系統表現良好，可以考慮增加負載測試強度');
        }
        
        return recommendations;
    }

    /**
     * 停止測試
     */
    stop() {
        this.isRunning = false;
        console.log('負載測試已停止');
    }

    /**
     * 獲取即時統計
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            totalRequests: this.results.totalRequests,
            successRequests: this.results.successRequests,
            errorRequests: this.results.errorRequests,
            concurrentUsers: this.results.concurrentUsers,
            maxConcurrentUsers: this.results.maxConcurrentUsers,
            avgResponseTime: this.responseTimeStats.count > 0 ?
                Math.round((this.responseTimeStats.sum / this.responseTimeStats.count) * 100) / 100 : 0
        };
    }
}

// 使用範例
function runLoadTestExample() {
    const loadTestRunner = new LoadTestRunner();
    
    // 執行輕量級測試
    loadTestRunner.runLoadTest({
        userCount: 5,
        requestDelay: 200,
        testDuration: 10000, // 10秒
        testType: 'mixed'
    }).then(report => {
        console.log('測試完成，報告:', report);
    });
    
    // 監控測試進度
    const interval = setInterval(() => {
        const stats = loadTestRunner.getStats();
        console.log('測試統計:', stats);
        
        if (!stats.isRunning) {
            clearInterval(interval);
        }
    }, 1000);
}

// 匯出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadTestRunner;
} else if (typeof window !== 'undefined') {
    window.LoadTestRunner = LoadTestRunner;
}
