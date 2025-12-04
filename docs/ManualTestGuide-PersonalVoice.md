# Personal Voice 多言語対応バグ修正 - 手動テストガイド

## テストの目的
Personal Voice（カスタム音声）が翻訳先言語に関係なく正しく動作することを確認する。

## 前提条件
- ✅ Azure Speech Service のサブスクリプションキーとリージョン
- ✅ Personal Voice の Speaker Profile ID
- ✅ Personal Voice が有効なサブスクリプション
- ✅ マイクが接続されたコンピュータ
- ✅ 対応ブラウザ（Chrome 90+, Edge 90+, Safari 14+, Firefox 88+）

## テストケース 1: Personal Voice の多言語動作確認

### 目的
Personal Voice ID が設定されている場合、翻訳先言語を変更しても同じ話者の声で合成されることを確認

### 手順
1. **アプリケーションを開く**
   ```
   cd src
   python -m http.server 8000
   # ブラウザで http://localhost:8000 にアクセス
   ```

2. **設定画面を開く**
   - 右上の⚙️ボタンをクリック

3. **必要な情報を入力**
   - Subscription Key: `[あなたのキー]`
   - Service Region: `[あなたのリージョン]` (例: japaneast)
   - Personal Voice ID: `[あなたの Speaker Profile ID]`
   - 音声名: 空欄のまま（デフォルトを使用）

4. **設定を保存**
   - 「保存」ボタンをクリック
   - 設定モーダルが閉じることを確認

5. **ブラウザのコンソールを開く**
   - F12 キーまたは右クリック > 検証
   - Console タブを選択

6. **翻訳先言語を英語に設定**
   - 「翻訳先言語」ドロップダウンから「英語 (en-US)」を選択

7. **コンソールログを確認（重要）**
   ```
   期待されるログ:
   [SpeechSynthesis] Personal Voice モード - ベース音声を使用: en-US-AvaMultilingualNeural
   [SpeechSynthesis] Personal Voice ID: [あなたのID]
   [SpeechSynthesis] Personal Voice は多言語対応のため、言語に依存しません
   [SpeechSynthesis] 音声名: en-US-AvaMultilingualNeural
   [SpeechSynthesis] 対象言語: en-US
   ```

8. **音声認識を開始**
   - 「開始」ボタンをクリック
   - マイク権限を許可

9. **日本語で話す**
   - 例: "こんにちは、今日はいい天気ですね"

10. **結果を確認**
    - ✅ 英語の翻訳結果が表示される
    - ✅ Personal Voice の話者特性が反映された声で英語が読み上げられる
    - ✅ コンソールに以下のログが表示される:
      ```
      [SpeechSynthesis] Personal Voice を使用して SSML で合成
      [SpeechSynthesis] Personal Voice 用 SSML - ベース音声: en-US-AvaMultilingualNeural
      [SpeechSynthesis] 生成されたSSML: <speak version="1.0" ...
      ```

11. **翻訳先言語を中国語に変更**
    - 「翻訳先言語」ドロップダウンから「中国語 (zh-CN)」を選択

12. **コンソールログを確認**
    ```
    期待されるログ:
    [AppController] 翻訳先言語変更: zh-CN
    [AppController] 翻訳先言語変更により音声合成サービスを再初期化
    [SpeechSynthesis] Personal Voice モード - ベース音声を使用: en-US-AvaMultilingualNeural
    [SpeechSynthesis] 対象言語: zh-CN
    ```

13. **再度日本語で話す**
    - 例: "おはようございます、元気ですか"

14. **結果を確認**
    - ✅ 中国語の翻訳結果が表示される
    - ✅ **同じ話者の声で**中国語が読み上げられる
    - ✅ 英語と中国語で声の特徴（話者）が同じであることを確認

### 成功基準
- ✅ Personal Voice ID が設定されている場合、常に `en-US-AvaMultilingualNeural` がベース音声として使用される
- ✅ 翻訳先言語を変更しても、同じ話者の声で合成される
- ✅ コンソールログに "Personal Voice モード" と表示される
- ✅ SSML に `en-US-AvaMultilingualNeural` が含まれる

### 失敗パターン（修正前の動作）
- ❌ 翻訳先言語ごとに異なる音声で合成される
- ❌ 日本語: `ja-JP-NanamiNeural`
- ❌ 英語: `en-US-JennyNeural`
- ❌ Personal Voice の話者特性が反映されない

---

## テストケース 2: 標準音声の動作確認

### 目的
Personal Voice ID が未設定の場合、従来通り言語別の標準音声が使用されることを確認

### 手順
1. **設定画面を開く**
   - 右上の⚙️ボタンをクリック

2. **Personal Voice ID を削除**
   - Personal Voice ID の入力欄を空にする

3. **設定を保存**
   - 「保存」ボタンをクリック

4. **翻訳先言語を英語に設定**
   - 「翻訳先言語」ドロップダウンから「英語 (en-US)」を選択

5. **コンソールログを確認**
   ```
   期待されるログ:
   [SpeechSynthesis] 標準音声モード
   [SpeechSynthesis] 音声名: en-US-JennyNeural
   [SpeechSynthesis] 対象言語: en-US
   ```

6. **日本語で話す**
   - 例: "こんにちは"

7. **結果を確認**
   - ✅ 英語の標準音声（JennyNeural）で読み上げられる
   - ✅ コンソールに "標準音声モード" と表示される

8. **翻訳先言語を日本語に変更**
   - 「翻訳先言語」ドロップダウンから「日本語 (ja-JP)」を選択

9. **コンソールログを確認**
   ```
   期待されるログ:
   [SpeechSynthesis] 標準音声モード
   [SpeechSynthesis] 音声名: ja-JP-NanamiNeural
   ```

10. **英語で話す**
    - 例: "Hello"

11. **結果を確認**
    - ✅ 日本語の標準音声（NanamiNeural）で読み上げられる
    - ✅ 言語ごとに異なる音声が使用される

### 成功基準
- ✅ Personal Voice ID が未設定の場合、言語別の標準音声が使用される
- ✅ 日本語 → `ja-JP-NanamiNeural`
- ✅ 英語 → `en-US-JennyNeural`
- ✅ コンソールログに "標準音声モード" と表示される

---

## テストケース 3: 複数の言語での Personal Voice 動作確認

### 目的
Personal Voice が多数の言語で正しく動作することを確認

### 手順
1. **Personal Voice ID を設定**
   - テストケース 1 の手順 1-4 を実行

2. **以下の言語でテスト**
   
   | 翻訳先言語 | テスト入力（日本語） | 期待される出力 | 音声 |
   |-----------|-------------------|---------------|------|
   | 英語 (en-US) | こんにちは | Hello | Personal Voice |
   | 中国語 (zh-CN) | ありがとう | 谢谢 | Personal Voice |
   | 韓国語 (ko-KR) | さようなら | 안녕히 가세요 | Personal Voice |
   | スペイン語 (es-ES) | おはよう | Buenos días | Personal Voice |
   | フランス語 (fr-FR) | こんばんは | Bonsoir | Personal Voice |

3. **各言語でコンソールログを確認**
   ```
   すべての言語で以下のログが表示されることを確認:
   [SpeechSynthesis] Personal Voice モード - ベース音声を使用: en-US-AvaMultilingualNeural
   [SpeechSynthesis] Personal Voice 用 SSML - ベース音声: en-US-AvaMultilingualNeural
   ```

### 成功基準
- ✅ すべての言語で同じベース音声 (`en-US-AvaMultilingualNeural`) が使用される
- ✅ すべての言語で同じ話者の声で合成される
- ✅ 言語が変わっても声の特徴（話者）は変わらない

---

## テストケース 4: SSML の生成内容確認

### 目的
生成される SSML が正しい形式であることを確認

### 手順
1. **Personal Voice ID を設定**
   - テストケース 1 の手順 1-4 を実行

2. **翻訳先言語を英語に設定**

3. **日本語で話す**

4. **コンソールで生成された SSML を確認**
   - "生成されたSSML:" で検索

5. **SSML の内容を確認**
   ```xml
   期待される SSML:
   <speak version="1.0" 
          xmlns="http://www.w3.org/2001/10/synthesis" 
          xmlns:mstts="https://www.w3.org/2001/mstts" 
          xml:lang="en-US">
     <voice name="en-US-AvaMultilingualNeural">
       <mstts:ttsembedding speakerProfileId="[あなたのID]">
         [翻訳されたテキスト]
       </mstts:ttsembedding>
     </voice>
   </speak>
   ```

### 成功基準
- ✅ `<voice name="en-US-AvaMultilingualNeural">` が使用されている
- ✅ `<mstts:ttsembedding speakerProfileId="...">` が含まれている
- ✅ `xml:lang` が翻訳先言語に設定されている
- ✅ テキストが正しくエスケープされている

### 失敗パターン（修正前）
- ❌ `<voice name="en-US-JennyNeural">` など言語別の音声名
- ❌ `<voice name="ja-JP-NanamiNeural">` など言語別の音声名

---

## テストケース 5: エラーハンドリング

### 目的
無効な Personal Voice ID の場合のエラーハンドリングを確認

### 手順
1. **設定画面を開く**

2. **無効な Personal Voice ID を入力**
   - 例: "invalid-id-12345"

3. **設定を保存**

4. **音声認識を開始して話す**

5. **結果を確認**
   - エラーメッセージが表示されることを確認
   - コンソールにエラーログが出力されることを確認

### 成功基準
- ✅ 適切なエラーメッセージが表示される
- ✅ アプリケーションがクラッシュしない
- ✅ コンソールにエラーログが記録される

---

## トラブルシューティング

### 問題: Personal Voice の声が反映されない
**症状**: Personal Voice ID を設定しても標準音声で合成される

**確認事項**:
1. コンソールログを確認
   - "Personal Voice モード" と表示されているか？
   - ベース音声が `en-US-AvaMultilingualNeural` になっているか？

2. Personal Voice ID が正しいか確認
   - Azure Portal で Speaker Profile ID を再確認

3. サブスクリプションで Personal Voice が有効か確認
   - Azure Portal で Personal Voice の設定を確認

### 問題: コンソールに "標準音声モード" と表示される
**原因**: Personal Voice ID が未設定または空文字列

**解決方法**:
1. 設定画面を開く
2. Personal Voice ID が入力されているか確認
3. 空白や余分なスペースがないか確認
4. 再度保存して試す

### 問題: 音声合成エラーが発生する
**症状**: "音声合成エラー" というメッセージが表示される

**確認事項**:
1. Subscription Key と Region が正しいか確認
2. ネットワーク接続を確認
3. Azure Portal でサービスの状態を確認
4. コンソールのエラー詳細を確認

---

## テスト結果の記録

### テスト環境
- 日付: _______________
- OS: _______________
- ブラウザ: _______________
- Azure Region: _______________

### テストケース 1
- [ ] 合格
- [ ] 不合格
- 備考: _______________________________________

### テストケース 2
- [ ] 合格
- [ ] 不合格
- 備考: _______________________________________

### テストケース 3
- [ ] 合格
- [ ] 不合格
- 備考: _______________________________________

### テストケース 4
- [ ] 合格
- [ ] 不合格
- 備考: _______________________________________

### テストケース 5
- [ ] 合格
- [ ] 不合格
- 備考: _______________________________________

### 総合評価
- [ ] すべてのテストケースに合格
- [ ] 一部のテストケースに不合格あり
- [ ] 本番環境への適用可能

---

## 参考情報

### Azure Speech Service ドキュメント
- [Personal Voice 概要](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-overview)
- [SSML リファレンス](https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup)
- [TTS embedding 要素](https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup-voice#use-tts-embedding-for-personal-voice)

### 関連ドキュメント
- [バグフィックス報告書](./BugFix-PersonalVoiceMultilingual.md)
- [技術仕様書](./techspec.md)

---

**テストガイドの終わり**
