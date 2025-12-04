# 🎙️ Azure Speech Service Live Interpreter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)

> **Azure Speech Service** のリアルタイム音声翻訳機能と **Personal Voice** を活用した、ブラウザベースの同時通訳アプリケーション

## 📋 概要

このアプリケーションは、Azure Speech Service の live interpreter 機能を使用して、マイク入力された音声をリアルタイムで翻訳し、Personal Voice で音声合成して出力します。バックエンド不要で、ブラウザだけで動作する軽量な技術デモです。

### ✨ 主な特徴

- 🎤 **リアルタイム音声認識** - マイク入力を即座にテキスト化
- 🌐 **多言語翻訳** - 10以上の言語に対応
- 🔊 **Personal Voice 音声合成** - カスタム音声での読み上げ
- 💬 **チャット形式UI** - 吹き出し形式で会話を表示
- 💾 **設定の永続化** - ローカルストレージに保存
- ⚡ **ゼロ設定で即座に開始** - ブラウザで直接実行可能
- 📱 **レスポンシブデザイン** - モバイル・タブレット・デスクトップ対応

## 🎯 ユースケース

- **国際会議**: リアルタイム同時通訳
- **語学学習**: 発音練習と翻訳確認
- **技術デモ**: Azure Speech Service の機能紹介
- **アクセシビリティ**: 多言語コミュニケーション支援

## 🛠️ 技術スタック

### フロントエンド

| 技術                                     | バージョン | 用途                         |
| ---------------------------------------- | ---------- | ---------------------------- |
| HTML5                                    | Latest     | セマンティックなマークアップ |
| CSS3                                     | Latest     | スタイリング                 |
| [Tailwind CSS](https://tailwindcss.com/) | 3.x (CDN)  | ユーティリティファースト CSS |
| JavaScript                               | ES6+       | アプリケーションロジック     |
| [Azure Speech SDK](https://docs.microsoft.com/azure/cognitive-services/speech-service/) | Latest (CDN) | 音声認識・翻訳・合成 |

### Azure Services

- **Azure Speech Service** - 音声認識と翻訳
- **Azure Personal Voice** - カスタム音声合成

## 📁 プロジェクト構造

```
📦 personalvoice-translator/
├── 📄 README.md                          # プロジェクト概要（本ファイル）
├── 📄 LICENSE                            # MITライセンス
├── 📁 docs/                              # ドキュメント
│   ├── 📄 RequirementsDefinition.md     # 企画書・要件定義書
│   └── 📄 techspec.md                    # 技術仕様書
└── 📁 src/                               # アプリケーションソース（未実装）
    ├── 📄 index.html                     # メインHTML
    ├── 📁 css/                           # スタイルシート
    │   └── 📄 styles.css                 # カスタムCSS
    ├── 📁 js/                            # JavaScript
    │   ├── 📄 app.js                     # エントリーポイント
    │   ├── 📄 app-controller.js          # アプリケーションコントローラー
    │   ├── 📄 state-manager.js           # 状態管理
    │   ├── 📄 speech-recognition-service.js  # 音声認識サービス
    │   ├── 📄 speech-synthesis-service.js    # 音声合成サービス
    │   ├── 📄 storage-manager.js         # ストレージ管理
    │   ├── 📄 ui-manager.js              # UI管理
    │   └── 📄 constants.js               # 定数定義
    └── 📁 assets/                        # 静的リソース
        └── 📁 images/                    # 画像ファイル
```

## 🚀 クイックスタート

### 前提条件

- 📌 モダンな Web ブラウザ (Chrome 90+, Edge 90+, Firefox 88+, Safari 14+)
- 📌 Azure サブスクリプション
- 📌 Azure Speech Service のリソース
- 📌 Personal Voice の設定（オプション）

### セットアップ手順

#### 1. Azure Speech Service の準備

1. **Azure Portal にログイン**
   - [Azure Portal](https://portal.azure.com/) にアクセス

2. **Speech Service リソースの作成**
   ```
   リソースの作成 > AI + Machine Learning > Speech
   ```

3. **Subscription Key と Region を取得**
   - リソースの「キーとエンドポイント」から確認
   - 例: Key = `abc123...`, Region = `japaneast`

4. **Personal Voice の設定（オプション）**
   - [Personal Voice ドキュメント](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-overview)を参照
   - Speaker ID を取得

#### 2. アプリケーションの起動

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/yourusername/personalvoice-translator.git
   cd personalvoice-translator
   ```

2. **ブラウザで開く**
   ```bash
   # src/index.html をブラウザで開く
   open src/index.html
   
   # または開発サーバーを起動
   cd src
   python -m http.server 8000
   # http://localhost:8000 にアクセス
   ```

3. **初期設定**
   - 設定アイコン（⚙️）をクリック
   - Subscription Key、Region、Speaker ID を入力
   - 「保存」をクリック

4. **使用開始**
   - 翻訳先言語を選択
   - 「開始」ボタンをクリック
   - マイク権限を許可
   - マイクに向かって話す
   - リアルタイムで翻訳結果が表示され、音声が再生されます

## 📚 ドキュメント

詳細なドキュメントは `docs/` ディレクトリに格納されています：

- **[企画書・要件定義書](docs/RequirementsDefinition.md)** - プロジェクトの背景、目的、機能要件、UI/UX仕様
- **[技術仕様書](docs/techspec.md)** - システムアーキテクチャ、モジュール設計、実装詳細

### ドキュメント構成

```
docs/
├── RequirementsDefinition.md    # 企画書・要件定義書
│   ├── プロジェクト概要
│   ├── 背景と目的
│   ├── 主要機能
│   ├── ユーザー体験 (UX)
│   ├── ユーザーインターフェース (UI) 仕様
│   ├── 技術要件
│   ├── セキュリティとプライバシー
│   └── 今後の拡張性
│
└── techspec.md                   # 技術仕様書
    ├── システムアーキテクチャ
    ├── 技術スタック詳細
    ├── モジュール設計
    ├── データモデル
    ├── API仕様
    ├── 実装詳細
    └── パフォーマンス最適化
```

## 💡 主要機能

### 1. リアルタイム音声認識・翻訳
- マイク入力された音声を即座に認識
- Azure Speech Service で自動翻訳
- 認識中の暫定結果と確定結果を表示

### 2. Personal Voice による音声合成
- カスタム Personal Voice での読み上げ
- 自然な音声出力
- 音量調整機能

### 3. チャット形式の UI
- 吹き出し形式で会話を表示
- ユーザー発話と翻訳結果を区別
- 会話履歴のスクロール表示

### 4. 多言語対応
対応言語（一部）：
- 🇯🇵 日本語 (ja-JP)
- 🇺🇸 英語 (en-US)
- 🇨🇳 中国語 (zh-CN)
- 🇰🇷 韓国語 (ko-KR)
- 🇪🇸 スペイン語 (es-ES)
- 🇫🇷 フランス語 (fr-FR)
- 🇩🇪 ドイツ語 (de-DE)
- 🇮🇹 イタリア語 (it-IT)

### 5. 設定の永続化
- ローカルストレージに設定を保存
- 起動時に自動読み込み
- エクスポート/インポート機能

## 🎯 使用シナリオ

### シナリオ 1: 国際会議での同時通訳
```
状況: 日本語で発言し、英語圏の参加者に翻訳を提供
操作: 
1. 翻訳先言語を「英語 (en-US)」に設定
2. 「開始」ボタンをクリック
3. 日本語で発言
結果: 英語の翻訳がリアルタイムで表示され、音声で読み上げられる
```

### シナリオ 2: 語学学習
```
状況: 英語の発音練習と翻訳確認
操作:
1. 翻訳先言語を「日本語 (ja-JP)」に設定
2. 英語で話す
結果: 日本語の翻訳が表示され、正しく認識されたか確認できる
```

### シナリオ 3: 技術デモンストレーション
```
状況: Azure Speech Service の機能を紹介
操作:
1. 様々な言語で音声入力
2. Personal Voice の音声品質を確認
結果: Azure の強力な音声処理能力を実演
```

## 📱 レスポンシブデザイン対応

このアプリケーションは以下の画面サイズに最適化されています：

- 📱 **モバイル**: 320px〜768px
  - 縦並びレイアウト
  - フルワイドボタン
  - タッチ操作に最適化

- 📊 **タブレット**: 768px〜1024px
  - 2カラムレイアウト
  - 中サイズボタン
  - タッチとマウス操作に対応

- 💻 **デスクトップ**: 1024px 以上
  - ワイドレイアウト
  - 最大幅1200px
  - マウス操作に最適化

## 🔒 セキュリティとプライバシー

### データ保護

- ✅ **音声データ**: Azure に直接ストリーミング、ローカル保存なし
- ✅ **会話履歴**: ブラウザメモリ内のみ、永続化なし
- ✅ **設定情報**: ローカルストレージに保存（技術デモのため）
- ⚠️ **注意**: Subscription Key は他人と共有しないでください

### セキュリティベストプラクティス

- 🔐 **HTTPS必須**: 本番環境では HTTPS でホスティング
- 🔐 **XSS対策**: すべてのユーザー入力をエスケープ処理
- 🔐 **CSP設定**: Content Security Policy の適用
- 🔐 **権限管理**: マイクアクセス権限の適切な処理

### プライバシーポリシー

- Microsoft のプライバシーポリシーに準拠
- 音声データは Azure Speech Service のポリシーに従って処理
- 個人情報は収集・保存しません

## 🛠️ 開発者向け情報

### 技術的特徴

- **バックエンドレス**: サーバー不要、フロントエンドのみ
- **CDN依存**: すべてのライブラリを CDN から読み込み
- **モジュール設計**: 疎結合で保守性の高いアーキテクチャ
- **イベント駆動**: 状態管理とイベントバスによる制御

### コードの特徴

```javascript
// 詳細なログ出力
console.log('INFO: アプリケーション初期化開始');
console.error('ERROR: 接続エラー', error);

// ES6+ モダンな構文
const { subscriptionKey, region } = config;
const messages = state.messages ?? [];

// async/await による非同期処理
async startTranslation() {
    await this.speechService.startRecognition();
}
```

### 開発ワークフロー

1. **計画**: ドキュメントレビュー
2. **実装**: モジュール単位で開発
3. **テスト**: ブラウザで動作確認
4. **デバッグ**: コンソールログで追跡
5. **デプロイ**: GitHub Pages 等にホスティング

## 🧪 テストとデバッグ

### 手動テスト

```javascript
// デバッグモードの有効化
window.DEBUG_MODE = true;

// アプリケーションインスタンスにアクセス
console.log(window.app.stateManager.getState());
```

### テストチェックリスト

- [ ] 初回起動時の設定フロー
- [ ] 音声認識の開始と停止
- [ ] 複数言語での翻訳
- [ ] 音声合成の再生
- [ ] 設定の保存と読み込み
- [ ] エラーハンドリング
- [ ] レスポンシブデザイン

## 🚧 トラブルシューティング

### よくある問題

**Q: マイクが動作しない**
```
A: 
1. ブラウザのマイク権限を確認
2. HTTPS でホスティングされているか確認
3. 他のアプリがマイクを使用していないか確認
```

**Q: 接続エラーが発生する**
```
A:
1. Subscription Key が正しいか確認
2. Region が正しいか確認（例: japaneast）
3. ネットワーク接続を確認
```

**Q: Personal Voice が動作しない**
```
A:
1. Speaker ID が正しいか確認
2. Personal Voice が有効化されているか確認
3. Azure Portal で権限を確認
```

詳細は [技術仕様書のトラブルシューティング](docs/techspec.md#トラブルシューティング)を参照してください。

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

### コントリビューションガイドライン

- コードは ES6+ で記述
- Tailwind CSS を使用
- 適切なコメントとログを追加
- ドキュメントを更新

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🆘 サポートとリソース

### 公式ドキュメント

- 📖 [Azure Speech Service](https://docs.microsoft.com/azure/cognitive-services/speech-service/)
- 📖 [Speech SDK for JavaScript](https://docs.microsoft.com/azure/cognitive-services/speech-service/quickstarts/setup-platform?pivots=programming-language-javascript)
- 📖 [Personal Voice](https://learn.microsoft.com/azure/ai-services/speech-service/personal-voice-overview)
- 📖 [Tailwind CSS](https://tailwindcss.com/docs)

### コミュニティ

- 💬 [Azure Community](https://techcommunity.microsoft.com/t5/azure/ct-p/Azure)
- 💬 [GitHub Discussions](https://github.com/yourusername/personalvoice-translator/discussions)
- 🐛 [Issue 報告](https://github.com/yourusername/personalvoice-translator/issues)

### 関連プロジェクト

- [Azure Speech Service Samples](https://github.com/Azure-Samples/cognitive-services-speech-sdk)
- [Speech-to-Text Demo](https://azure.microsoft.com/services/cognitive-services/speech-to-text/)

## 📊 プロジェクトステータス

- 📝 **ドキュメント**: ✅ 完成
- 💻 **実装**: 🚧 未実装
- 🧪 **テスト**: ⏳ 待機中
- 🚀 **デプロイ**: ⏳ 待機中

## 🗺️ ロードマップ

### Phase 1: 基本機能実装（予定）
- [ ] HTML/CSS/JavaScript の実装
- [ ] Azure Speech SDK の統合
- [ ] 基本的な音声認識と翻訳
- [ ] チャット UI の実装

### Phase 2: 機能拡張（予定）
- [ ] Personal Voice の統合
- [ ] 設定の永続化
- [ ] エラーハンドリングの強化
- [ ] レスポンシブデザインの最適化

### Phase 3: 高度な機能（将来）
- [ ] 会話履歴の保存・エクスポート
- [ ] 複数の Personal Voice サポート
- [ ] 言語自動検出
- [ ] テキスト入力モード

---

<div align="center">
  <strong>🎙️ リアルタイム音声翻訳の未来へ 🌐</strong><br>
  Made with ❤️ using Azure Speech Service and GitHub Copilot
</div>
