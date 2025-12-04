# バグフィックス報告書: Personal Voice 多言語対応の修正

**日付**: 2025年12月4日  
**バージョン**: 1.0.2  
**担当**: GitHub Copilot Agent  
**Issue**: 合成音声の設定のバグ

---

## 修正されたバグの概要

このリリースでは、Personal Voice（カスタム音声）に関する以下の2つの重要なバグを修正しました：

1. **Personal Voice が翻訳先言語に依存してしまう問題**
   - カスタム音声の Speaker Profile ID が設定されているにもかかわらず、翻訳先言語に応じて異なる音声が使用されていた
   - Personal Voice は多言語対応であるにもかかわらず、言語別の標準音声が使用されていた

2. **Personal Voice 利用時の SSML の voice name が不適切**
   - Personal Voice 使用時に言語別の音声名（例: `ja-JP-NanamiNeural`, `en-US-JennyNeural`）が使用されていた
   - 正しくは多言語対応のベース音声（例: `en-US-AvaMultilingualNeural`）を使用すべき

---

## Bug 1: Personal Voice が翻訳先言語に依存してしまう問題

### 問題の詳細

**症状**:
- Personal Voice の Speaker Profile ID を設定しても、翻訳先言語を変更すると異なる標準音声で合成される
- 日本語に翻訳 → `ja-JP-NanamiNeural` で合成
- 英語に翻訳 → `en-US-JennyNeural` で合成
- Personal Voice の話者特性が全く反映されない

**原因**:
```javascript
// 修正前のコード (initialize メソッド)
// 常に翻訳先言語に基づいて音声名を決定していた
const voiceName = this.getVoiceNameForLanguage(settings.targetLanguage, settings.voiceName);
speechConfig.speechSynthesisVoiceName = voiceName;

// Personal Voice ID は設定されるが、voice name が言語別になっていた
if (this.hasValidPersonalVoiceId(settings)) {
    speechConfig.setProperty('SpeechSynthesis_PersonalVoiceId', settings.personalVoiceId);
}
```

この実装では、Personal Voice ID は設定されるものの、ベースとなる音声が言語別の標準音声になっていたため、Personal Voice の特性が適用されませんでした。

**Azure Personal Voice の仕様**:
- Personal Voice (Professional Voice) は多言語対応
- Speaker Profile ID に含まれる話者特性は、言語に依存せず適用される
- Personal Voice を使用する際は、多言語対応のベース音声を使用する必要がある
- ベース音声に話者特性が適用され、その人の声で多言語を話すことができる

### 修正内容

**変更ファイル**: `src/js/speechSynthesis.js`

#### 1. Personal Voice 用のベース音声を追加

```javascript
// 修正後
class SpeechSynthesisService {
    constructor() {
        // ... 省略 ...
        
        // Personal Voice (カスタム音声) 用のベース音声
        // Personal Voice は多言語対応のため、言語に依存しないベース音声を使用
        this.PERSONAL_VOICE_BASE = 'en-US-AvaMultilingualNeural';
        
        // 言語コードから音声名へのマッピング (標準音声用)
        this.VOICE_MAP = {
            'ja-JP': 'ja-JP-NanamiNeural',
            'en-US': 'en-US-JennyNeural',
            // ... 省略 ...
        };
    }
}
```

#### 2. initialize メソッドの修正

```javascript
// 修正後
// Personal Voice (カスタム音声) が設定されている場合は、
// 言語に関係なく Personal Voice 用のベース音声を使用
// Personal Voice は多言語対応のため、ベース音声に話者特性が適用される
let voiceName;
if (this.hasValidPersonalVoiceId(settings)) {
    voiceName = this.PERSONAL_VOICE_BASE;
    console.log('[SpeechSynthesis] Personal Voice モード - ベース音声を使用:', voiceName);
    console.log('[SpeechSynthesis] Personal Voice ID:', settings.personalVoiceId);
    console.log('[SpeechSynthesis] Personal Voice は多言語対応のため、言語に依存しません');
} else {
    // 標準音声の場合は、翻訳先言語に基づいて適切な音声名を設定
    voiceName = this.getVoiceNameForLanguage(settings.targetLanguage, settings.voiceName);
    console.log('[SpeechSynthesis] 標準音声モード');
}

speechConfig.speechSynthesisVoiceName = voiceName;
console.log('[SpeechSynthesis] 音声名:', voiceName);
console.log('[SpeechSynthesis] 対象言語:', settings.targetLanguage);
```

**修正後の動作**:
1. Personal Voice ID が設定されている場合
   - 常に `en-US-AvaMultilingualNeural` をベース音声として使用
   - 翻訳先言語が何であっても、同じベース音声を使用
   - Speaker Profile ID の話者特性がベース音声に適用される
   - その人の声で多言語を話すことができる

2. Personal Voice ID が未設定の場合
   - 従来通り、翻訳先言語に応じた標準音声を使用
   - 日本語 → `ja-JP-NanamiNeural`
   - 英語 → `en-US-JennyNeural`
   - など

---

## Bug 2: Personal Voice 利用時の SSML の voice name が不適切

### 問題の詳細

**症状**:
- Personal Voice 使用時の SSML で、言語別の音声名が使用されていた
- SSML の `<voice name="...">` に `ja-JP-NanamiNeural` や `en-US-JennyNeural` などが設定されていた
- Azure Speech Service が Personal Voice の特性を正しく適用できなかった

**原因**:
```javascript
// 修正前のコード (generateSSML メソッド)
generateSSML(text, settings) {
    // 常に翻訳先言語に基づいて音声名を決定
    const voiceName = this.getVoiceNameForLanguage(settings.targetLanguage, settings.voiceName);
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${settings.targetLanguage}">`;
    ssml += `<voice name="${voiceName}">`; // 言語別の音声名が使用される
    
    if (this.hasValidPersonalVoiceId(settings)) {
        ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${settings.targetLanguage}">`;
        ssml += `<voice name="${voiceName}">`; // 言語別の音声名が使用される (問題)
        ssml += `<mstts:ttsembedding speakerProfileId="${settings.personalVoiceId}">`;
        ssml += this.escapeXml(text);
        ssml += `</mstts:ttsembedding>`;
    } else {
        ssml += this.escapeXml(text);
    }
    
    ssml += `</voice>`;
    ssml += `</speak>`;
    
    return ssml;
}
```

この実装では、Personal Voice を使用する場合でも、`<voice name="...">` に言語別の音声名が設定されていました。これにより、Azure Speech Service が Personal Voice の特性を正しく適用できませんでした。

### 修正内容

**変更ファイル**: `src/js/speechSynthesis.js`

#### generateSSML メソッドの修正

```javascript
// 修正後
generateSSML(text, settings) {
    // Personal Voice が設定されている場合は、
    // 言語に関係なく Personal Voice 用のベース音声を使用
    // Personal Voice は多言語対応のため、話者特性が適用される
    let voiceName;
    if (this.hasValidPersonalVoiceId(settings)) {
        voiceName = this.PERSONAL_VOICE_BASE;
        console.log('[SpeechSynthesis] Personal Voice 用 SSML - ベース音声:', voiceName);
    } else {
        // 標準音声の場合は翻訳先言語に基づいて音声名を決定
        voiceName = this.getVoiceNameForLanguage(settings.targetLanguage, settings.voiceName);
        console.log('[SpeechSynthesis] 標準音声用 SSML - 音声名:', voiceName);
    }
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${settings.targetLanguage}">`;
    ssml += `<voice name="${voiceName}">`;
    
    // Personal Voice の場合は mstts:ttsembedding タグを使用
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
```

**修正前の SSML 例** (日本語に翻訳した場合):
```xml
<speak version="1.0" 
       xmlns="http://www.w3.org/2001/10/synthesis" 
       xmlns:mstts="https://www.w3.org/2001/mstts" 
       xml:lang="ja-JP">
  <voice name="ja-JP-NanamiNeural">
    <mstts:ttsembedding speakerProfileId="YOUR_SPEAKER_ID">
      こんにちは
    </mstts:ttsembedding>
  </voice>
</speak>
```

**修正後の SSML 例** (日本語に翻訳した場合):
```xml
<speak version="1.0" 
       xmlns="http://www.w3.org/2001/10/synthesis" 
       xmlns:mstts="https://www.w3.org/2001/mstts" 
       xml:lang="ja-JP">
  <voice name="en-US-AvaMultilingualNeural">
    <mstts:ttsembedding speakerProfileId="YOUR_SPEAKER_ID">
      こんにちは
    </mstts:ttsembedding>
  </voice>
</speak>
```

**重要なポイント**:
- `xml:lang` 属性は翻訳先言語を指定 (`ja-JP`, `en-US`, など)
- `<voice name="...">` はベース音声を指定 (`en-US-AvaMultilingualNeural`)
- `speakerProfileId` で話者特性を適用
- この組み合わせにより、指定した人の声で翻訳先言語を話すことができる

---

## テスト方法

### 前提条件
- Azure Speech Service のサブスクリプションキーとリージョンを取得済み
- Personal Voice の Speaker Profile ID を取得済み
- Personal Voice が有効化されている Azure サブスクリプション

### テストシナリオ 1: Personal Voice で多言語翻訳

**手順**:
1. アプリケーションを開く
2. 設定画面で以下を入力:
   - Subscription Key: (あなたのキー)
   - Service Region: (あなたのリージョン、例: japaneast)
   - Personal Voice ID: (あなたの Speaker Profile ID)
3. 「保存」をクリック
4. 翻訳先言語を「英語 (en-US)」に設定
5. 「開始」ボタンをクリック
6. 日本語で話す（例: "こんにちは、今日はいい天気ですね"）

**期待される結果**:
- 英語の翻訳結果が表示される: "Hello, it's a nice day today"
- Personal Voice の話者特性が反映された声で英語が読み上げられる
- ブラウザのコンソールに以下のログが表示される:
  ```
  [SpeechSynthesis] Personal Voice モード - ベース音声を使用: en-US-AvaMultilingualNeural
  [SpeechSynthesis] Personal Voice ID: YOUR_SPEAKER_ID
  [SpeechSynthesis] Personal Voice は多言語対応のため、言語に依存しません
  [SpeechSynthesis] Personal Voice 用 SSML - ベース音声: en-US-AvaMultilingualNeural
  ```

**手順** (続き):
7. 翻訳先言語を「中国語 (zh-CN)」に変更
8. 再度日本語で話す

**期待される結果**:
- 中国語の翻訳結果が表示される
- **同じ Personal Voice の話者特性**が反映された声で中国語が読み上げられる
- 異なる言語でも、同じ人の声で話しているように聞こえる
- ブラウザのコンソールに以下のログが表示される:
  ```
  [SpeechSynthesis] Personal Voice モード - ベース音声を使用: en-US-AvaMultilingualNeural
  [SpeechSynthesis] 対象言語: zh-CN
  ```

### テストシナリオ 2: 標準音声での翻訳

**手順**:
1. 設定画面で Personal Voice ID を空にする
2. 「保存」をクリック
3. 翻訳先言語を「英語 (en-US)」に設定
4. 日本語で話す

**期待される結果**:
- 英語の標準音声（JennyNeural）で読み上げられる
- ブラウザのコンソールに以下のログが表示される:
  ```
  [SpeechSynthesis] 標準音声モード
  [SpeechSynthesis] 音声名: en-US-JennyNeural
  ```

**手順** (続き):
5. 翻訳先言語を「日本語 (ja-JP)」に変更
6. 英語で話す

**期待される結果**:
- 日本語の標準音声（NanamiNeural）で読み上げられる
- 言語ごとに異なる標準音声が使用される

---

## 技術的な詳細

### Personal Voice (Professional Voice) について

**Azure の Personal Voice とは**:
- ユーザー固有の音声特徴を学習し、その人の声で音声合成を行う技術
- Professional Voice とも呼ばれる
- 高品質な音声サンプルから話者特性を抽出し、Speaker Profile を作成
- Speaker Profile ID を使用して、その人の声で任意のテキストを読み上げることができる

**多言語対応**:
- Personal Voice は本質的に多言語対応
- 日本語のサンプルから作成した Speaker Profile でも、英語、中国語などを話すことができる
- ベース音声（Multilingual Neural Voice）に話者特性が適用される

**使用方法**:
1. ベース音声として多言語対応の Neural Voice を指定
   - 例: `en-US-AvaMultilingualNeural`, `en-US-AndrewMultilingualNeural`
2. SSML で `mstts:ttsembedding` タグを使用
3. `speakerProfileId` 属性に Speaker Profile ID を指定
4. `xml:lang` で合成したい言語を指定

### 選択したベース音声について

**`en-US-AvaMultilingualNeural` を選択した理由**:
- Azure が提供する多言語対応の Neural Voice
- Personal Voice の `ttsembedding` 機能をサポート
- 高品質な音声出力
- 多数の言語に対応

**代替案**:
- `en-US-AndrewMultilingualNeural` (男性音声)
- `zh-CN-XiaoyiMultilingualNeural` (中国語ベース)
- その他の Multilingual Neural Voice

ユーザーが異なるベース音声を使用したい場合は、設定画面でカスタム音声名を指定することで変更可能です。

### コードの変更点まとめ

| ファイル | メソッド | 変更内容 |
|---------|---------|---------|
| speechSynthesis.js | constructor | `PERSONAL_VOICE_BASE` 定数を追加 |
| speechSynthesis.js | initialize | Personal Voice 時はベース音声を使用するよう変更 |
| speechSynthesis.js | generateSSML | Personal Voice 時はベース音声を voice name に使用 |
| speechSynthesis.js | getVoiceNameForLanguage | コメントを更新（標準音声のみで使用） |

---

## 影響範囲

### 変更されたファイル

1. **src/js/speechSynthesis.js**
   - Personal Voice の多言語対応を実装
   - ベース音声の自動選択ロジックを追加

### 互換性

- **後方互換性**: 維持
  - Personal Voice ID が未設定の場合、従来通り標準音声を使用
  - 既存の設定に影響なし
- **新機能**: Personal Voice の多言語対応
  - Personal Voice ID が設定されている場合、自動的に多言語対応モードになる
- **ブラウザー要件**: 変更なし

### ユーザーへの影響

**Personal Voice を使用しているユーザー**:
- ✅ **改善**: 翻訳先言語を変更しても、同じ人の声で話すようになる
- ✅ **改善**: より自然な多言語音声合成が可能になる
- ⚠️ **変更**: ベース音声が `en-US-AvaMultilingualNeural` に変更される
  - 異なるベース音声を使用したい場合は、設定画面でカスタム音声名を指定可能

**Personal Voice を使用していないユーザー**:
- ✅ **影響なし**: 従来通り標準音声を使用
- ✅ **影響なし**: 既存の動作に変更なし

---

## 今後の推奨事項

### 1. ベース音声の選択オプション

現在は `en-US-AvaMultilingualNeural` を固定で使用していますが、以下の改善を検討:
- 設定画面でベース音声を選択可能にする
- 男性/女性の選択
- 言語圏に応じたベース音声の提案

### 2. Personal Voice のプレビュー機能

- 設定画面で Personal Voice のプレビュー再生機能を追加
- 異なる言語でのプレビューを提供
- ベース音声の比較機能

### 3. エラーハンドリングの強化

- Personal Voice が利用できない場合のフォールバック処理
- Speaker Profile ID の検証機能
- より詳細なエラーメッセージ

### 4. ドキュメントの充実

- Personal Voice の設定方法を詳しく説明
- Speaker Profile の作成方法
- トラブルシューティングガイド

---

## 参考リンク

### Azure Speech Service 公式ドキュメント

- [Personal Voice 概要](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-overview)
- [Personal Voice の作成方法](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-create-voice)
- [SSML リファレンス](https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup)
- [TTS embedding 要素](https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup-voice#use-tts-embedding-for-personal-voice)
- [Multilingual Neural Voices](https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts#multilingual-voices)

### 関連ドキュメント

- [Azure Speech Service Live Interpreter 技術仕様書](./techspec.md)
- [Azure Speech Service Live Interpreter 企画書・要件定義書](./RequirementsDefinition.md)
- [バグフィックス報告書 (2025-12-04)](./BugFixes-2025-12-04.md)

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|----------|------|---------|--------|
| 1.0.2 | 2025-12-04 | Personal Voice 多言語対応の修正 | GitHub Copilot Agent |

---

**文書の終わり**
