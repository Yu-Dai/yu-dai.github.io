# 🎯 ClickSprite - 專業點擊精靈

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://yu-dai.github.io/Web_ClickSprite/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/Yu-Dai/Web_ClickSprite/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

ClickSprite 是一款專業的滑鼠點擊輔助工具，支援顏色偵測、自動點擊等功能，提供免費試用和付費版本。

## ✨ 主要功能

### 🎯 精準偵測
- **顏色偵測**：支援 RGB 顏色值精確匹配
- **毫秒級響應**：1ms 監控間隔，確保精準點擊
- **多點監控**：同時監控多個目標區域

### ⚡ 高效能
- **低資源占用**：優化的演算法，系統資源占用極低
- **長時間運行**：穩定運行不中斷，適合長時間使用
- **快速啟動**：程式啟動速度快，即開即用

### 🛡️ 安全穩定
- **防誤觸**：智能防護機制，避免意外操作
- **安全退出**：快速安全退出功能
- **系統相容**：支援 Windows 10/11

### 🎨 易用介面
- **直觀操作**：簡單易懂的設定介面
- **一鍵啟動**：快速開始監控
- **即時反饋**：即時顯示操作狀態

## 🚀 快速開始

### 系統需求
- **作業系統**：Windows 10 或 Windows 11
- **記憶體**：至少 4GB RAM
- **硬碟空間**：至少 10MB 可用空間
- **螢幕解析度**：1024x768 或更高

### 下載安裝

1. **下載程式**
   ```bash
   # 從 GitHub Releases 下載最新版本
   https://github.com/Yu-Dai/Web_ClickSprite/releases/latest
   ```

2. **安裝程式**
   - 下載 `ClickSprite.exe` 檔案
   - 雙擊執行，無需額外安裝
   - 首次使用會要求管理員權限

3. **啟動程式**
   - 執行 `ClickSprite.exe`
   - 程式會自動載入到系統托盤
   - 右鍵點擊托盤圖示開始設定

## 📖 使用說明

### 基本設定

1. **選擇監控區域**
   - 點擊「選擇區域」按鈕
   - 拖拽滑鼠選擇要監控的螢幕區域
   - 支援多個監控區域

2. **設定偵測目標**
   - 點擊「設定顏色」按鈕
   - 使用顏色選擇器選擇目標顏色
   - 設定顏色容差值（0-255）

3. **配置點擊動作**
   - 選擇點擊按鈕（左鍵/右鍵/中鍵）
   - 設定點擊間隔（毫秒）
   - 選擇點擊次數（單次/連續）

4. **開始監控**
   - 點擊「開始監控」按鈕
   - 程式開始監控設定區域
   - 發現目標顏色時自動點擊

### 進階功能

#### 🔑 金鑰系統
- **免費試用**：新用戶享有 20 次免費使用
- **觀看廣告**：觀看廣告可獲得額外使用次數
- **付費升級**：無限制使用，享受所有功能

#### 📊 統計功能
- **使用次數**：追蹤總使用次數
- **成功率**：顯示點擊成功率
- **運行時間**：記錄程式運行時間

#### ⚙️ 進階設定
- **熱鍵設定**：自訂啟動/停止熱鍵
- **聲音提示**：開啟/關閉操作聲音
- **日誌記錄**：詳細的操作日誌

## 💰 價格方案

### 🆓 免費版
- ✅ 20 次免費使用
- ✅ 觀看廣告獲得更多次數
- ✅ 基礎功能完整
- ✅ 社群技術支援

### 💎 付費版 (NT$ 299)
- ✅ 無限制使用次數
- ✅ 所有進階功能
- ✅ 優先技術支援
- ✅ 無廣告干擾
- ✅ 定期功能更新

## 🔧 技術規格

### 核心技術
- **開發語言**：C# (.NET Framework 4.8)
- **圖形處理**：GDI+ 圖形庫
- **顏色偵測**：RGB 顏色空間
- **多執行緒**：非阻塞式監控

### 效能指標
- **監控間隔**：1ms
- **記憶體占用**：< 10MB
- **CPU 使用率**：< 1%
- **啟動時間**：< 2 秒

### 相容性
- **Windows 10**：完全支援
- **Windows 11**：完全支援
- **32/64 位元**：自動偵測
- **多螢幕**：完全支援

## 🛠️ 開發者資訊

### 專案結構
```
Web_ClickSprite/
├── index.html          # 主頁面
├── styles.css          # 樣式表
├── script.js           # 主要 JavaScript
├── ad-tracker.js       # 廣告追蹤模組
├── download-manager.js # 下載管理模組
├── key-generator.js    # 金鑰生成模組
└── README.md           # 說明文件
```

### 技術特色
- **模組化設計**：各功能獨立模組
- **事件驅動**：基於事件的架構
- **本地儲存**：使用 localStorage 儲存資料
- **響應式設計**：適配各種螢幕尺寸

## 📞 技術支援

### 常見問題

**Q: 程式無法啟動？**
A: 請確認系統為 Windows 10/11，並以管理員身份執行。

**Q: 顏色偵測不準確？**
A: 請調整顏色容差值，建議設定為 10-30。

**Q: 程式占用資源過高？**
A: 請檢查監控區域大小，過大區域會增加資源占用。

**Q: 如何獲得更多使用次數？**
A: 可以觀看廣告獲得免費金鑰，或升級為付費用戶。

### 聯絡方式
- **GitHub Issues**：[提交問題](https://github.com/Yu-Dai/Web_ClickSprite/issues)
- **電子郵件**：support@clicksprite.com
- **官方網站**：https://yu-dai.github.io/Web_ClickSprite/

## 📄 授權條款

本軟體採用 MIT 授權條款，詳見 [LICENSE](LICENSE) 檔案。

### 免責聲明
- 本軟體僅供學習和研究使用
- 使用者需自行承擔使用風險
- 請遵守當地法律法規
- 不得用於非法用途

## 🔄 更新日誌

### v1.0.0 (2024-01-01)
- ✨ 首次發布
- ✨ 基本點擊功能
- ✨ 顏色偵測功能
- ✨ 金鑰系統
- ✨ 統計功能

## 🌟 致謝

感謝所有使用者和貢獻者的支持與建議！

---

**ClickSprite** - 讓點擊更精準，讓操作更高效！

[![GitHub stars](https://img.shields.io/github/stars/Yu-Dai/Web_ClickSprite?style=social)](https://github.com/Yu-Dai/Web_ClickSprite/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Yu-Dai/Web_ClickSprite?style=social)](https://github.com/Yu-Dai/Web_ClickSprite/network)