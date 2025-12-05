/**
 * AppController - メインアプリケーションコントローラー
 * すべてのモジュールを統合し、アプリケーション全体を制御
 */

class AppController {
    constructor() {
        console.log('[AppController] 初期化開始');
        
        this.initialized = false;
        this.isTranslating = false;
        
        console.log('[AppController] コンストラクタ完了');
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        try {
            console.log('[AppController] アプリケーション初期化');
            
            // イベントリスナーを設定
            this.setupEventListeners();
            
            // 保存された設定を読み込み
            const savedSettings = window.storageManager.loadSettings();
            
            if (savedSettings) {
                console.log('[AppController] 保存された設定を読み込み');
                window.stateManager.updateSettings(savedSettings);
                window.uiManager.populateSettings(savedSettings);
                
                // 設定が有効かチェック
                if (window.storageManager.isConfigured()) {
                    await this.initializeServices(savedSettings);
                } else {
                    console.log('[AppController] 設定が不完全です。設定を確認してください。');
                    window.uiManager.updateStatus('設定が必要です', 'yellow');
                    window.uiManager.showAlert('Azure Speech Service の設定を行ってください。', 'warning');
                    window.uiManager.showSettingsModal();
                }
            } else {
                console.log('[AppController] 保存された設定がありません');
                window.uiManager.updateStatus('設定が必要です', 'yellow');
                window.uiManager.showSettingsModal();
            }
            
            this.initialized = true;
            console.log('[AppController] 初期化完了');
            
        } catch (error) {
            console.error('[AppController] 初期化エラー:', error);
            window.uiManager.showAlert(`初期化エラー: ${error.message}`, 'error');
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        console.log('[AppController] イベントリスナー設定開始');
        
        // 設定ボタン
        window.uiManager.elements.settingsBtn.addEventListener('click', () => {
            console.log('[AppController] 設定ボタンクリック');
            window.uiManager.showSettingsModal();
        });
        
        // 設定モーダルを閉じる
        window.uiManager.elements.closeSettingsBtn.addEventListener('click', () => {
            console.log('[AppController] 設定モーダルを閉じる');
            window.uiManager.hideSettingsModal();
        });
        
        // 設定を保存
        window.uiManager.elements.saveSettingsBtn.addEventListener('click', async () => {
            await this.saveSettings();
        });
        
        // 設定をクリア
        window.uiManager.elements.clearSettingsBtn.addEventListener('click', () => {
            this.clearSettings();
        });
        
        // 開始/停止ボタン
        window.uiManager.elements.startStopBtn.addEventListener('click', async () => {
            await this.toggleTranslation();
        });
        
        // 翻訳先言語の変更
        window.uiManager.elements.targetLanguage.addEventListener('change', async (e) => {
            console.log('[AppController] 翻訳先言語変更:', e.target.value);
            const settings = window.stateManager.getState('settings');
            if (settings) {
                settings.targetLanguage = e.target.value;
                window.storageManager.updateSetting('targetLanguage', e.target.value);
                window.stateManager.updateSettings(settings);
                
                // 翻訳先言語を変更するには、音声認識サービスと音声合成サービスの両方を再初期化する必要がある
                // - 音声認識サービス: TranslationRecognizer の翻訳先言語を更新
                // - 音声合成サービス: 新しい言語の音声を使用
                if (window.stateManager.getState('isConnected')) {
                    console.log('[AppController] 翻訳先言語変更により音声認識・合成サービスを再初期化');
                    try {
                        // 翻訳中の場合は、まず停止してから再初期化
                        if (this.isTranslating) {
                            console.log('[AppController] 翻訳中のため、先に停止します');
                            await this.stopTranslation();
                        }
                        
                        // 音声認識サービスを再初期化（翻訳先言語を更新）
                        await window.speechRecognitionService.initialize(settings);
                        console.log('[AppController] 音声認識サービス再初期化完了');
                        
                        // 音声合成サービスを再初期化（新しい言語の音声を使用）
                        await window.speechSynthesisService.initialize(settings);
                        console.log('[AppController] 音声合成サービス再初期化完了');
                    } catch (error) {
                        console.error('[AppController] サービス再初期化エラー:', error);
                        
                        // エラー発生時は両方のサービスをクリーンアップして、接続状態をリセット
                        // 各クリーンアップ操作は独立して実行し、エラーが発生しても続行する
                        try {
                            window.speechRecognitionService.cleanup();
                        } catch (cleanupError) {
                            console.error('[AppController] 音声認識サービスのクリーンアップエラー:', cleanupError);
                        }
                        
                        try {
                            window.speechSynthesisService.cleanup();
                        } catch (cleanupError) {
                            console.error('[AppController] 音声合成サービスのクリーンアップエラー:', cleanupError);
                        }
                        
                        this.isTranslating = false;
                        window.stateManager.setConnected(false);
                        window.uiManager.updateStatus('再初期化エラー', 'red');
                        window.uiManager.updateButton(false, false);
                        
                        window.uiManager.showAlert(
                            `サービス再初期化エラー: ${error.message}\n設定を確認して再度保存してください。`,
                            'error'
                        );
                    }
                }
            }
        });
        
        /**
         * Note: Modal outside-click and Escape key handlers were removed.
         * Users must explicitly click the "Save" or "Close" button to dismiss the settings modal.
         * This prevents accidental loss of unsaved settings.
         */
        
        console.log('[AppController] イベントリスナー設定完了');
    }

    /**
     * 設定を保存
     */
    async saveSettings() {
        try {
            console.log('[AppController] 設定保存開始');
            window.uiManager.showLoading();
            
            const settings = window.uiManager.getSettingsFromForm();
            
            // 必須項目のチェック
            if (!settings.subscriptionKey || !settings.serviceRegion) {
                window.uiManager.showAlert('サブスクリプションキーとリージョンは必須です。', 'warning');
                window.uiManager.hideLoading();
                return;
            }
            
            // 設定を保存
            const saved = window.storageManager.saveSettings(settings);
            
            if (saved) {
                window.stateManager.updateSettings(settings);
                
                // サービスを初期化
                await this.initializeServices(settings);
                
                window.uiManager.showAlert('設定を保存しました。', 'success');
                window.uiManager.hideSettingsModal();
            } else {
                window.uiManager.showAlert('設定の保存に失敗しました。', 'error');
            }
            
            window.uiManager.hideLoading();
            
        } catch (error) {
            console.error('[AppController] 設定保存エラー:', error);
            window.uiManager.hideLoading();
            window.uiManager.showAlert(`エラー: ${error.message}`, 'error');
        }
    }

    /**
     * 設定をクリア
     */
    clearSettings() {
        console.log('[AppController] 設定クリア');
        
        const confirmed = window.uiManager.showConfirm('設定をクリアしてもよろしいですか?');
        
        if (confirmed) {
            // サービスをクリーンアップ
            this.cleanup();
            
            // ストレージをクリア
            window.storageManager.clearSettings();
            
            // UIをクリア
            window.uiManager.clearSettingsForm();
            window.uiManager.clearChat();
            window.uiManager.updateStatus('設定が必要です', 'yellow');
            window.uiManager.updateButton(false, false);
            
            // 状態をリセット
            window.stateManager.reset();
            
            window.uiManager.showAlert('設定をクリアしました。', 'info');
            console.log('[AppController] 設定クリア完了');
        }
    }

    /**
     * サービスを初期化
     * @param {Object} settings - 設定オブジェクト
     */
    async initializeServices(settings) {
        try {
            console.log('[AppController] サービス初期化開始');
            window.uiManager.showLoading();
            
            // 既存のサービスをクリーンアップ
            this.cleanup();
            
            // 音声認識サービスを初期化
            console.log('[AppController] 音声認識サービス初期化');
            await window.speechRecognitionService.initialize(settings);
            
            // 音声合成サービスを初期化
            console.log('[AppController] 音声合成サービス初期化');
            await window.speechSynthesisService.initialize(settings);
            
            window.stateManager.setConnected(true);
            window.uiManager.updateStatus('準備完了', 'green');
            window.uiManager.updateButton(false, true);
            window.uiManager.showInitializedMessage();
            
            window.uiManager.hideLoading();
            console.log('[AppController] サービス初期化完了');
            
        } catch (error) {
            console.error('[AppController] サービス初期化エラー:', error);
            window.uiManager.hideLoading();
            window.uiManager.updateStatus('初期化エラー', 'red');
            window.uiManager.updateButton(false, false);
            throw error;
        }
    }

    /**
     * 翻訳の開始/停止を切り替え
     */
    async toggleTranslation() {
        try {
            console.log('[AppController] 翻訳トグル');
            
            if (this.isTranslating) {
                // 停止
                await this.stopTranslation();
            } else {
                // 開始
                await this.startTranslation();
            }
            
        } catch (error) {
            console.error('[AppController] 翻訳トグルエラー:', error);
            window.uiManager.showAlert(`エラー: ${error.message}`, 'error');
        }
    }

    /**
     * 翻訳を開始
     */
    async startTranslation() {
        try {
            console.log('[AppController] 翻訳開始');
            
            if (!window.stateManager.getState('isConnected')) {
                throw new Error('サービスが初期化されていません');
            }
            
            const settings = window.stateManager.getState('settings');
            
            // チャットをクリア（オプション）
            // window.uiManager.clearChat();
            
            // 音声認識を開始
            await window.speechRecognitionService.start();
            
            this.isTranslating = true;
            window.uiManager.showTranslationStartMessage(
                settings.sourceLanguage,
                settings.targetLanguage
            );
            
            console.log('[AppController] 翻訳開始完了');
            
        } catch (error) {
            console.error('[AppController] 翻訳開始エラー:', error);
            throw error;
        }
    }

    /**
     * 翻訳を停止
     */
    async stopTranslation() {
        try {
            console.log('[AppController] 翻訳停止');
            
            // 音声認識を停止
            await window.speechRecognitionService.stop();
            
            this.isTranslating = false;
            
            console.log('[AppController] 翻訳停止完了');
            
        } catch (error) {
            console.error('[AppController] 翻訳停止エラー:', error);
            throw error;
        }
    }

    /**
     * リソースをクリーンアップ
     */
    async cleanup() {
        console.log('[AppController] クリーンアップ開始');
        
        try {
            // 翻訳中なら停止（完了を待つ）
            if (this.isTranslating) {
                await this.stopTranslation().catch(e => {
                    console.warn('[AppController] 停止エラー:', e);
                });
            }
            
            // サービスをクリーンアップ
            window.speechRecognitionService.cleanup();
            window.speechSynthesisService.cleanup();
            
            console.log('[AppController] クリーンアップ完了');
            
        } catch (error) {
            console.error('[AppController] クリーンアップエラー:', error);
        }
    }

    /**
     * デバッグ情報を出力
     */
    debug() {
        console.log('[AppController] ===== デバッグ情報 =====');
        console.log('初期化済み:', this.initialized);
        console.log('翻訳中:', this.isTranslating);
        window.stateManager.debug();
        window.storageManager.getStorageInfo();
        console.log('[AppController] ========================');
    }
}

// ページ読み込み時にアプリを起動
document.addEventListener('DOMContentLoaded', async () => {
    console.log('='.repeat(50));
    console.log('Personal Voice Translator - 起動');
    console.log('='.repeat(50));
    
    try {
        // グローバルなAppControllerインスタンスを作成
        window.appController = new AppController();
        
        // アプリケーションを初期化
        await window.appController.init();
        
        console.log('[App] アプリケーション起動完了');
        
    } catch (error) {
        console.error('[App] アプリケーション起動エラー:', error);
        alert(`アプリケーションの起動に失敗しました: ${error.message}`);
    }
});

// ページ終了時にクリーンアップ
window.addEventListener('beforeunload', async (event) => {
    console.log('[App] ページ終了 - クリーンアップ');
    if (window.appController) {
        await window.appController.cleanup();
    }
});

// グローバルなエラーハンドラー
window.addEventListener('error', (event) => {
    console.error('[App] グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[App] 未処理のPromise拒否:', event.reason);
});

console.log('[App] app.js 読み込み完了');
