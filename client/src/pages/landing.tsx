import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, Grid3X3, Smartphone, Lock, Languages } from "lucide-react";
import { Link } from "wouter";

type Language = 'ja' | 'en';

interface LandingContent {
  title: string;
  subtitle: string;
  signInButton: string;
  features: {
    dragDrop: { title: string; description: string; };
    mobile: { title: string; description: string; };
    secure: { title: string; description: string; };
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
}

const content: Record<Language, LandingContent> = {
  ja: {
    title: "あなただけのブックマーク整理ツール",
    subtitle: "ドラッグ&ドロップ機能でお気に入りのサイトを自由に配置。絵文字、テキスト、カスタム画像でブックマークを整理できます。",
    signInButton: "ログインして始める",
    features: {
      dragDrop: {
        title: "ドラッグ&ドロップ",
        description: "直感的なドラッグ&ドロップでブックマークを自由にキャンバス上に配置できます。"
      },
      mobile: {
        title: "モバイル対応",
        description: "デスクトップとモバイルの両方でタッチ操作に対応し、どこでもスムーズに使えます。"
      },
      secure: {
        title: "個人用・安全",
        description: "あなたのブックマークはプライベートで、ログイン後のみアクセス可能です。"
      }
    },
    cta: {
      title: "ブックマークを整理する準備はできましたか？",
      subtitle: "アカウントでログインして、あなた専用のランチャーを作成しましょう。",
      button: "今すぐログイン"
    }
  },
  en: {
    title: "Personal Bookmark Launcher",
    subtitle: "Create your own customizable bookmark launcher with drag & drop functionality. Organize your favorite websites with emojis, text icons, or custom images.",
    signInButton: "Sign in to Get Started",
    features: {
      dragDrop: {
        title: "Drag & Drop",
        description: "Freely arrange your bookmarks on a canvas with intuitive drag & drop functionality."
      },
      mobile: {
        title: "Mobile Friendly",
        description: "Works seamlessly on both desktop and mobile devices with touch support."
      },
      secure: {
        title: "Personal & Secure",
        description: "Your bookmarks are private and only accessible to you after logging in."
      }
    },
    cta: {
      title: "Ready to organize your bookmarks?",
      subtitle: "Sign in to start creating your personal launcher.",
      button: "Sign In Now"
    }
  }
};

export default function Landing() {
  const [language, setLanguage] = useState<Language>('ja');
  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Language Toggle */}
        <div className="flex justify-end mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 flex">
            <button
              onClick={() => setLanguage('ja')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                language === 'ja' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                language === 'en' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <BookmarkIcon className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {currentContent.title}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {currentContent.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="text-lg px-8 py-4"
              >
                {currentContent.signInButton}
              </Button>
            </Link>
            <Link href="/guide">
              <Button 
                variant="secondary"
                size="lg" 
                className="text-lg px-8 py-4"
              >
                {language === 'ja' ? '使い方ガイド' : 'User Guide'}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <Grid3X3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">{currentContent.features.dragDrop.title}</h3>
            <p className="text-gray-600">
              {currentContent.features.dragDrop.description}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">{currentContent.features.mobile.title}</h3>
            <p className="text-gray-600">
              {currentContent.features.mobile.description}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">{currentContent.features.secure.title}</h3>
            <p className="text-gray-600">
              {currentContent.features.secure.description}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {currentContent.cta.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {currentContent.cta.subtitle}
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4"
            >
              {currentContent.cta.button}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}