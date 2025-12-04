/**
 * SpeechRecognitionService - 音声認識・翻訳サービス
 * Azure Speech Service を使用した音声認識と翻訳
 */

class SpeechRecognitionService {
    constructor() {
        console.log('[SpeechRecognition] 初期化');
        this.recognizer = null;
        this.isRecognizing = false;
    }

    /**
     * 言語コードからターゲット言語コードを抽出
     * @param {string} languageCode - 完全な言語コード（例: 'en-US'）
     * @returns {string} ターゲット言語コード（例: 'en'）
     */
    extractTargetLanguage(languageCode) {
        if (!languageCode || typeof languageCode !== 'string') {
            console.warn('[SpeechRecognition] 無効な言語コード:', languageCode);
            return 'en'; // デフォルト
        }
        
        const parts = languageCode.split('-');
        return parts[0];
    }

    /**
     * 音声認識を初期化
     * @param {Object} settings - 設定オブジェクト
     * @returns {Promise<boolean>} 初期化成功時 true
     */
    async initialize(settings) {
        try {
            console.log('[SpeechRecognition] 初期化開始');
            
            if (!settings.subscriptionKey || !settings.serviceRegion) {
                throw new Error('サブスクリプションキーまたはリージョンが設定されていません');
            }

            // Speech SDK の名前空間を確認
            if (typeof SpeechSDK === 'undefined') {
                throw new Error('Azure Speech SDK が読み込まれていません');
            }

            console.log('[SpeechRecognition] Speech SDK 確認完了');

            // Speech Config を作成
            const speechConfig = SpeechSDK.SpeechTranslationConfig.fromSubscription(
                settings.subscriptionKey,
                settings.serviceRegion
            );

            // 認識元言語を設定
            speechConfig.speechRecognitionLanguage = settings.sourceLanguage;
            console.log('[SpeechRecognition] 認識元言語:', settings.sourceLanguage);

            // 翻訳先言語を設定
            const targetLang = this.extractTargetLanguage(settings.targetLanguage);
            speechConfig.addTargetLanguage(targetLang);
            console.log('[SpeechRecognition] 翻訳先言語:', targetLang);

            // 詳細な出力を有効化
            speechConfig.setProperty(
                SpeechSDK.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueDictation,
                "true"
            );

            // マイク入力を設定
            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
            console.log('[SpeechRecognition] マイク入力設定完了');

            // Translation Recognizer を作成
            this.recognizer = new SpeechSDK.TranslationRecognizer(speechConfig, audioConfig);
            console.log('[SpeechRecognition] TranslationRecognizer 作成完了');

            // イベントハンドラーを設定
            this.setupEventHandlers(targetLang);

            // StateManager に保存
            window.stateManager.setRecognizer(this.recognizer);

            console.log('[SpeechRecognition] 初期化成功');
            return true;

        } catch (error) {
            console.error('[SpeechRecognition] 初期化エラー:', error);
            window.uiManager.addChatMessage(`初期化エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * イベントハンドラーを設定
     * @param {string} targetLang - 翻訳先言語コード
     */
    setupEventHandlers(targetLang) {
        console.log('[SpeechRecognition] イベントハンドラー設定開始');

        // 認識中イベント
        this.recognizer.recognizing = (s, e) => {
            console.log('[SpeechRecognition] 認識中:', e.result.text);
            
            if (e.result.reason === SpeechSDK.ResultReason.TranslatingSpeech) {
                const originalText = e.result.text;
                const translatedText = e.result.translations.get(targetLang);
                
                console.log('[SpeechRecognition] 原文:', originalText);
                console.log('[SpeechRecognition] 翻訳:', translatedText);
                
                // 状態を更新
                window.stateManager.setCurrentRecognition(originalText);
                window.stateManager.setCurrentTranslation(translatedText);
            }
        };

        // 認識完了イベント
        this.recognizer.recognized = (s, e) => {
            console.log('[SpeechRecognition] 認識完了:', e.result.reason);

            if (e.result.reason === SpeechSDK.ResultReason.TranslatedSpeech) {
                const originalText = e.result.text;
                const translatedText = e.result.translations.get(targetLang);
                
                console.log('[SpeechRecognition] 最終原文:', originalText);
                console.log('[SpeechRecognition] 最終翻訳:', translatedText);
                
                if (originalText && translatedText) {
                    // UIに表示
                    const settings = window.stateManager.getState('settings');
                    window.uiManager.addChatMessage(
                        originalText,
                        'original',
                        settings.sourceLanguage
                    );
                    window.uiManager.addChatMessage(
                        translatedText,
                        'translated',
                        settings.targetLanguage
                    );

                    // 統計を更新
                    window.stateManager.incrementStat('recognized');
                    window.stateManager.incrementStat('translated');

                    // 音声合成を呼び出し
                    if (window.speechSynthesisService) {
                        window.speechSynthesisService.synthesize(translatedText)
                            .catch(err => {
                                console.error('[SpeechRecognition] 音声合成エラー:', err);
                                window.uiManager.addChatMessage(
                                    `音声合成エラー: ${err.message}`,
                                    'error'
                                );
                            });
                    }
                }
            } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
                console.log('[SpeechRecognition] 音声を認識できませんでした');
                const details = SpeechSDK.NoMatchDetails.fromResult(e.result);
                console.log('[SpeechRecognition] NoMatch詳細:', details.reason);
            }
        };

        // キャンセルイベント
        this.recognizer.canceled = (s, e) => {
            console.error('[SpeechRecognition] キャンセル:', e.reason);
            
            if (e.reason === SpeechSDK.CancellationReason.Error) {
                console.error('[SpeechRecognition] エラーコード:', e.errorCode);
                console.error('[SpeechRecognition] エラー詳細:', e.errorDetails);
                
                window.uiManager.addChatMessage(
                    `認識エラー: ${e.errorDetails}`,
                    'error'
                );
                window.stateManager.incrementStat('error');
            }

            this.stop();
        };

        // セッション開始イベント
        this.recognizer.sessionStarted = (s, e) => {
            console.log('[SpeechRecognition] セッション開始:', e.sessionId);
        };

        // セッション停止イベント
        this.recognizer.sessionStopped = (s, e) => {
            console.log('[SpeechRecognition] セッション停止:', e.sessionId);
            this.isRecognizing = false;
        };

        console.log('[SpeechRecognition] イベントハンドラー設定完了');
    }

    /**
     * 音声認識を開始
     * @returns {Promise<void>}
     */
    async start() {
        try {
            console.log('[SpeechRecognition] 認識開始');

            if (!this.recognizer) {
                throw new Error('Recognizer が初期化されていません');
            }

            if (this.isRecognizing) {
                console.warn('[SpeechRecognition] すでに認識中です');
                return;
            }

            // マイク権限の確認
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log('[SpeechRecognition] マイク権限を確認');
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                console.log('[SpeechRecognition] マイク権限確認完了');
            }

            // 継続的な認識を開始
            this.recognizer.startContinuousRecognitionAsync(
                () => {
                    console.log('[SpeechRecognition] 継続認識開始成功');
                    this.isRecognizing = true;
                    window.stateManager.setTranslating(true);
                    window.uiManager.updateStatus('翻訳中...', 'green');
                    window.uiManager.updateButton(true, true);
                },
                (err) => {
                    console.error('[SpeechRecognition] 認識開始エラー:', err);
                    window.uiManager.addChatMessage(`認識開始エラー: ${err}`, 'error');
                    window.stateManager.incrementStat('error');
                    this.isRecognizing = false;
                }
            );

        } catch (error) {
            console.error('[SpeechRecognition] 開始エラー:', error);
            window.uiManager.addChatMessage(`エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * 音声認識を停止
     * @returns {Promise<void>}
     */
    async stop() {
        try {
            console.log('[SpeechRecognition] 認識停止');

            if (!this.recognizer) {
                console.warn('[SpeechRecognition] Recognizer が存在しません');
                return;
            }

            if (!this.isRecognizing) {
                console.warn('[SpeechRecognition] 認識中ではありません');
                return;
            }

            this.recognizer.stopContinuousRecognitionAsync(
                () => {
                    console.log('[SpeechRecognition] 継続認識停止成功');
                    this.isRecognizing = false;
                    window.stateManager.setTranslating(false);
                    window.uiManager.updateStatus('準備完了', 'gray');
                    window.uiManager.updateButton(false, true);
                    window.uiManager.showTranslationStopMessage();
                },
                (err) => {
                    console.error('[SpeechRecognition] 認識停止エラー:', err);
                    this.isRecognizing = false;
                }
            );

        } catch (error) {
            console.error('[SpeechRecognition] 停止エラー:', error);
            this.isRecognizing = false;
        }
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        console.log('[SpeechRecognition] クリーンアップ');

        if (this.recognizer) {
            try {
                if (this.isRecognizing) {
                    this.recognizer.stopContinuousRecognitionAsync();
                }
                this.recognizer.close();
                this.recognizer = null;
            } catch (error) {
                console.error('[SpeechRecognition] クリーンアップエラー:', error);
            }
        }

        this.isRecognizing = false;
        console.log('[SpeechRecognition] クリーンアップ完了');
    }

    /**
     * 認識状態を取得
     * @returns {boolean} 認識中の場合 true
     */
    isActive() {
        return this.isRecognizing;
    }
}

// グローバルインスタンスを作成
window.speechRecognitionService = new SpeechRecognitionService();
console.log('[SpeechRecognition] グローバルインスタンス作成完了');
