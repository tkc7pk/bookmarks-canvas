import React from 'react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            📚 プロジェクト文書
          </h1>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                🗄️ データベース設計書
              </h2>
              <p className="text-gray-600 mb-3">
                アプリケーションのデータベース構造、テーブル定義、ER図を含む包括的な設計書です。
              </p>
              <a
                href="/docs/database-design.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                📖 設計書を開く
                <svg 
                  className="ml-2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                  />
                </svg>
              </a>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                📋 含まれる内容
              </h2>
              <ul className="text-gray-600 space-y-1 ml-4">
                <li>• システム概要と主要機能</li>
                <li>• 全7テーブルの詳細仕様</li>
                <li>• ER図とリレーション関係</li>
                <li>• 認証システム（Replit + ローカル）</li>
                <li>• セキュリティとパフォーマンス情報</li>
                <li>• 運用考慮事項</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-blue-800 font-medium mb-2">💡 ヒント</h3>
              <p className="text-blue-700 text-sm">
                設計書は新しいタブで開きます。印刷やPDF保存も可能です。
                ブラウザの開発者ツールでHTML構造も確認できます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}