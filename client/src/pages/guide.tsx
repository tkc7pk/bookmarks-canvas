import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkIcon, Languages, ArrowLeft, MousePointer2, Plus, Edit, Move, Grid3X3, Settings, Smartphone, Monitor, TabletSmartphone, StickyNote, Palette } from "lucide-react";
import { Link } from "wouter";

type Language = 'ja' | 'en';

interface GuideContent {
  title: string;
  subtitle: string;
  backToHome: string;
  tabs: {
    overview: string;
    basic: string;
    advanced: string;
    mobile: string;
  };
  overview: {
    title: string;
    description: string;
    features: Array<{
      icon: React.ReactNode;
      title: string;
      description: string;
    }>;
  };
  basic: {
    title: string;
    steps: Array<{
      title: string;
      description: string;
      tips?: string;
    }>;
  };
  advanced: {
    title: string;
    features: Array<{
      title: string;
      description: string;
      usage: string;
    }>;
  };
  mobile: {
    title: string;
    instructions: Array<{
      title: string;
      description: string;
    }>;
  };
}

const content: Record<Language, GuideContent> = {
  ja: {
    title: "使い方ガイド",
    subtitle: "ブックマーク整理ツールの完全ガイド",
    backToHome: "ホームに戻る",
    tabs: {
      overview: "概要",
      basic: "基本操作",
      advanced: "高度な機能",
      mobile: "モバイル版"
    },
    overview: {
      title: "ブックマーク整理ツールとは",
      description: "お気に入りのウェブサイトを自由に配置・整理できるビジュアルなブックマーク管理ツールです。",
      features: [
        {
          icon: <MousePointer2 className="w-6 h-6" />,
          title: "ドラッグ&ドロップ",
          description: "ブックマークやカテゴリを自由に配置"
        },
        {
          icon: <Grid3X3 className="w-6 h-6" />,
          title: "カテゴリ整理",
          description: "色分けされたカテゴリでブックマークを分類"
        },
        {
          icon: <Settings className="w-6 h-6" />,
          title: "カスタマイズ",
          description: "アイコンや色を自由に変更可能"
        },
        {
          icon: <TabletSmartphone className="w-6 h-6" />,
          title: "ワークスペースタブ",
          description: "複数のタブで異なるワークスペースを管理"
        },
        {
          icon: <StickyNote className="w-6 h-6" />,
          title: "付箋メモ",
          description: "色とフォントが選べる自由な付箋機能"
        }
      ]
    },
    basic: {
      title: "基本的な使い方",
      steps: [
        {
          title: "1. ブックマークを作成",
          description: "左サイドバーの「ブックマーク追加」ボタンをクリックして、URLとタイトルを入力します。アイコンは絵文字、テキスト、カスタム画像から選択できます。",
          tips: "💡 URLを入力すると、自動的にサイトのタイトルが取得されます"
        },
        {
          title: "2. カテゴリを作成",
          description: "「カテゴリ追加」ボタンでカテゴリを作成し、色とサイズをカスタマイズできます。カテゴリはブックマークをグループ化するフレームとして機能します。",
          tips: "💡 カテゴリの色は12色から選択できます"
        },
        {
          title: "3. ドラッグ&ドロップで配置",
          description: "作成したブックマークやカテゴリをマウスでドラッグして、キャンバス上の好きな位置に配置します。",
          tips: "💡 グリッド表示をオンにすると、きれいに整列できます"
        },
        {
          title: "4. 付箋メモを追加",
          description: "「付箋追加」ボタンでメモを作成できます。フォント、色、サイズを自由にカスタマイズして、重要な情報を記録しましょう。",
          tips: "💡 付箋は右クリックで編集・削除できます"
        },
        {
          title: "5. ワークスペースタブを活用",
          description: "上部のタブバーから新しいタブを作成して、プロジェクトや用途別に独立したワークスペースを管理できます。",
          tips: "💡 各タブは独立したキャンバスを持ち、ブックマーク・カテゴリ・付箋が分離されます"
        },
        {
          title: "6. ダブルクリックでサイトを開く",
          description: "配置したブックマークをダブルクリックすると、新しいタブでウェブサイトが開きます。",
          tips: "💡 長押しでも編集メニューが表示されます"
        }
      ]
    },
    advanced: {
      title: "高度な機能",
      features: [
        {
          title: "カテゴリのリサイズ",
          description: "カテゴリの枠をドラッグしてサイズを変更",
          usage: "カテゴリの角をドラッグするとサイズを変更できます"
        },
        {
          title: "グリッド表示",
          description: "整列用のグリッドを表示",
          usage: "右上のグリッドボタンをクリックして、配置の目安にします"
        },
        {
          title: "一括編集",
          description: "複数のブックマークを効率的に管理",
          usage: "右クリックメニューから編集・削除が可能です"
        },
        {
          title: "ワークスペースタブ",
          description: "複数のタブで異なるワークスペースを管理",
          usage: "上部のタブバーから新しいタブを作成して、プロジェクトや用途別に分けて管理できます。各タブは完全に独立したキャンバスを持ち、ブックマーク、カテゴリ、付箋メモがそれぞれ分離されます。タブをクリックして切り替えると、そのタブ専用のコンテンツのみが表示されます。"
        },
        {
          title: "付箋メモ機能",
          description: "自由にカスタマイズできるメモ機能",
          usage: "色、フォント、サイズを変更して重要な情報を視覚的に整理できます"
        }
      ]
    },
    mobile: {
      title: "モバイル版の操作",
      instructions: [
        {
          title: "タッチ操作",
          description: "指でブックマークやカテゴリをドラッグして移動できます"
        },
        {
          title: "ダブルタップ",
          description: "ブックマークをダブルタップするとサイトが開きます"
        },
        {
          title: "長押し",
          description: "長押しで編集メニューが表示されます"
        },
        {
          title: "サイドバー",
          description: "画面左上のメニューボタンでサイドバーを開閉できます"
        }
      ]
    }
  },
  en: {
    title: "User Guide",
    subtitle: "Complete guide for bookmark organizer",
    backToHome: "Back to Home",
    tabs: {
      overview: "Overview",
      basic: "Basic Usage",
      advanced: "Advanced Features",
      mobile: "Mobile Version"
    },
    overview: {
      title: "About Bookmark Organizer",
      description: "A visual bookmark management tool that allows you to freely arrange and organize your favorite websites.",
      features: [
        {
          icon: <MousePointer2 className="w-6 h-6" />,
          title: "Drag & Drop",
          description: "Freely arrange bookmarks and categories"
        },
        {
          icon: <Grid3X3 className="w-6 h-6" />,
          title: "Category Organization",
          description: "Classify bookmarks with color-coded categories"
        },
        {
          icon: <Settings className="w-6 h-6" />,
          title: "Customization",
          description: "Freely change icons and colors"
        },
        {
          icon: <TabletSmartphone className="w-6 h-6" />,
          title: "Workspace Tabs",
          description: "Manage multiple workspaces with tabs"
        },
        {
          icon: <StickyNote className="w-6 h-6" />,
          title: "Sticky Notes",
          description: "Customizable notes with colors and fonts"
        }
      ]
    },
    basic: {
      title: "Basic Usage",
      steps: [
        {
          title: "1. Create Bookmark",
          description: "Click 'Add Bookmark' in the left sidebar and enter URL and title. Choose from emoji, text, or custom image icons.",
          tips: "💡 Site title is automatically fetched when you enter a URL"
        },
        {
          title: "2. Create Category",
          description: "Use 'Add Category' button to create categories and customize color and size. Categories function as frames to group bookmarks.",
          tips: "💡 Choose from 12 different colors for categories"
        },
        {
          title: "3. Drag & Drop Arrangement",
          description: "Drag created bookmarks and categories to arrange them anywhere on the canvas.",
          tips: "💡 Turn on grid display for neat alignment"
        },
        {
          title: "4. Add Sticky Notes",
          description: "Use 'Add Note' button to create customizable memos. Change font, color, and size to record important information.",
          tips: "💡 Right-click notes to edit or delete"
        },
        {
          title: "5. Use Workspace Tabs",
          description: "Create new tabs from the top tab bar to manage independent workspaces by project or purpose.",
          tips: "💡 Each tab has its own canvas with separate bookmarks, categories, and notes"
        },
        {
          title: "6. Double-click to Open Sites",
          description: "Double-click arranged bookmarks to open websites in new tabs.",
          tips: "💡 Long press also shows edit menu"
        }
      ]
    },
    advanced: {
      title: "Advanced Features",
      features: [
        {
          title: "Category Resizing",
          description: "Change category size by dragging",
          usage: "Drag category corners to resize"
        },
        {
          title: "Grid Display",
          description: "Show alignment grid",
          usage: "Click grid button in top-right for placement guide"
        },
        {
          title: "Bulk Editing",
          description: "Efficiently manage multiple bookmarks",
          usage: "Right-click menu allows editing and deletion"
        },
        {
          title: "Workspace Tabs",
          description: "Manage multiple independent workspaces with tabs",
          usage: "Create new tabs from the top tab bar and organize by project or purpose. Each tab has its own completely independent canvas with separate bookmarks, categories, and sticky notes. Click tabs to switch between workspaces and see only that tab's content."
        },
        {
          title: "Sticky Notes Feature",
          description: "Freely customizable memo function",
          usage: "Change colors, fonts, and sizes to visually organize important information"
        }
      ]
    },
    mobile: {
      title: "Mobile Operations",
      instructions: [
        {
          title: "Touch Operations",
          description: "Drag bookmarks and categories with your finger"
        },
        {
          title: "Double Tap",
          description: "Double-tap bookmarks to open sites"
        },
        {
          title: "Long Press",
          description: "Long press shows edit menu"
        },
        {
          title: "Sidebar",
          description: "Use menu button in top-left to open/close sidebar"
        }
      ]
    }
  }
};

// 操作例のアニメーション用コンポーネント
const AnimatedDemo = ({ type, language }: { type: 'drag' | 'click' | 'category' | 'note' | 'tab', language: Language }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  if (type === 'drag') {
    return (
      <div className="relative bg-slate-100 rounded-lg p-4 h-32 overflow-hidden border-2 border-dashed border-slate-300">
        <div 
          className={`absolute w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm transition-all duration-2000 cursor-pointer ${
            isAnimating ? 'transform translate-x-20 translate-y-8' : ''
          }`}
          onClick={startAnimation}
        >
          📚
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-slate-600">
          {language === 'ja' ? 'クリックでアニメーション表示' : 'Click to show animation'}
        </div>
      </div>
    );
  }

  if (type === 'click') {
    return (
      <div className="relative bg-slate-100 rounded-lg p-4 h-32 overflow-hidden border-2 border-dashed border-slate-300">
        <div 
          className={`absolute w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm cursor-pointer transition-all duration-300 ${
            isAnimating ? 'scale-110 ring-4 ring-green-300' : ''
          }`}
          onClick={startAnimation}
        >
          🌐
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-slate-600">
          {language === 'ja' ? 'ダブルクリックでサイトを開く' : 'Double-click to open site'}
        </div>
      </div>
    );
  }

  if (type === 'category') {
    return (
      <div className="relative bg-slate-100 rounded-lg p-4 h-32 overflow-hidden border-2 border-dashed border-slate-300">
        <div 
          className={`absolute border-2 border-purple-400 border-dashed rounded-lg bg-purple-100 bg-opacity-20 transition-all duration-2000 ${
            isAnimating ? 'w-20 h-16' : 'w-16 h-12'
          }`}
          onClick={startAnimation}
        >
          <div className="absolute top-1 left-1 w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center">
            📖
          </div>
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-slate-600">
          {language === 'ja' ? 'カテゴリのリサイズ例' : 'Category resize example'}
        </div>
      </div>
    );
  }

  if (type === 'note') {
    return (
      <div className="relative bg-slate-100 rounded-lg p-4 h-32 overflow-hidden border-2 border-dashed border-slate-300">
        <div 
          className={`absolute w-16 h-12 rounded-md shadow-md cursor-pointer transition-all duration-1000 ${
            isAnimating ? 'bg-yellow-200 scale-110' : 'bg-yellow-100'
          }`}
          style={{ 
            left: isAnimating ? '60px' : '20px',
            top: isAnimating ? '40px' : '20px'
          }}
          onClick={startAnimation}
        >
          <div className="p-1 text-xs text-gray-700">
            {language === 'ja' ? 'メモ' : 'Note'}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-slate-600">
          {language === 'ja' ? '付箋メモの作成例' : 'Sticky note creation'}
        </div>
      </div>
    );
  }

  if (type === 'tab') {
    return (
      <div className="relative bg-slate-100 rounded-lg p-4 h-32 overflow-hidden border-2 border-dashed border-slate-300">
        <div className="flex gap-1 mb-2">
          <div className={`px-3 py-1 rounded-t-lg text-xs border-b-2 cursor-pointer transition-all duration-500 ${
            isAnimating ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300'
          }`} onClick={startAnimation}>
            {language === 'ja' ? 'メイン' : 'Main'}
          </div>
          <div className={`px-3 py-1 rounded-t-lg text-xs border-b-2 cursor-pointer transition-all duration-500 ${
            isAnimating ? 'bg-white text-gray-600 border-gray-300' : 'bg-blue-500 text-white border-blue-500'
          }`} onClick={startAnimation}>
            {language === 'ja' ? 'プロジェクト' : 'Project'}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-slate-600">
          {language === 'ja' ? 'タブ切り替えの例' : 'Tab switching example'}
        </div>
      </div>
    );
  }

  return null;
};

export default function Guide() {
  const [language, setLanguage] = useState<Language>('ja');
  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {currentContent.backToHome}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">{currentContent.title}</h1>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
          className="flex items-center gap-2"
        >
          <Languages className="w-4 h-4" />
          {language === 'ja' ? 'EN' : 'JA'}
        </Button>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600">{currentContent.subtitle}</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{currentContent.tabs.overview}</TabsTrigger>
            <TabsTrigger value="basic">{currentContent.tabs.basic}</TabsTrigger>
            <TabsTrigger value="advanced">{currentContent.tabs.advanced}</TabsTrigger>
            <TabsTrigger value="mobile">{currentContent.tabs.mobile}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookmarkIcon className="w-5 h-5" />
                  {currentContent.overview.title}
                </CardTitle>
                <CardDescription>{currentContent.overview.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {currentContent.overview.features.map((feature, index) => (
                    <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-blue-600 mb-3 flex justify-center">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Basic Usage Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{currentContent.basic.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.basic.steps.map((step, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-4">
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-gray-700 mb-2">{step.description}</p>
                    {step.tips && (
                      <Badge variant="secondary" className="text-xs">
                        {step.tips}
                      </Badge>
                    )}
                    {index === 2 && (
                      <div className="mt-4">
                        <AnimatedDemo type="drag" language={language} />
                      </div>
                    )}
                    {index === 3 && (
                      <div className="mt-4">
                        <AnimatedDemo type="note" language={language} />
                      </div>
                    )}
                    {index === 4 && (
                      <div className="mt-4">
                        <AnimatedDemo type="tab" language={language} />
                      </div>
                    )}
                    {index === 5 && (
                      <div className="mt-4">
                        <AnimatedDemo type="click" language={language} />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Features Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{currentContent.advanced.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentContent.advanced.features.map((feature, index) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-700 mb-2">{feature.description}</p>
                    <p className="text-sm text-blue-600">{feature.usage}</p>
                    {index === 0 && (
                      <div className="mt-4">
                        <AnimatedDemo type="category" language={language} />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile Version Tab */}
          <TabsContent value="mobile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  {currentContent.mobile.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {currentContent.mobile.instructions.map((instruction, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">{instruction.title}</h3>
                      <p className="text-gray-700">{instruction.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Device Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ja' ? 'デバイス別操作比較' : 'Device Operation Comparison'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <Monitor className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                    <h3 className="font-semibold mb-2">
                      {language === 'ja' ? 'デスクトップ' : 'Desktop'}
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>{language === 'ja' ? 'マウス操作' : 'Mouse operations'}</li>
                      <li>{language === 'ja' ? 'ダブルクリック' : 'Double-click'}</li>
                      <li>{language === 'ja' ? '右クリックメニュー' : 'Right-click menu'}</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <Smartphone className="w-8 h-8 mx-auto mb-3 text-green-600" />
                    <h3 className="font-semibold mb-2">
                      {language === 'ja' ? 'モバイル' : 'Mobile'}
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>{language === 'ja' ? 'タッチ操作' : 'Touch operations'}</li>
                      <li>{language === 'ja' ? 'ダブルタップ' : 'Double-tap'}</li>
                      <li>{language === 'ja' ? '長押しメニュー' : 'Long-press menu'}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}