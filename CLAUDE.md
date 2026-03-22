# CLAUDE.md — Bookmarks Canvas Application

このファイルはClaude Codeがプロジェクトを理解し、改善作業を行うための技術ガイドです。

---

## プロジェクト概要

カスタマイズ可能なブックマーク管理Webアプリ。ユーザーはブックマークをドラッグ＆ドロップでキャンバス上に自由配置し、ダブルクリック/ダブルタップで開くことができる。デスクトップ・モバイル両対応。

### 主要機能
- インタラクティブなドラッグ＆ドロップキャンバス
- カテゴリ（カラー枠付き）管理
- スティッキーノート（色・フォント・サイズ変更可能）
- ワークスペースタブ（独立した複数キャンバス）
- ファイルアップロードによるアイコン設定
- ローカルユーザー認証（ユーザー名・パスワード）
- モバイル対応（タッチ操作、ロングプレスでドラッグ）

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript, Tailwind CSS, shadcn/ui, Wouter, TanStack Query |
| バックエンド | Express.js + TypeScript |
| データベース | PostgreSQL（Supabase） |
| ORM | Drizzle ORM + Drizzle Kit |
| 認証 | ローカルユーザー認証（scrypt）+ express-session |
| セッション | express-session + connect-pg-simple（PostgreSQL） |
| ビルド | Vite（フロント）、esbuild（バック） |

---

## ディレクトリ構成

```
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── home.tsx        # メインキャンバス画面（巨大ファイル・要分割）
│   │   │   ├── auth.tsx        # 認証ページ（ログイン・新規登録タブ）
│   │   │   ├── landing.tsx     # ランディングページ
│   │   │   ├── guide.tsx       # ユーザーガイド
│   │   │   └── docs.tsx        # DB設計ドキュメント（UI非表示）
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui コンポーネント群
│   │   │   └── LoginForm.tsx   # ローカルログインフォーム
│   │   ├── hooks/
│   │   │   ├── useAuth.ts      # 認証状態管理フック
│   │   │   └── use-toast.ts
│   │   └── lib/
│   │       ├── queryClient.ts  # TanStack Query設定
│   │       └── authUtils.ts    # 認証ユーティリティ
├── server/
│   ├── index.ts                # Expressサーバーエントリ
│   ├── routes.ts               # APIルート定義
│   ├── storage.ts              # DBアクセス層（IStorageインターフェース）
│   ├── db.ts                   # DB接続（postgres + Drizzle）
│   ├── auth.ts                 # セッション認証ミドルウェア
│   └── localAuth.ts            # ローカルユーザー認証（scrypt）
├── shared/
│   └── schema.ts               # Drizzle スキーマ定義（型共有）
├── docs/
│   └── database-design.html    # DB設計ドキュメント（/docs でアクセス）
├── drizzle.config.ts           # Drizzle Kit設定
├── .env.example                # 環境変数テンプレート
└── CLAUDE.md                   # このファイル
```

---

## データベーススキーマ

### テーブル一覧

```
sessions        - express-session用（connect-pg-simple）
users           - 全ユーザー共通テーブル（id = "local_${localUser.id}"）
local_users     - ローカル認証ユーザー（username/password）
workspace_tabs  - ワークスペースタブ
categories      - カテゴリ（色枠）
bookmarks       - ブックマーク
notes           - スティッキーノート
```

### 重要な設計上の注意

- `users.id` は `varchar`。ローカルユーザーは `local_${localUser.id}` 形式
- `local_users` は認証情報のみ保持。APIアクセス時は `users` テーブルに upsert される
- `bookmarks.isPlaced` は `integer`（0/1）だが、実質boolean（要修正）
- `categories`, `bookmarks`, `notes` は `tabId` を持つが、tab別フィルタのメソッド（`getTabCategories` 等）は**未実装**（空配列を返すのみ）

---

## 認証の構造

### 現在の認証フロー

```
/auth → auth.tsx → ログイン（POST /api/local/login）
                 → 新規登録（POST /api/local/register）
```

### `server/auth.ts` — セッション管理

- `setupAuth(app)` : express-session を設定（PostgreSQL セッションストア）
- `isAuthenticated` : `req.session.userId` の有無をチェックするミドルウェア

### `server/localAuth.ts` — ユーザー認証

- `hashPassword()` / `comparePasswords()` : scrypt によるパスワードハッシュ
- `verifyLocalUser()` : username/password で local_users テーブルを検証
- `getLocalUserByUsername()` : ユーザー名でユーザー取得

### APIエンドポイント（認証関連）

```
GET  /api/auth/user       - 現在のユーザー情報取得（要認証）
POST /api/local/login     - ローカルログイン
POST /api/local/logout    - ログアウト
POST /api/local/register  - 新規ユーザー登録
```

---

## 既知のバグ・未実装箇所

### 未実装（高優先度）
- `storage.getTabCategories()` — 空配列を返すだけ（tab別カテゴリ取得が機能していない）
- `storage.getTabBookmarks()` — 同上
- `storage.getTabNotes()` — 同上

### LSPエラー（既存）
- `client/src/pages/home.tsx` 約2161行目 — `isActive` プロパティのTypeScriptエラー（動作には影響なし）

### 技術的負債
- `home.tsx` が約2200行の巨大ファイル — コンポーネント分割が必要
- `bookmarks.isPlaced` が `integer`（0/1）だが `boolean` に統一すべき
- カテゴリ・ブックマーク・ノートの `tabId` 連携が不完全

---

## 開発コマンド

```bash
npm run dev       # 開発サーバー起動（フロント + バック）
npm run build     # プロダクションビルド
npm run start     # プロダクション起動
npm run db:push   # DBスキーマをDBに反映
npm run db:studio # Drizzle Studio（DBブラウザ）
```

## 環境変数（`.env.local`）

```
DATABASE_URL    - Supabase PostgreSQL接続文字列（Session Mode / Direct Connection）
SESSION_SECRET  - セッション暗号化キー（ランダム文字列）
PORT            - サーバーポート（デフォルト: 3000）
NODE_ENV        - development / production
```

`.env.example` に雛形あり。

### Supabase 接続文字列の形式

```
# Session Mode（推奨）
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Direct Connection
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

⚠️ Transaction Pooler（port 6543）は `db:push` 時に問題が出ることがある。**Session Mode（port 5432）を推奨**。

---

## フロントエンドのルーティング

```
/          → landing.tsx   （未ログイン時）/ home.tsx （ログイン済み）
/auth      → auth.tsx      （ログイン・新規登録）
/guide     → guide.tsx     （ユーザーガイド）
/docs      → 直接URLのみ  （DB設計ドキュメント HTML、UIには表示しない）
```

認証チェックは `client/src/hooks/useAuth.ts` と `client/src/App.tsx` で管理。
未認証の場合 `/` にリダイレクト、認証済みの場合 `home.tsx` を表示。

---

## 将来の検討事項

### Supabase Auth への移行（任意）
現在は独自のscrypt認証を使用。Supabase Authに移行するとメール認証・OAuthが利用可能になる。
- `local_users` テーブルを廃止 → Supabase Auth管理
- `sessions` テーブルを廃止 → JWTベースに切り替え
- 必要パッケージ: `@supabase/supabase-js`, `@supabase/ssr`

### Row Level Security（RLS）
Supabase Auth を使う場合、RLSでDBレベルのアクセス制御が可能。
現在はアプリ側で `userId` 条件を全クエリに付けているため、Supabase Auth を使わない場合はこのまま継続が安全・シンプル。
