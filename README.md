# AdCraft AI

**AI Agent Hackathon 2025** エントリー作品
商品画像1枚から8秒のプロフェッショナル動画を自動生成するマルチエージェントAIシステム

## 🎯 概要

AdCraft AIは、Google Cloud PlatformのVertex AI技術を活用した革新的な動画制作プラットフォームです。商品画像またはテキスト説明から、わずか数分でプロ品質のコマーシャル動画を生成します。

### 🤖 マルチエージェントシステム

- **Maya（商品分析エージェント）**: Gemini Pro Visionで商品特徴を詳細分析
- **David（クリエイティブディレクター）**: Gemini Proで映像戦略を策定
- **Zara（映像プロデューサー）**: Google Veo 3で高品質動画を生成

### ✨ 主要機能

- ✅ **デュアル入力モード**: 商品画像アップロード or テキストから画像生成（Imagen API）
- ✅ **8秒最適化**: Google Veo 3の制約を活かした効果的なコマーシャル構成
- ✅ **プロンプト最適化**: Gemini AIによる動画生成プロンプトの自動最適化
- ✅ **リアルタイム監視**: コスト追跡、進捗確認、品質管理
- ✅ **多言語対応**: 日本語・英語のナレーション生成

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** - レスポンシブデザイン
- **Zustand** - 状態管理
- **next-intl** - 多言語対応

### AI・バックエンド
- **Google Vertex AI**: Gemini Pro Vision, Gemini Pro
- **Google Veo 3 API**: 最先端動画生成
- **Google Imagen API**: テキストから画像生成
- **Firestore**: リアルタイムデータベース

### インフラ
- **Google Cloud Run**: サーバーレスデプロイメント
- **Google Cloud Storage**: 動画・画像保存
- **Pulumi**: Infrastructure as Code

## 🚀 開発・デプロイ

### 開発環境セットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd adcraft-ai

# 依存関係インストール
npm install

# 環境変数設定
cp .env.local.example .env.local
# Google Cloud認証情報を設定

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認

### 本番デプロイ（Google Cloud Run）

```bash
# インフラディレクトリに移動
cd infrastructure

# Pulumi設定・デプロイ
chmod +x setup.sh
./setup.sh
pulumi up

# アプリケーションデプロイ
cd ..
gcloud run deploy adcraft-ai \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars APP_MODE=real
```

## 🎭 動作モード

### デモモード（開発用）
- ✅ プリスクリプト応答でゼロコスト
- ✅ 完全な機能テスト環境
- ✅ 高速プロトタイピング

### リアルモード（本番用）
- ✅ 実際のVertex AI統合
- ✅ Google Veo 3による動画生成
- ✅ コスト監視・制御機能

モード切替: `APP_MODE=demo` または `APP_MODE=real`

## 📊 コスト管理

- **予算制限**: $300以内での運用
- **動画生成コスト**: 約$1.81-2.01/本
- **自動監視**: 50%, 75%, 90%でアラート
- **ライフサイクル管理**: 12時間後の自動ファイル削除

## 🔧 主要コマンド

```bash
# 開発
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # コードチェック
npm run typecheck    # 型チェック

# テスト
npm run test         # テスト実行

# インフラ
cd infrastructure
pulumi preview       # インフラ変更確認
pulumi up           # インフラデプロイ
pulumi destroy      # リソース削除
```

## 🎨 特徴的な技術革新

### 1. デモ/リアル二重実装
機能開発時は低コストなデモモードで迅速検証、承認後にリアルモードに同期展開

### 2. プロンプト最適化エンジン
Gemini AIによる2段階最適化で、8秒制約下での最大インパクト実現

### 3. マルチエージェント協調
異なる専門性を持つAIエージェントの効果的連携でプロ品質を保証

## 🏆 AI Agent Hackathon 2025

このプロジェクトは**AI Agent Hackathon 2025**の参加作品として開発されました。

- **テーマ**: マルチエージェントAIによる動画制作の民主化
- **技術的挑戦**: Google Cloud最新AI技術の統合活用
- **実用性**: 実際のビジネス課題解決への焦点

## 📝 ライセンス

MIT License

## 🔗 関連リンク

- [Zenn技術記事](https://zenn.dev/oharu121/articles/61afd3a6f63103)
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai)
- [Next.js 15 Documentation](https://nextjs.org/docs)

---

**AdCraft AI** - 次世代AI技術で、動画制作の未来を創造します
