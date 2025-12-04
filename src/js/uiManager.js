/**
 * UIManager - ユーザーインターフェース管理
 * DOM操作とUI更新を担当
 */

class UIManager {
    constructor() {
        console.log('[UIManager] 初期化');
        
        // DOM要素の参照
        this.elements = {
            // コントロール
            targetLanguage: document.getElementById('targetLanguage'),
            startStopBtn: document.getElementById('startStopBtn'),
            btnText: document.getElementById('btnText'),
            statusDisplay: document.getElementById('statusDisplay'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            
            // チャット
            chatContainer: document.getElementById('chatContainer'),
            
            // 設定モーダル
            settingsModal: document.getElementById('settingsModal'),
            settingsBtn: document.getElementById('settingsBtn'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            subscriptionKey: document.getElementById('subscriptionKey'),
            serviceRegion: document.getElementById('serviceRegion'),
            personalVoiceId: document.getElementById('personalVoiceId'),
            voiceName: document.getElementById('voiceName'),
            sourceLanguage: document.getElementById('sourceLanguage'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            clearSettingsBtn: document.getElementById('clearSettingsBtn'),
            
            // その他
            loadingOverlay: document.getElementById('loadingOverlay')
        };
        
        console.log('[UIManager] DOM要素の参照を取得完了');
    }

    /**
     * ステータスを更新
     * @param {string} status - ステータステキスト
     * @param {string} color - インジケーターの色 (gray, green, yellow, red)
     */
    updateStatus(status, color = 'gray') {
        console.log(`[UIManager] ステータス更新: ${status} (${color})`);
        
        this.elements.statusText.textContent = status;
        
        // インジケーターの色を設定
        const colors = {
            gray: 'bg-gray-400',
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            red: 'bg-red-500'
        };
        
        // 既存の色クラスを削除
        Object.values(colors).forEach(c => {
            this.elements.statusIndicator.classList.remove(c);
        });
        
        // 新しい色クラスを追加
        this.elements.statusIndicator.classList.add(colors[color] || colors.gray);
        
        // アクティブ時はパルスアニメーション
        if (color === 'green' || color === 'yellow') {
            this.elements.statusIndicator.classList.add('status-active');
        } else {
            this.elements.statusIndicator.classList.remove('status-active');
        }
    }

    /**
     * ボタンの状態を更新
     * @param {boolean} isTranslating - 翻訳中かどうか
     * @param {boolean} isEnabled - ボタンが有効かどうか
     */
    updateButton(isTranslating, isEnabled = true) {
        console.log(`[UIManager] ボタン更新: 翻訳中=${isTranslating}, 有効=${isEnabled}`);
        
        this.elements.startStopBtn.disabled = !isEnabled;
        this.elements.btnText.textContent = isTranslating ? '翻訳を停止' : '翻訳を開始';
        
        if (isTranslating) {
            this.elements.startStopBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            this.elements.startStopBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            this.elements.startStopBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
            this.elements.startStopBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        }
    }

    /**
     * チャットメッセージを追加
     * @param {string} text - メッセージテキスト
     * @param {string} type - メッセージタイプ (original, translated, system, error)
     * @param {string} language - 言語コード（オプション）
     */
    addChatMessage(text, type, language = '') {
        console.log(`[UIManager] チャットメッセージ追加: type=${type}, language=${language}`);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble';
        
        const now = new Date();
        const timestamp = now.toLocaleTimeString('ja-JP');
        
        if (type === 'original') {
            messageDiv.innerHTML = `
                <div class="message-original">
                    <div class="language-label">原文 (${language})</div>
                    <div class="text-lg">${this.escapeHtml(text)}</div>
                    <div class="timestamp">${timestamp}</div>
                </div>
            `;
        } else if (type === 'translated') {
            messageDiv.innerHTML = `
                <div class="message-translated">
                    <div class="language-label">翻訳 (${language})</div>
                    <div class="text-lg">${this.escapeHtml(text)}</div>
                    <div class="timestamp">${timestamp}</div>
                </div>
            `;
        } else if (type === 'system') {
            messageDiv.innerHTML = `
                <div class="message-system">
                    ${this.escapeHtml(text)}
                </div>
            `;
        } else if (type === 'error') {
            messageDiv.innerHTML = `
                <div class="message-error">
                    ⚠️ ${this.escapeHtml(text)}
                </div>
            `;
        }
        
        this.elements.chatContainer.appendChild(messageDiv);
        
        // スムーズにスクロール
        this.scrollToBottom();
    }

    /**
     * チャットをクリア
     */
    clearChat() {
        console.log('[UIManager] チャットをクリア');
        this.elements.chatContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                <p class="text-lg">翻訳を開始すると、ここに結果が表示されます</p>
            </div>
        `;
    }

    /**
     * チャットを最下部にスクロール
     */
    scrollToBottom() {
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }

    /**
     * 設定モーダルを表示
     */
    showSettingsModal() {
        console.log('[UIManager] 設定モーダルを表示');
        this.elements.settingsModal.classList.remove('hidden');
        this.elements.settingsModal.classList.add('show');
    }

    /**
     * 設定モーダルを非表示
     */
    hideSettingsModal() {
        console.log('[UIManager] 設定モーダルを非表示');
        this.elements.settingsModal.classList.add('hidden');
        this.elements.settingsModal.classList.remove('show');
    }

    /**
     * 設定フォームに値を設定
     * @param {Object} settings - 設定オブジェクト
     */
    populateSettings(settings) {
        console.log('[UIManager] 設定フォームに値を設定');
        
        if (!settings) return;
        
        if (settings.subscriptionKey) this.elements.subscriptionKey.value = settings.subscriptionKey;
        if (settings.serviceRegion) this.elements.serviceRegion.value = settings.serviceRegion;
        if (settings.personalVoiceId) this.elements.personalVoiceId.value = settings.personalVoiceId;
        if (settings.voiceName) this.elements.voiceName.value = settings.voiceName;
        if (settings.sourceLanguage) this.elements.sourceLanguage.value = settings.sourceLanguage;
        if (settings.targetLanguage) this.elements.targetLanguage.value = settings.targetLanguage;
    }

    /**
     * 設定フォームから値を取得
     * @returns {Object} 設定オブジェクト
     */
    getSettingsFromForm() {
        console.log('[UIManager] 設定フォームから値を取得');
        
        return {
            subscriptionKey: this.elements.subscriptionKey.value.trim(),
            serviceRegion: this.elements.serviceRegion.value.trim(),
            personalVoiceId: this.elements.personalVoiceId.value.trim(),
            voiceName: this.elements.voiceName.value.trim(),
            sourceLanguage: this.elements.sourceLanguage.value,
            targetLanguage: this.elements.targetLanguage.value
        };
    }

    /**
     * 設定フォームをクリア
     */
    clearSettingsForm() {
        console.log('[UIManager] 設定フォームをクリア');
        
        this.elements.subscriptionKey.value = '';
        this.elements.serviceRegion.value = '';
        this.elements.personalVoiceId.value = '';
        this.elements.voiceName.value = 'ja-JP-NanamiNeural';
        this.elements.sourceLanguage.value = 'ja-JP';
        this.elements.targetLanguage.value = 'en-US';
    }

    /**
     * ローディングオーバーレイを表示
     */
    showLoading() {
        console.log('[UIManager] ローディング表示');
        this.elements.loadingOverlay.classList.remove('hidden');
        this.elements.loadingOverlay.classList.add('show');
    }

    /**
     * ローディングオーバーレイを非表示
     */
    hideLoading() {
        console.log('[UIManager] ローディング非表示');
        this.elements.loadingOverlay.classList.add('hidden');
        this.elements.loadingOverlay.classList.remove('show');
    }

    /**
     * アラートを表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ (info, success, warning, error)
     */
    showAlert(message, type = 'info') {
        console.log(`[UIManager] アラート表示: ${type} - ${message}`);
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        alert(`${icons[type] || ''} ${message}`);
    }

    /**
     * 確認ダイアログを表示
     * @param {string} message - メッセージ
     * @returns {boolean} ユーザーの選択
     */
    showConfirm(message) {
        console.log(`[UIManager] 確認ダイアログ表示: ${message}`);
        return confirm(message);
    }

    /**
     * HTMLエスケープ（XSS対策）
     * @param {string} text - エスケープするテキスト
     * @returns {string} エスケープされたテキスト
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 言語コードを日本語名に変換
     * @param {string} code - 言語コード
     * @returns {string} 日本語名
     */
    getLanguageName(code) {
        const names = {
            'ja-JP': '日本語',
            'en-US': '英語',
            'zh-CN': '中国語',
            'ko-KR': '韓国語',
            'es-ES': 'スペイン語',
            'fr-FR': 'フランス語',
            'de-DE': 'ドイツ語',
            'it-IT': 'イタリア語',
            'pt-BR': 'ポルトガル語',
            'ru-RU': 'ロシア語'
        };
        return names[code] || code;
    }

    /**
     * 初期化完了メッセージを表示
     */
    showInitializedMessage() {
        console.log('[UIManager] 初期化完了メッセージを表示');
        this.addChatMessage('アプリケーションが初期化されました。設定を確認して翻訳を開始してください。', 'system');
    }

    /**
     * 翻訳開始メッセージを表示
     * @param {string} sourceLanguage - 元の言語
     * @param {string} targetLanguage - 翻訳先言語
     */
    showTranslationStartMessage(sourceLanguage, targetLanguage) {
        const sourceName = this.getLanguageName(sourceLanguage);
        const targetName = this.getLanguageName(targetLanguage);
        const message = `翻訳を開始しました (${sourceName} → ${targetName})`;
        console.log(`[UIManager] ${message}`);
        this.addChatMessage(message, 'system');
    }

    /**
     * 翻訳停止メッセージを表示
     */
    showTranslationStopMessage() {
        console.log('[UIManager] 翻訳停止メッセージを表示');
        this.addChatMessage('翻訳を停止しました。', 'system');
    }
}

// グローバルインスタンスを作成
window.uiManager = new UIManager();
console.log('[UIManager] グローバルインスタンス作成完了');
