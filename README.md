# Silksong 文字編輯器

讓玩家能以簡單易用的方式，透過 `resources.assets` 檔案，瀏覽與編輯《空洞騎士：絲綢之歌》的遊戲文字內容。
本專案目前以繁體中文（臺灣，zh‑TW）條目為主要編輯目標。

---

## 🙏 感謝

特別感謝以下專案提供關鍵的靈感與技術基礎：

[SKSG_TChinese](https://github.com/tents89/SKSG_TChinese)

[SilksongDecryptor](https://github.com/rm-NoobInCoding/SilksongDecryptor)

---

## ✨ 功能特色

- 載入並解析遊戲的 `resources.assets` 檔案
- 瀏覽所有可用的遊戲文字
- 直接在應用程式中編輯文字
- 將修改內容儲存並匯出回遊戲檔案

> 重要：覆寫任何檔案前，請務必先備份原始檔案！

---

## 🛠️ 貢獻指南

### 系統架構

- Next.js (SSG) + HeroUI
- Tauri 2 (Rust)
- Python (負責解析／匯出 Unity Assets)

UI 透過 Tauri 指令呼叫 (Rust)，再由 Rust 轉交 Python 處理 Unity Assets 的讀寫，最後回傳結果至 UI。

### 專案結構

- `src/` – Next.js 應用程式 (UI 元件、hooks、i18n)
- `src-tauri/` – Tauri 設定與 Rust 橋接層
- `src-python/` – 讀寫 Unity Assets 的 Python 指令碼
- `python-runtime/` – 部署時用的 Python 執行環境

### 開發環境設定

1. 先決條件

   ```bash
   # 以 nvm 安裝 Node (本專案使用 Node v24.7.0)
   nvm use

   # 以 Bun 管理 JavaScript 套件
   npm i -g bun

   # 安裝 Tauri 所需 Rust 工具鏈

   # 若需開發 Python 層，建議安裝 Python 3.12+
   # 我們使用 uv 做為 Python 套件管理工具
   ```

2. 安裝相依套件

   ```bash
   bun i
   ```

3. 執行桌面應用（開發模式）

   ```bash
   bunx tauri dev
   ```

### 產生安裝包

建立對應作業系統的桌面安裝包／可攜版：

```bash
bunx tauri build
```

建置完成後的產出會位於 `src-tauri/target/` 目錄下。
