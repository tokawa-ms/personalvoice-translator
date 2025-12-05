# バグフィックス報告書: Personal Voice 使用時の翻訳機能不具合の修正

**日付**: 2025年12月4日  
**バージョン**: 1.0.3  
**担当**: GitHub Copilot Agent  
**Issue**: Personal Voice を使うときに翻訳が行われていない

---

## 問題の概要

Personal Voice の Speaker Profile ID を設定した状態で翻訳先言語を選択しても、翻訳が実行されず、元の言語のままで音声合成されるバグが発生していました。

### 症状

1. Personal Voice ID を設定する
2. 翻訳先言語（例: 英語）を選択する
3. 音声入力を開始する（例: 日本語で話す）
4. **期待される動作**: 日本語が英語に翻訳され、Personal Voice で英語が再生される
5. **実際の動作**: 翻訳が行われず、日本語のままで Personal Voice が再生される

### 影響範囲

- Personal Voice を使用している全てのユーザーが影響を受ける
- 標準音声を使用している場合は影響なし（正常に動作していた）

---

## 根本原因の分析

### 問題の核心

翻訳先言語を変更した際、**音声合成サービスのみが再初期化**され、**音声認識サービスが再初期化されていなかった**ことが原因です。

### 詳細な技術分析

#### 1. Azure Speech SDK のアーキテクチャ

Azure Speech Service では、以下の2つのサービスが独立して動作します：

1. **TranslationRecognizer（音声認識・翻訳サービス）**
   - 音声を認識してテキスト化
   - 認識されたテキストを指定された言語に翻訳
   - 翻訳先言語は `SpeechTranslationConfig.addTargetLanguage()` で設定

2. **SpeechSynthesizer（音声合成サービス）**
   - テキストを音声に変換
   - Personal Voice や標準音声を使用
   - 音声の言語は `speechSynthesisVoiceName` や SSML の `xml:lang` で指定

#### 2. 初期化時の動作

アプリケーション起動時や設定保存時には、両方のサービスが正しく初期化されていました：

```javascript
// src/js/app.js - initializeServices メソッド
async initializeServices(settings) {
    // 音声認識サービスを初期化（翻訳先言語を設定）
    await window.speechRecognitionService.initialize(settings);
    
    // 音声合成サービスを初期化（音声名を設定）
    await window.speechSynthesisService.initialize(settings);
}
```

この時点では、`settings.targetLanguage` が正しく両方のサービスに反映されます。

#### 3. 翻訳先言語変更時の問題

**修正前のコード** (`src/js/app.js` の翻訳先言語変更イベントハンドラー):

```javascript
// 翻訳先言語の変更
window.uiManager.elements.targetLanguage.addEventListener('change', async (e) => {
    console.log('[AppController] 翻訳先言語変更:', e.target.value);
    const settings = window.stateManager.getState('settings');
    if (settings) {
        settings.targetLanguage = e.target.value;
        window.storageManager.updateSetting('targetLanguage', e.target.value);
        window.stateManager.updateSettings(settings);
        
        // 音声合成サービスを再初期化して、新しい言語の音声を使用
        if (window.stateManager.getState('isConnected')) {
            console.log('[AppController] 翻訳先言語変更により音声合成サービスを再初期化');
            try {
                await window.speechSynthesisService.initialize(settings);  // ⚠️ 音声合成のみ
                console.log('[AppController] 音声合成サービス再初期化完了');
            } catch (error) {
                console.error('[AppController] 音声合成サービス再初期化エラー:', error);
            }
        }
    }
});
```

この実装では、翻訳先言語を変更しても：
- ✅ `speechSynthesisService` は再初期化される → 新しい言語の音声が使用される
- ❌ `speechRecognitionService` は再初期化されない → 翻訳先言語が更新されない

#### 4. TranslationRecognizer の動作

`TranslationRecognizer` は初期化時に設定された翻訳先言語を保持し続けます：

```javascript
// src/js/speechRecognition.js - initialize メソッド
const targetLang = this.extractTargetLanguage(settings.targetLanguage);
speechConfig.addTargetLanguage(targetLang);  // 初期化時のみ設定される
```

このため、翻訳先言語を変更しても、`TranslationRecognizer` は最初に設定された言語にしか翻訳しません。

#### 5. なぜ標準音声では問題が顕在化しなかったのか

標準音声を使用している場合、以下の理由で問題が見つかりにくかった可能性があります：

1. **音声合成サービスは正しく動作していた**
   - 翻訳結果（間違った言語）を受け取っても、設定された言語の音声で読み上げる
   - 例: 日本語のテキストを英語の音声で読み上げる（不自然だが動作する）

2. **Personal Voice の特性**
   - Personal Voice は話者特性を保持しながら多言語対応
   - 翻訳が行われていないことがより明確に分かる
   - 例: 日本語のままで Personal Voice の英語モードで読み上げ → 明らかにおかしい

---

## 修正内容

### コード変更

**ファイル**: `src/js/app.js`

**修正後のコード**:

```javascript
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
                // 音声認識サービスを再初期化（翻訳先言語を更新）
                await window.speechRecognitionService.initialize(settings);
                console.log('[AppController] 音声認識サービス再初期化完了');
                
                // 音声合成サービスを再初期化（新しい言語の音声を使用）
                await window.speechSynthesisService.initialize(settings);
                console.log('[AppController] 音声合成サービス再初期化完了');
            } catch (error) {
                console.error('[AppController] サービス再初期化エラー:', error);
                window.uiManager.showAlert(`サービス再初期化エラー: ${error.message}`, 'error');
            }
        }
    }
});
```

### 変更点のまとめ

| 項目 | 修正前 | 修正後 |
|-----|--------|--------|
| 音声認識サービス再初期化 | ❌ なし | ✅ あり |
| 音声合成サービス再初期化 | ✅ あり | ✅ あり |
| エラー時のユーザー通知 | ❌ コンソールログのみ | ✅ アラート表示あり |
| コメントの詳細度 | 簡潔 | 詳細（理由を説明） |

---

## 修正の効果

### 修正前

```
1. ユーザー: 翻訳先言語を「英語」に変更
2. システム: 音声合成サービスのみ再初期化
3. ユーザー: 日本語で話す「こんにちは」
4. 音声認識: 日本語を認識 → ❌ 日本語のまま（翻訳されない）
5. 音声合成: 日本語のテキスト「こんにちは」を Personal Voice で再生
6. 結果: ❌ 翻訳が行われない
```

### 修正後

```
1. ユーザー: 翻訳先言語を「英語」に変更
2. システム: 音声認識・合成サービスを両方再初期化
3. ユーザー: 日本語で話す「こんにちは」
4. 音声認識: 日本語を認識 → ✅ 英語に翻訳「Hello」
5. 音声合成: 英語のテキスト「Hello」を Personal Voice で再生
6. 結果: ✅ 正しく翻訳される
```

---

## テスト方法

### 前提条件

- Azure Speech Service のサブスクリプションキーとリージョン
- Personal Voice の Speaker Profile ID（オプションだが推奨）

### テストシナリオ 1: Personal Voice での多言語翻訳（主要シナリオ）

**手順**:

1. アプリケーションを開く
2. 設定画面で以下を入力:
   - Subscription Key: (あなたのキー)
   - Service Region: (例: japaneast)
   - Personal Voice ID: (あなたの Speaker Profile ID)
   - 認識元言語: 日本語 (ja-JP)
3. 「保存」をクリック
4. 翻訳先言語を「英語 (en-US)」に設定
5. 「開始」ボタンをクリック
6. 日本語で話す（例: "こんにちは、今日はいい天気ですね"）

**期待される結果**:
- ✅ 画面に原文が表示される: "こんにちは、今日はいい天気ですね"
- ✅ 画面に英語の翻訳が表示される: "Hello, it's a nice day today"
- ✅ Personal Voice で英語の音声が再生される
- ✅ コンソールに以下のログが表示される:
  ```
  [SpeechRecognition] 認識完了: TranslatedSpeech
  [SpeechRecognition] 最終原文: こんにちは、今日はいい天気ですね
  [SpeechRecognition] 最終翻訳: Hello, it's a nice day today
  [SpeechSynthesis] Personal Voice 用 SSML - ベース音声: DragonLatestNeural
  ```

**手順（続き）**:

7. 「停止」ボタンをクリック
8. 翻訳先言語を「中国語 (zh-CN)」に変更
9. 「開始」ボタンをクリック
10. 再度日本語で話す（例: "おはようございます"）

**期待される結果**:
- ✅ 画面に原文が表示される: "おはようございます"
- ✅ 画面に中国語の翻訳が表示される: "早上好"
- ✅ Personal Voice で中国語の音声が再生される
- ✅ コンソールに以下のログが表示される:
  ```
  [AppController] 翻訳先言語変更: zh-CN
  [AppController] 翻訳先言語変更により音声認識・合成サービスを再初期化
  [AppController] 音声認識サービス再初期化完了
  [AppController] 音声合成サービス再初期化完了
  [SpeechRecognition] 翻訳先言語: zh
  ```

### テストシナリオ 2: 標準音声での多言語翻訳

**手順**:

1. 設定画面で Personal Voice ID を空にする
2. 「保存」をクリック
3. 翻訳先言語を「英語 (en-US)」に設定
4. 「開始」ボタンをクリック
5. 日本語で話す

**期待される結果**:
- ✅ 英語に正しく翻訳される
- ✅ 標準の英語音声（JennyNeural）で再生される

**手順（続き）**:

6. 翻訳先言語を「フランス語 (fr-FR)」に変更
7. 日本語で話す

**期待される結果**:
- ✅ フランス語に正しく翻訳される
- ✅ 標準のフランス語音声（DeniseNeural）で再生される
- ✅ 言語変更のたびにサービスが再初期化される

### テストシナリオ 3: エラーハンドリング

**手順**:

1. 翻訳中（認識中）に翻訳先言語を変更する

**期待される結果**:
- ⚠️ 現在の認識が停止される（cleanup が実行される）
- ✅ サービスが再初期化される
- ✅ エラーが発生した場合、ユーザーにアラートが表示される

---

## パフォーマンスへの影響

### 再初期化のコスト

翻訳先言語を変更するたびに、両方のサービスが再初期化されます：

- **音声認識サービス**: `TranslationRecognizer` の再作成
- **音声合成サービス**: `SpeechSynthesizer` の再作成

### 最適化の検討

現時点では、以下の理由から最適化は不要と判断：

1. **変更頻度が低い**
   - ユーザーが翻訳先言語を頻繁に変更することは稀
   - 通常は1回のセッションで1つの言語を使用

2. **再初期化時間が短い**
   - Azure Speech SDK の初期化は数百ミリ秒程度
   - ユーザー体験に大きな影響なし

3. **コードの明確性**
   - 両方のサービスを再初期化することで、状態の一貫性が保証される
   - デバッグやメンテナンスが容易

**将来的な最適化案**:
- 翻訳中でない場合のみ再初期化を実行
- 認識中の場合は、停止後に自動的に再初期化
- バックグラウンドでの事前初期化

---

## 関連する潜在的な問題

この修正により、以下の関連する問題も予防できます：

### 1. 認識元言語の変更

現在、認識元言語の変更も同様に設定画面からのみ可能ですが、将来的にメイン画面で変更可能になった場合も、同じパターンで対応できます。

### 2. Personal Voice ID の変更

Personal Voice ID を変更した際も、音声合成サービスの再初期化が必要です。現在は設定保存時に `initializeServices` が呼ばれるため問題ありませんが、動的に変更する場合は注意が必要です。

### 3. リージョンやサブスクリプションキーの変更

これらの変更は設定保存時に `initializeServices` が実行されるため、問題ありません。

---

## ドキュメントとコミュニケーション

### ユーザーへの通知

**リリースノート**:

```markdown
## バージョン 1.0.3 - 2025-12-04

### バグ修正
- **Personal Voice 使用時の翻訳機能の修正**
  - Personal Voice を使用している際、翻訳先言語を変更しても翻訳が実行されない問題を修正しました
  - 翻訳先言語を変更すると、音声認識サービスと音声合成サービスの両方が自動的に再初期化されるようになりました
  - エラーハンドリングを強化し、再初期化に失敗した場合はユーザーに通知されます

### 影響を受けるユーザー
- Personal Voice を使用しているすべてのユーザー
- 翻訳先言語を頻繁に変更するユーザー

### 移行ガイド
- 特別な対応は不要です
- 翻訳先言語を変更すると、自動的に正しく動作するようになります
```

### 開発者向けドキュメント

**アーキテクチャ図**:

```
┌─────────────────────────────────────────────────────────┐
│                    AppController                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ targetLanguage.addEventListener('change')       │    │
│  │   ↓                                             │    │
│  │ 1. settings.targetLanguage を更新               │    │
│  │ 2. speechRecognitionService.initialize()  ←NEW │    │
│  │ 3. speechSynthesisService.initialize()          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
           ↓                              ↓
┌─────────────────────┐      ┌─────────────────────┐
│ SpeechRecognition   │      │ SpeechSynthesis     │
│ Service             │      │ Service             │
│                     │      │                     │
│ - TranslationConfig │      │ - SpeechConfig      │
│ - addTargetLanguage │      │ - voiceName         │
│ - TranslationReco.. │      │ - Personal Voice    │
└─────────────────────┘      └─────────────────────┘
```

---

## 今後の改善提案

### 1. ユーザーフィードバックの強化

翻訳先言語変更時に、以下のフィードバックを追加することを検討：

```javascript
// 再初期化中の表示
window.uiManager.updateStatus('言語設定を更新中...', 'yellow');
window.uiManager.showLoading();

// 完了後
window.uiManager.updateStatus('準備完了', 'green');
window.uiManager.hideLoading();
window.uiManager.showAlert('翻訳先言語を更新しました', 'success');
```

### 2. 再初期化の最適化

認識中でない場合のみ即座に再初期化し、認識中の場合は次回開始時に再初期化することで、ユーザー体験を向上：

```javascript
if (this.isTranslating) {
    // 認識を停止してから再初期化
    await this.stopTranslation();
    await this.initializeServices(settings);
} else {
    // 即座に再初期化
    await this.initializeServices(settings);
}
```

### 3. 単体テストの追加

この修正の回帰を防ぐため、以下のテストケースを追加することを推奨：

```javascript
describe('AppController - Target Language Change', () => {
    it('should reinitialize both services when target language changes', async () => {
        // テストコード
    });
    
    it('should show error alert when reinitialization fails', async () => {
        // テストコード
    });
});
```

---

## 参考リンク

### Azure Speech Service 関連
- [Translation Recognizer API](https://docs.microsoft.com/azure/cognitive-services/speech-service/how-to-translate-speech)
- [Speech Translation Configuration](https://docs.microsoft.com/azure/cognitive-services/speech-service/speech-translation)
- [Personal Voice ドキュメント](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-overview)

### 関連ドキュメント
- [バグフィックス報告書: Personal Voice 多言語対応](./BugFix-PersonalVoiceMultilingual.md)
- [技術仕様書](./techspec.md)
- [要件定義書](./RequirementsDefinition.md)

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|----------|------|---------|--------|
| 1.0.3 | 2025-12-04 | Personal Voice 使用時の翻訳機能不具合を修正 | GitHub Copilot Agent |

---

**文書の終わり**
