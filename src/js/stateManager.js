/**
 * StateManager - アプリケーション状態管理
 * グローバルな状態を一元管理
 */

class StateManager {
    constructor() {
        console.log('[StateManager] 初期化');
        
        this.state = {
            // 接続状態
            isConnected: false,
            isTranslating: false,
            
            // 設定
            settings: null,
            
            // 認識・合成インスタンス
            recognizer: null,
            synthesizer: null,
            
            // 統計情報
            stats: {
                recognizedCount: 0,
                translatedCount: 0,
                synthesizedCount: 0,
                errorCount: 0
            },
            
            // 現在の処理状態
            currentRecognition: null,
            currentTranslation: null,
            currentSynthesis: null
        };
        
        // 状態変更リスナー
        this.listeners = {};
    }

    /**
     * 状態を取得
     * @param {string} key - 取得するキー（省略時は全体）
     * @returns {*} - 状態値
     */
    getState(key) {
        if (key) {
            const value = this.state[key];
            console.log(`[StateManager] 状態取得: ${key} =`, value);
            return value;
        }
        console.log('[StateManager] 全状態を取得');
        return { ...this.state };
    }

    /**
     * 状態を設定
     * @param {string} key - 設定するキー
     * @param {*} value - 設定する値
     */
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        console.log(`[StateManager] 状態更新: ${key} =`, value, '（旧値:', oldValue, '）');
        
        // リスナーに通知
        this.notifyListeners(key, value, oldValue);
    }

    /**
     * 設定を更新
     * @param {Object} settings - 新しい設定
     */
    updateSettings(settings) {
        console.log('[StateManager] 設定を更新');
        this.setState('settings', settings);
    }

    /**
     * 接続状態を設定
     * @param {boolean} connected - 接続状態
     */
    setConnected(connected) {
        console.log(`[StateManager] 接続状態: ${connected}`);
        this.setState('isConnected', connected);
    }

    /**
     * 翻訳状態を設定
     * @param {boolean} translating - 翻訳中かどうか
     */
    setTranslating(translating) {
        console.log(`[StateManager] 翻訳状態: ${translating}`);
        this.setState('isTranslating', translating);
    }

    /**
     * Recognizer を設定
     * @param {*} recognizer - Speech SDK の Recognizer
     */
    setRecognizer(recognizer) {
        console.log('[StateManager] Recognizer を設定');
        this.setState('recognizer', recognizer);
    }

    /**
     * Synthesizer を設定
     * @param {*} synthesizer - Speech SDK の Synthesizer
     */
    setSynthesizer(synthesizer) {
        console.log('[StateManager] Synthesizer を設定');
        this.setState('synthesizer', synthesizer);
    }

    /**
     * 統計をインクリメント
     * @param {string} type - 統計タイプ (recognized, translated, synthesized, error)
     */
    incrementStat(type) {
        const key = `${type}Count`;
        if (this.state.stats[key] !== undefined) {
            this.state.stats[key]++;
            console.log(`[StateManager] 統計更新: ${type} = ${this.state.stats[key]}`);
            this.notifyListeners('stats', this.state.stats);
        }
    }

    /**
     * 統計をリセット
     */
    resetStats() {
        console.log('[StateManager] 統計をリセット');
        this.state.stats = {
            recognizedCount: 0,
            translatedCount: 0,
            synthesizedCount: 0,
            errorCount: 0
        };
        this.notifyListeners('stats', this.state.stats);
    }

    /**
     * 現在の認識テキストを設定
     * @param {string} text - 認識されたテキスト
     */
    setCurrentRecognition(text) {
        console.log('[StateManager] 現在の認識:', text);
        this.setState('currentRecognition', text);
    }

    /**
     * 現在の翻訳テキストを設定
     * @param {string} text - 翻訳されたテキスト
     */
    setCurrentTranslation(text) {
        console.log('[StateManager] 現在の翻訳:', text);
        this.setState('currentTranslation', text);
    }

    /**
     * リスナーを追加
     * @param {string} key - 監視する状態のキー
     * @param {Function} callback - 変更時に呼ばれる関数
     */
    addListener(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
        console.log(`[StateManager] リスナー追加: ${key} (合計: ${this.listeners[key].length})`);
    }

    /**
     * リスナーを削除
     * @param {string} key - 監視する状態のキー
     * @param {Function} callback - 削除する関数
     */
    removeListener(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
            console.log(`[StateManager] リスナー削除: ${key} (残り: ${this.listeners[key].length})`);
        }
    }

    /**
     * リスナーに通知
     * @param {string} key - 変更された状態のキー
     * @param {*} newValue - 新しい値
     * @param {*} oldValue - 古い値
     */
    notifyListeners(key, newValue, oldValue) {
        if (this.listeners[key]) {
            console.log(`[StateManager] リスナーに通知: ${key} (${this.listeners[key].length}件)`);
            this.listeners[key].forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`[StateManager] リスナーエラー (${key}):`, error);
                }
            });
        }
    }

    /**
     * 状態をリセット
     */
    reset() {
        console.log('[StateManager] 状態をリセット');
        
        // Recognizer と Synthesizer をクリーンアップ
        if (this.state.recognizer) {
            try {
                this.state.recognizer.close();
            } catch (e) {
                console.warn('[StateManager] Recognizer クローズエラー:', e);
            }
        }
        
        if (this.state.synthesizer) {
            try {
                this.state.synthesizer.close();
            } catch (e) {
                console.warn('[StateManager] Synthesizer クローズエラー:', e);
            }
        }
        
        this.state = {
            isConnected: false,
            isTranslating: false,
            settings: this.state.settings, // 設定は保持
            recognizer: null,
            synthesizer: null,
            stats: {
                recognizedCount: 0,
                translatedCount: 0,
                synthesizedCount: 0,
                errorCount: 0
            },
            currentRecognition: null,
            currentTranslation: null,
            currentSynthesis: null
        };
        
        console.log('[StateManager] リセット完了');
    }

    /**
     * デバッグ情報を出力
     */
    debug() {
        console.log('[StateManager] ===== 現在の状態 =====');
        console.log('接続状態:', this.state.isConnected);
        console.log('翻訳中:', this.state.isTranslating);
        console.log('設定:', this.state.settings);
        console.log('統計:', this.state.stats);
        console.log('Recognizer:', this.state.recognizer ? '設定済み' : '未設定');
        console.log('Synthesizer:', this.state.synthesizer ? '設定済み' : '未設定');
        console.log('リスナー数:', Object.keys(this.listeners).map(k => `${k}: ${this.listeners[k].length}`));
        console.log('[StateManager] ========================');
    }
}

// グローバルインスタンスを作成
window.stateManager = new StateManager();
console.log('[StateManager] グローバルインスタンス作成完了');
