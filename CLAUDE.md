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
- 二重認証（Replit Auth + ローカルユーザー）
- モバイル対応（タッチ操作、ロングプレスでドラッグ）

---

## 技術スタック（現在）

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript, Tailwind CSS, shadcn/ui, Wouter, TanStack Query |
| バックエンド | Express.js + TypeScript |
| データベース | PostgreSQL (Neon Database serverless) |
| ORM | Drizzle ORM + Drizzle Kit |
| 認証 | Replit OIDC Auth + ローカルユーザー（自前実装） |
| セッション | express-session + connect-pg-simple（PostgreSQL） |
| ビルド | Vite（フロント）、esbuild（バック） |

---

## ディレクトリ構成

```
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── home.tsx        # メインキャンバス画面（巨大ファイル・要分割）
│   │   │   ├── auth.tsx        # ローカル認証ページ
│   │   │   ├── landing.tsx     # ランディングページ（Replit Auth）
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
│   ├── db.ts                   # DB接続（Neon serverless）
│   ├── replitAuth.ts           # Replit OIDC認証
│   └── localAuth.ts            # ローカルユーザー認証
├── shared/
│   └── schema.ts               # Drizzle スキーマ定義（型共有）
├── docs/
│   └── database-design.html    # DB設計ドキュメント（/docs でアクセス）
├── drizzle.config.ts           # Drizzle Kit設定
└── CLAUDE.md                   # このファイル
```

---

## データベーススキーマ（現在）

### テーブル一覧

```
sessions        - express-session用（Replit Auth必須）
users           - Replit認証ユーザー（id = Replit sub値）
local_users     - ローカル認証ユーザー（別テーブル）
workspace_tabs  - ワークスペースタブ
categories      - カテゴリ（色枠）
bookmarks       - ブックマーク
notes           - スティッキーノート
```

### 重要な設計上の注意

- `users.id` は `varchar`（Replitの`sub`値が入る）
- `local_users` は完全に別テーブル。ローカルユーザーがAPIを呼ぶ際は `users` テーブルに `local_${localUser.id}` として仮登録される
- `bookmarks.isPlaced` は `integer`（0/1）だが、実質boolean
- `categories`, `bookmarks`, `notes` は `tabId` を持つが、tab別フィルタのメソッド（`getTabCategories` 等）は**未実装**（空配列を返すのみ）

---

## 認証の現状と問題点

### 現在の二重認証構造

```
GET /          → landing.tsx → Replit Auth のみ
GET /auth      → auth.tsx   → ローカルユーザーのみ
```

### Replit Auth（`server/replitAuth.ts`）

- OpenID Connect（OIDC）でReplitと連携
- `REPLIT_DOMAINS` 環境変数が必須（Replit環境外では動作しない）
- `REPL_ID` を `client_id` として使用
- セッションはPostgreSQLに保存（`sessions`テーブル）
- トークンの自動リフレッシュ機能あり

### ローカル認証（`server/localAuth.ts`）

- `scrypt` でパスワードハッシュ
- `local_users` テーブルに保存
- ログイン時に `users` テーブルへ仮ユーザーとして `upsert`（`local_${id}`）
- `expires_at` を現在時刻 + 24時間で偽装（本物のOAuthトークンではない）

### 認証の既知の問題

1. **Replit Auth はReplit外で動かない** — `REPLIT_DOMAINS` が必須のため、ローカル開発や他のクラウドへのデプロイ時に機能しない
2. **ローカルユーザーの二重テーブル** — `local_users` と `users` が別管理で複雑。ユーザーIDが `local_${id}` という特殊形式になっている
3. **セッション管理がPostgreSQL依存** — `connect-pg-simple` がDBに直結しており、DB切り替え時に要対応
4. **ユーザー登録機能がない** — ローカルユーザーのサインアップ画面が存在しない（直接DBにINSERTが必要）
5. **isAuthenticated middleware の問題** — ローカルユーザーの場合、リフレッシュトークンがないのに同じチェックロジックを通る

---

## タスク1: Supabaseへのデータベース移行

### 現在のDB接続（`server/db.ts`）

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
neonConfig.webSocketConstructor = ws;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### 移行手順

#### ステップ1: パッケージ変更

```bash
# 削除
npm uninstall @neondatabase/serverless ws

# 追加（Supabase PostgreSQL用）
npm install postgres drizzle-orm
# または
npm install pg @types/pg
```

#### ステップ2: `server/db.ts` の書き換え

**Option A: `postgres` パッケージ使用（推奨）**
```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";

const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });
```

**Option B: `pg` パッケージ使用**
```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

#### ステップ3: `drizzle.config.ts` の確認

現状のまま使用可能（`postgresql` dialectはそのまま）。  
`DATABASE_URL` をSupabaseのConnection String（Transaction Modeではなく**Session Mode**）に変更。

```
# Supabase Session Mode (port 5432)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Supabase Direct Connection
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**⚠️ 注意**: Supabaseの**Transaction Pooler**（port 6543）は `drizzle-kit push` 等のmigrationで問題が出ることがある。開発時は**Direct Connection**を使用推奨。

#### ステップ4: セッションストアの対応

現在 `connect-pg-simple` がPostgreSQLに直接接続している。  
Supabase PostgreSQLでも同じ接続文字列で動作するが、環境変数を更新するだけでOK。

#### ステップ5: スキーマのpush

```bash
npm run db:push
```

#### ステップ6: 環境変数の更新

```
DATABASE_URL=<Supabase接続文字列>
SESSION_SECRET=<既存のものを流用可>
```

---

## タスク2: 認証機能の見直し

### 推奨アプローチ: Supabase Authへの移行

Supabaseには認証機能が内蔵されており、以下が利用可能：
- メール/パスワード認証
- Magic Link
- OAuth（Google, GitHub, Twitter等）
- JWTベースのセッション管理

### 移行方針（選択肢）

#### Option A: 完全にSupabase Authに移行（推奨）

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- `local_users` テーブルを廃止 → Supabase Auth管理
- `users` テーブルをSupabaseの `auth.users` とリンク
- `sessions` テーブルを廃止 → JWTベースに切り替え
- Replit Auth廃止（Replit外でも動くようになる）
- フロントエンドは `@supabase/ssr` でSSR対応セッション管理

**必要な環境変数:**
```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key（サーバー側のみ）>
```

#### Option B: 現在の構造を整理（最小変更）

Replit Auth + ローカルユーザーを保持しつつ以下を改善：

1. **ユーザー登録エンドポイントの追加** (`POST /api/local/register`)
2. **ローカルユーザーのテーブル統合** — `local_users` を廃止し `users` テーブルにパスワードカラムを追加
3. **`isAuthenticated` middlewareの分岐修正** — ローカルユーザーは `expires_at` チェックをスキップ
4. **セッション有効期限の改善** — ローカルユーザーのセッションをDB管理に統一

### 現在のAPIエンドポイント（認証関連）

```
GET  /api/login           - Replit Auth開始
GET  /api/callback        - Replit Auth OAuth callback
GET  /api/logout          - Replit Auth ログアウト
GET  /api/auth/user       - 現在のユーザー情報取得

POST /api/local/login     - ローカルログイン
POST /api/local/logout    - ローカルログアウト
```

**未実装で必要:**
```
POST /api/local/register  - ローカルユーザー登録
```

---

## 既知のバグ・未実装箇所

### 未実装
- `storage.getTabCategories()` — 空配列を返すだけ（tab別カテゴリ取得が機能していない）
- `storage.getTabBookmarks()` — 同上  
- `storage.getTabNotes()` — 同上
- ローカルユーザーのサインアップ画面

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
npm run db:push   # DBスキーマをDBに反映
npm run db:studio # Drizzle Studio（DBブラウザ）
```

## 環境変数（必須）

```
DATABASE_URL       - PostgreSQL接続文字列
SESSION_SECRET     - セッション暗号化キー
REPLIT_DOMAINS     - Replit Auth用ドメイン（Replit環境のみ）
REPL_ID            - Replit Auth用クライアントID（Replit環境のみ）
```

---

## フロントエンドのルーティング

```
/          → landing.tsx   （未ログイン時）/ home.tsx （ログイン済み）
/auth      → auth.tsx      （ローカルログイン）
/guide     → guide.tsx     （ユーザーガイド）
/docs      → 直接URLのみ  （DB設計ドキュメント HTML、UIには表示しない）
```

認証チェックは `client/src/hooks/useAuth.ts` と `client/src/App.tsx` で管理。  
未認証の場合 `/` にリダイレクト、認証済みの場合 `home.tsx` を表示。

---

## 補足: Supabase移行時のRow Level Security（RLS）

Supabaseを使う場合、RLSポリシーを設定することでDBレベルのアクセス制御が可能になる。  
現在はアプリ側で `userId` 条件を全クエリに付けているが、RLSに移行するとより安全になる。

```sql
-- 例: bookmarksテーブルのRLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid()::text = user_id);
```

ただしSupabase Authを使わない場合（独自JWTの場合）はRLSの設定が複雑になるため、  
アプリ側での `userId` フィルタリングを継続する方が安全・シンプル。
