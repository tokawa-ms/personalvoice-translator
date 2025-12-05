# 修正サマリー: Personal Voice 使用時の翻訳機能修正

**日付**: 2025年12月4日  
**Issue**: Personal Voice を使うときに翻訳が行われていない  
**修正バージョン**: 1.0.3

---

## 問題の概要

Personal Voice の Speaker Profile ID を設定した状態で翻訳先言語を変更しても、翻訳が実行されず、元の言語のままで音声合成される問題が発生していました。

### 症状
- Personal Voice ID は正しく適用される（音声特性は反映される）
- しかし、翻訳先言語を変更しても翻訳されない
- 元の言語のまま Personal Voice で再生される

---

## 根本原因

翻訳先言語を変更した際、**音声合成サービスのみが再初期化**され、**音声認識サービスが再初期化されていなかった**ため、Azure Speech SDK の `TranslationRecognizer` の翻訳先言語が更新されませんでした。

### 技術的詳細

Azure Speech Service では以下の2つのサービスが独立して動作します：

1. **TranslationRecognizer（音声認識・翻訳）**
   - 音声を認識してテキスト化
   - 認識されたテキストを指定された言語に翻訳
   - 翻訳先言語は初期化時に設定される

2. **SpeechSynthesizer（音声合成）**
   - テキストを音声に変換
   - Personal Voice や標準音声を使用

修正前は、翻訳先言語を変更しても `TranslationRecognizer` が再初期化されないため、最初に設定された言語にしか翻訳されませんでした。

---

## 修正内容

### 1. 音声認識サービスの再初期化

翻訳先言語変更時に `speechRecognitionService.initialize()` を呼び出し、`TranslationRecognizer` の翻訳先言語を更新します。

**変更ファイル**: `src/js/app.js`

```javascript
// 翻訳先言語の変更
window.uiManager.elements.targetLanguage.addEventListener('change', async (e) => {
    // ...
    
    // 音声認識サービスを再初期化（翻訳先言語を更新）
    await window.speechRecognitionService.initialize(settings);
    
    // 音声合成サービスを再初期化（新しい言語の音声を使用）
    await window.speechSynthesisService.initialize(settings);
});
```

### 2. 競合状態の防止

複数の再初期化が同時に実行されるのを防ぐため、以下を実装：

- `isReinitializing` フラグで再初期化処理を管理
- 再初期化中は言語セレクターを無効化
- 翻訳実行中の場合は先に停止してから再初期化

```javascript
if (this.isReinitializing) {
    console.warn('[AppController] 再初期化中のため、言語変更をスキップします');
    return;
}

this.isReinitializing = true;
window.uiManager.elements.targetLanguage.disabled = true;

try {
    // 翻訳中の場合は、まず停止してから再初期化
    if (this.isTranslating) {
        await this.stopTranslation();
    }
    
    // サービスを再初期化
    // ...
} finally {
    this.isReinitializing = false;
    window.uiManager.elements.targetLanguage.disabled = false;
}
```

### 3. エラーハンドリングの強化

`handleReinitializationError()` メソッドを新規作成し、エラー処理を一元化：

- 各クリーンアップ操作を個別の try-catch でラップ
- 1つの操作が失敗しても他の操作を続行
- すべての状態フラグをリセット
- UIを適切に更新
- ユーザーに詳細なエラーメッセージを表示

```javascript
handleReinitializationError(error) {
    // フラグをリセット
    this.isReinitializing = false;
    
    // 各サービスを独立してクリーンアップ
    try {
        window.speechRecognitionService.cleanup();
    } catch (cleanupError) {
        console.error('クリーンアップエラー:', cleanupError);
    }
    
    // 状態をリセット
    this.isTranslating = false;
    window.stateManager.setConnected(false);
    
    // UIを更新
    window.uiManager.updateStatus('再初期化エラー', 'red');
    
    // ユーザーに通知
    window.uiManager.showAlert(`エラー: ${error.message}`, 'error');
}
```

---

## 影響範囲

### 修正されたファイル

1. **`src/js/app.js`**
   - 翻訳先言語変更イベントハンドラーの修正
   - `handleReinitializationError()` メソッドの追加
   - `isReinitializing` フラグの追加

### 新規作成されたドキュメント

1. **`docs/BugFix-PersonalVoiceTranslationNotWorking.md`**
   - 詳細なバグレポート
   - 根本原因の分析
   - 技術的な説明

2. **`docs/TestPlan-PersonalVoiceTranslationFix.md`**
   - テスト計画書
   - 7つのテストケース
   - 手動テスト手順

---

## テスト方法

### 基本的なテストシナリオ

1. **Personal Voice での多言語翻訳**
   - Personal Voice ID を設定
   - 翻訳先言語を「英語」に設定
   - 日本語で話す
   - 英語に正しく翻訳され、Personal Voice で再生されることを確認

2. **翻訳先言語の変更**
   - 翻訳先言語を「中国語」に変更
   - 再度日本語で話す
   - 中国語に正しく翻訳されることを確認

3. **翻訳実行中の言語変更**
   - 翻訳実行中に言語を変更
   - 安全に停止して再初期化されることを確認

詳細なテスト手順は `docs/TestPlan-PersonalVoiceTranslationFix.md` を参照してください。

---

## 互換性

### 後方互換性

- ✅ **維持されています**
- Personal Voice を使用していない場合も正常に動作します
- 標準音声での翻訳にも影響ありません

### ブラウザ要件

- 変更なし（Chrome 90+, Edge 90+, Safari 14+, Firefox 88+）

---

## パフォーマンスへの影響

### 再初期化のコスト

- 翻訳先言語変更時に両サービスを再初期化（数百ミリ秒程度）
- ユーザー体験に大きな影響なし
- 通常、言語変更の頻度は低いため問題なし

### 最適化

- 再初期化中は言語セレクターを無効化（視覚的フィードバック）
- 競合状態を防止（安全性の向上）

---

## 今後の推奨事項

### 1. ユーザーフィードバックの強化

再初期化中のローディング表示を追加：

```javascript
window.uiManager.updateStatus('言語設定を更新中...', 'yellow');
window.uiManager.showLoading();
```

### 2. 単体テストの追加

回帰防止のため、以下のテストケースを追加することを推奨：

- 翻訳先言語変更時の再初期化テスト
- 競合状態のテスト
- エラーハンドリングのテスト

### 3. 言語変更のスキップ通知

再初期化中に言語変更がスキップされた場合、ユーザーに通知：

```javascript
if (this.isReinitializing) {
    window.uiManager.showAlert('再初期化中です。しばらくお待ちください。', 'info');
    return;
}
```

---

## 参考リンク

### 関連ドキュメント

- [詳細なバグレポート](./BugFix-PersonalVoiceTranslationNotWorking.md)
- [テスト計画書](./TestPlan-PersonalVoiceTranslationFix.md)
- [Personal Voice 多言語対応の修正](./BugFix-PersonalVoiceMultilingual.md)
- [技術仕様書](./techspec.md)

### Azure Speech Service

- [Translation Recognizer API](https://docs.microsoft.com/azure/cognitive-services/speech-service/how-to-translate-speech)
- [Personal Voice ドキュメント](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-overview)

---

## コミット履歴

| コミット | 説明 |
|---------|------|
| 2fc2e09 | Fix: Personal Voice translation not working - reinitialize speech recognition service on language change |
| 8412c50 | Improve error handling for service reinitialization on language change |
| fe363e7 | Add robust error handling for cleanup operations during reinitialization |
| 2666a83 | Add race condition prevention and refactor error handling |
| e0a6ef3 | Final refinements: fix constructor initialization and remove duplicate logging |

---

## まとめ

この修正により、Personal Voice を使用している場合でも、翻訳先言語を変更すると正しく翻訳が実行されるようになりました。

### 主要な改善点

✅ **翻訳先言語の正しい更新**
- 音声認識サービスも再初期化することで、TranslationRecognizer の翻訳先言語が更新される

✅ **競合状態の防止**
- 再初期化中フラグと UI の無効化により、複数の再初期化が同時に実行されるのを防止

✅ **堅牢なエラーハンドリング**
- エラー時の適切なクリーンアップと状態リセット
- ユーザーへの分かりやすいエラーメッセージ

✅ **コード品質の向上**
- エラーハンドリングの一元化
- 適切なコメントの追加
- コードの保守性向上

---

**文書の終わり**
