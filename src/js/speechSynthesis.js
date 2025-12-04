/**
 * SpeechSynthesisService - 音声合成サービス
 * Azure Speech Service を使用した音声合成（Personal Voice 対応）
 */

class SpeechSynthesisService {
    constructor() {
        console.log('[SpeechSynthesis] 初期化');
        this.synthesizer = null;
        this.isSynthesizing = false;
        this.audioQueue = [];
        
        // デフォルトのフォールバック音声
        this.DEFAULT_VOICE = 'en-US-JennyNeural';
        
        // 言語コードから音声名へのマッピング
        this.VOICE_MAP = {
            'ja-JP': 'ja-JP-NanamiNeural',
            'en-US': 'en-US-JennyNeural',
            'zh-CN': 'zh-CN-XiaoxiaoNeural',
            'ko-KR': 'ko-KR-SunHiNeural',
            'es-ES': 'es-ES-ElviraNeural',
            'fr-FR': 'fr-FR-DeniseNeural',
            'de-DE': 'de-DE-KatjaNeural',
            'it-IT': 'it-IT-ElsaNeural',
            'pt-BR': 'pt-BR-FranciscaNeural',
            'ru-RU': 'ru-RU-SvetlanaNeural'
        };
    }

    /**
     * Personal Voice ID が有効かチェック
     * @param {Object} settings - 設定オブジェクト
     * @returns {boolean} Personal Voice ID が有効な場合 true
     */
    hasValidPersonalVoiceId(settings) {
        return settings && settings.personalVoiceId && settings.personalVoiceId.trim() !== '';
    }

    /**
     * 音声合成を初期化
     * @param {Object} settings - 設定オブジェクト
     * @returns {Promise<boolean>} 初期化成功時 true
     */
    async initialize(settings) {
        try {
            console.log('[SpeechSynthesis] 初期化開始');

            if (!settings.subscriptionKey || !settings.serviceRegion) {
                throw new Error('サブスクリプションキーまたはリージョンが設定されていません');
            }

            // Speech SDK の名前空間を確認
            if (typeof SpeechSDK === 'undefined') {
                throw new Error('Azure Speech SDK が読み込まれていません');
            }

            console.log('[SpeechSynthesis] Speech SDK 確認完了');

            // Speech Config を作成
            const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
                settings.subscriptionKey,
                settings.serviceRegion
            );

            // 翻訳先言語に基づいて適切な音声名を設定
            const voiceName = this.getVoiceNameForLanguage(settings.targetLanguage, settings.voiceName);
            speechConfig.speechSynthesisVoiceName = voiceName;
            console.log('[SpeechSynthesis] 音声名:', voiceName);
            console.log('[SpeechSynthesis] 対象言語:', settings.targetLanguage);

            // Personal Voice ID が設定されている場合
            if (this.hasValidPersonalVoiceId(settings)) {
                console.log('[SpeechSynthesis] Personal Voice ID:', settings.personalVoiceId);
                // Personal Voice の設定（プロパティとして追加）
                speechConfig.setProperty(
                    'SpeechSynthesis_PersonalVoiceId',
                    settings.personalVoiceId
                );
            }

            // 音質の設定
            speechConfig.speechSynthesisOutputFormat = 
                SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

            // オーディオ出力設定（デフォルトスピーカー）
            const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
            console.log('[SpeechSynthesis] オーディオ出力設定完了');

            // Speech Synthesizer を作成
            this.synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
            console.log('[SpeechSynthesis] SpeechSynthesizer 作成完了');

            // イベントハンドラーを設定
            this.setupEventHandlers();

            // StateManager に保存
            window.stateManager.setSynthesizer(this.synthesizer);

            console.log('[SpeechSynthesis] 初期化成功');
            return true;

        } catch (error) {
            console.error('[SpeechSynthesis] 初期化エラー:', error);
            window.uiManager.addChatMessage(`音声合成初期化エラー: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * イベントハンドラーを設定
     */
    setupEventHandlers() {
        console.log('[SpeechSynthesis] イベントハンドラー設定開始');

        // 合成開始イベント
        this.synthesizer.synthesisStarted = (s, e) => {
            console.log('[SpeechSynthesis] 合成開始');
            this.isSynthesizing = true;
        };

        // 合成中イベント
        this.synthesizer.synthesizing = (s, e) => {
            console.log('[SpeechSynthesis] 合成中...');
        };

        // 合成完了イベント
        this.synthesizer.synthesisCompleted = (s, e) => {
            console.log('[SpeechSynthesis] 合成完了');
            this.isSynthesizing = false;
            window.stateManager.incrementStat('synthesized');
        };

        // キャンセルイベント
        this.synthesizer.SynthesisCanceled = (s, e) => {
            console.error('[SpeechSynthesis] キャンセル:', e.reason);
            
            if (e.reason === SpeechSDK.CancellationReason.Error) {
                console.error('[SpeechSynthesis] エラーコード:', e.errorCode);
                console.error('[SpeechSynthesis] エラー詳細:', e.errorDetails);
                
                window.uiManager.addChatMessage(
                    `音声合成エラー: ${e.errorDetails}`,
                    'error'
                );
                window.stateManager.incrementStat('error');
            }
            
            this.isSynthesizing = false;
        };

        console.log('[SpeechSynthesis] イベントハンドラー設定完了');
    }

    /**
     * テキストを音声合成
     * @param {string} text - 合成するテキスト
     * @returns {Promise<void>}
     */
    async synthesize(text) {
        try {
            console.log('[SpeechSynthesis] 合成開始:', text);

            if (!this.synthesizer) {
                throw new Error('Synthesizer が初期化されていません');
            }

            if (!text || text.trim() === '') {
                console.warn('[SpeechSynthesis] 空のテキストです');
                return;
            }

            // 既に合成中の場合はキューに追加
            if (this.isSynthesizing) {
                console.log('[SpeechSynthesis] キューに追加:', text);
                this.audioQueue.push(text);
                return;
            }

            // 設定を取得
            const settings = window.stateManager.getState('settings');
            
            // Personal Voice が設定されている場合は SSML を使用
            if (this.hasValidPersonalVoiceId(settings)) {
                console.log('[SpeechSynthesis] Personal Voice を使用して SSML で合成');
                const ssml = this.generateSSML(text, settings);
                return await this.synthesizeSSML(ssml);
            } else {
                console.log('[SpeechSynthesis] 標準音声で合成');
                return new Promise((resolve, reject) => {
                    this.synthesizer.speakTextAsync(
                        text,
                        (result) => {
                            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                                console.log('[SpeechSynthesis] 音声合成成功');
                                resolve();
                                
                                // キューに次の項目があれば処理
                                this.processQueue();
                            } else {
                                console.error('[SpeechSynthesis] 合成失敗:', result.reason);
                                reject(new Error(`音声合成失敗: ${result.reason}`));
                            }
                        },
                        (error) => {
                            console.error('[SpeechSynthesis] 合成エラー:', error);
                            reject(error);
                        }
                    );
                });
            }

        } catch (error) {
            console.error('[SpeechSynthesis] 合成エラー:', error);
            throw error;
        }
    }

    /**
     * SSML を使用して音声合成
     * @param {string} ssml - SSML テキスト
     * @returns {Promise<void>}
     */
    async synthesizeSSML(ssml) {
        try {
            console.log('[SpeechSynthesis] SSML合成開始');

            if (!this.synthesizer) {
                throw new Error('Synthesizer が初期化されていません');
            }

            return new Promise((resolve, reject) => {
                this.synthesizer.speakSsmlAsync(
                    ssml,
                    (result) => {
                        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                            console.log('[SpeechSynthesis] SSML音声合成成功');
                            resolve();
                        } else {
                            console.error('[SpeechSynthesis] SSML合成失敗:', result.reason);
                            reject(new Error(`SSML音声合成失敗: ${result.reason}`));
                        }
                    },
                    (error) => {
                        console.error('[SpeechSynthesis] SSML合成エラー:', error);
                        reject(error);
                    }
                );
            });

        } catch (error) {
            console.error('[SpeechSynthesis] SSML合成エラー:', error);
            throw error;
        }
    }

    /**
     * キューを処理
     */
    async processQueue() {
        if (this.audioQueue.length > 0) {
            console.log('[SpeechSynthesis] キューから次の項目を処理');
            const nextText = this.audioQueue.shift();
            await this.synthesize(nextText).catch(err => {
                console.error('[SpeechSynthesis] キュー処理エラー:', err);
            });
        }
    }

    /**
     * Personal Voice 用の SSML を生成
     * @param {string} text - 合成するテキスト
     * @param {Object} settings - 設定
     * @returns {string} SSML
     */
    generateSSML(text, settings) {
        // 翻訳先言語に基づいて音声名を決定
        const voiceName = this.getVoiceNameForLanguage(settings.targetLanguage, settings.voiceName);
        
        let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${settings.targetLanguage}">`;
        ssml += `<voice name="${voiceName}">`;
        
        // Personal Voice の場合は追加の属性
        if (this.hasValidPersonalVoiceId(settings)) {
            ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${settings.targetLanguage}">`;
            ssml += `<voice name="${voiceName}">`;
            ssml += `<mstts:ttsembedding speakerProfileId="${settings.personalVoiceId}">`;
            ssml += this.escapeXml(text);
            ssml += `</mstts:ttsembedding>`;
        } else {
            ssml += this.escapeXml(text);
        }
        
        ssml += `</voice>`;
        ssml += `</speak>`;
        
        console.log('[SpeechSynthesis] 生成されたSSML:', ssml);
        return ssml;
    }

    /**
     * 言語コードに基づいて適切な音声名を取得
     * @param {string} targetLanguage - 翻訳先言語コード（例: 'en-US', 'ja-JP'）
     * @param {string} customVoiceName - ユーザーが設定したカスタム音声名（オプション）
     * @returns {string} 音声名
     */
    getVoiceNameForLanguage(targetLanguage, customVoiceName) {
        console.log('[SpeechSynthesis] 音声名を取得:', targetLanguage, customVoiceName ? 'カスタム音声あり' : 'カスタム音声なし');
        
        // カスタム音声名が設定されていて、その音声名が対象言語と一致する場合は使用
        if (customVoiceName && customVoiceName.trim() !== '') {
            // 音声名が対象言語コードで始まる場合はそのまま使用
            if (customVoiceName.startsWith(targetLanguage)) {
                console.log('[SpeechSynthesis] カスタム音声名を使用');
                return customVoiceName;
            }
        }
        
        // 言語コードに基づいてデフォルト音声を選択
        const selectedVoice = this.VOICE_MAP[targetLanguage] || this.DEFAULT_VOICE;
        console.log('[SpeechSynthesis] デフォルト音声を選択:', selectedVoice);
        return selectedVoice;
    }

    /**
     * XML エスケープ
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * 音声合成をテスト
     * @param {string} text - テストテキスト
     * @returns {Promise<void>}
     */
    async test(text = 'こんにちは、これはテストです。') {
        console.log('[SpeechSynthesis] テスト開始');
        try {
            await this.synthesize(text);
            console.log('[SpeechSynthesis] テスト成功');
            return true;
        } catch (error) {
            console.error('[SpeechSynthesis] テスト失敗:', error);
            return false;
        }
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        console.log('[SpeechSynthesis] クリーンアップ');

        // キューをクリア
        this.audioQueue = [];

        if (this.synthesizer) {
            try {
                this.synthesizer.close();
                this.synthesizer = null;
            } catch (error) {
                console.error('[SpeechSynthesis] クリーンアップエラー:', error);
            }
        }

        this.isSynthesizing = false;
        console.log('[SpeechSynthesis] クリーンアップ完了');
    }

    /**
     * 合成状態を取得
     * @returns {boolean} 合成中の場合 true
     */
    isActive() {
        return this.isSynthesizing;
    }

    /**
     * キューの長さを取得
     * @returns {number} キューに残っている項目数
     */
    getQueueLength() {
        return this.audioQueue.length;
    }
}

// グローバルインスタンスを作成
window.speechSynthesisService = new SpeechSynthesisService();
console.log('[SpeechSynthesis] グローバルインスタンス作成完了');
