/**
 * StorageManager - ローカルストレージ管理
 * Azure Speech Service の設定情報を永続化
 */

class StorageManager {
    constructor() {
        console.log('[StorageManager] 初期化');
        this.STORAGE_KEY = 'personalVoiceTranslator';
    }

    /**
     * 設定を保存
     * @param {Object} settings - 保存する設定
     */
    saveSettings(settings) {
        try {
            console.log('[StorageManager] 設定を保存:', { ...settings, subscriptionKey: '***' });
            const data = JSON.stringify(settings);
            localStorage.setItem(this.STORAGE_KEY, data);
            console.log('[StorageManager] 保存成功');
            return true;
        } catch (error) {
            console.error('[StorageManager] 保存失敗:', error);
            return false;
        }
    }

    /**
     * 設定を読み込み
     * @returns {Object|null} - 保存された設定、または null
     */
    loadSettings() {
        try {
            console.log('[StorageManager] 設定を読み込み');
            const data = localStorage.getItem(this.STORAGE_KEY);
            
            if (!data) {
                console.log('[StorageManager] 保存された設定が見つかりません');
                return null;
            }
            
            const settings = JSON.parse(data);
            console.log('[StorageManager] 読み込み成功:', { ...settings, subscriptionKey: '***' });
            return settings;
        } catch (error) {
            console.error('[StorageManager] 読み込み失敗:', error);
            return null;
        }
    }

    /**
     * 設定をクリア
     */
    clearSettings() {
        try {
            console.log('[StorageManager] 設定をクリア');
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('[StorageManager] クリア成功');
            return true;
        } catch (error) {
            console.error('[StorageManager] クリア失敗:', error);
            return false;
        }
    }

    /**
     * 特定の設定項目を取得
     * @param {string} key - 取得する項目のキー
     * @returns {*} - 設定値、または undefined
     */
    getSetting(key) {
        const settings = this.loadSettings();
        return settings ? settings[key] : undefined;
    }

    /**
     * 特定の設定項目を更新
     * @param {string} key - 更新する項目のキー
     * @param {*} value - 新しい値
     */
    updateSetting(key, value) {
        const settings = this.loadSettings() || {};
        settings[key] = value;
        return this.saveSettings(settings);
    }

    /**
     * 設定が有効かチェック
     * @returns {boolean} - 必須項目が設定されている場合 true
     */
    isConfigured() {
        const settings = this.loadSettings();
        
        if (!settings) {
            console.log('[StorageManager] 設定が存在しません');
            return false;
        }

        const required = ['subscriptionKey', 'serviceRegion'];
        const isValid = required.every(key => settings[key] && settings[key].trim() !== '');
        
        console.log('[StorageManager] 設定の有効性チェック:', isValid);
        return isValid;
    }

    /**
     * デフォルト設定を取得
     * @returns {Object} - デフォルト設定
     */
    getDefaultSettings() {
        return {
            subscriptionKey: '',
            serviceRegion: '',
            personalVoiceId: '',
            voiceName: 'ja-JP-NanamiNeural',
            sourceLanguage: 'ja-JP',
            targetLanguage: 'en-US'
        };
    }

    /**
     * ストレージの使用状況を取得（デバッグ用）
     * @returns {Object} - ストレージ使用状況
     */
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const size = data ? new Blob([data]).size : 0;
            const sizeKB = (size / 1024).toFixed(2);
            
            const info = {
                exists: !!data,
                size: size,
                sizeKB: sizeKB + ' KB',
                keys: data ? Object.keys(JSON.parse(data)) : []
            };
            
            console.log('[StorageManager] ストレージ情報:', info);
            return info;
        } catch (error) {
            console.error('[StorageManager] ストレージ情報取得失敗:', error);
            return null;
        }
    }
}

// グローバルインスタンスを作成
window.storageManager = new StorageManager();
console.log('[StorageManager] グローバルインスタンス作成完了');
