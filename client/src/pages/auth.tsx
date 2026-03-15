import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookmarkIcon, Languages, ArrowLeft, HelpCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type Language = 'ja' | 'en';

interface AuthContent {
  title: string;
  subtitle: string;
  localLogin: {
    title: string;
    username: string;
    password: string;
    loginButton: string;
    loggingIn: string;
  };
  replitLogin: string;
  backToHome: string;
}

const content: Record<Language, AuthContent> = {
  ja: {
    title: "ローカル認証 & Replit認証",
    subtitle: "どちらの方法でもログインできます",
    localLogin: {
      title: "ローカルアカウント",
      username: "ユーザー名",
      password: "パスワード",
      loginButton: "ログイン",
      loggingIn: "ログイン中..."
    },
    replitLogin: "Replitアカウントでログイン",
    backToHome: "通常のページに戻る"
  },
  en: {
    title: "Local & Replit Authentication",
    subtitle: "Login with either method",
    localLogin: {
      title: "Local Account",
      username: "Username",
      password: "Password", 
      loginButton: "Login",
      loggingIn: "Logging in..."
    },
    replitLogin: "Login with Replit Account",
    backToHome: "Back to Main Page"
  }
};

export default function Auth() {
  const [language, setLanguage] = useState<Language>('ja');
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { toast } = useToast();

  // Add debugging
  console.log('Auth page component rendered');

  const currentContent = content[language];

  const localLoginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/local/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: language === 'ja' ? "ログイン成功" : "Login successful",
        description: language === 'ja' ? "ホームページに移動します" : "Redirecting to home page",
      });
      // Redirect to home
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ja' ? "ログイン失敗" : "Login failed",
        description: error.message || (language === 'ja' ? "ユーザー名またはパスワードが正しくありません" : "Invalid username or password"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({
        title: language === 'ja' ? "エラー" : "Error",
        description: language === 'ja' ? "すべての項目を入力してください" : "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    localLoginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {currentContent.backToHome}
          </Button>
        </Link>
        
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
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <BookmarkIcon className="w-12 h-12 mx-auto text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {currentContent.title}
            </h1>
            <p className="text-gray-600">
              {currentContent.subtitle}
            </p>
          </div>

          {/* Local Login Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{currentContent.localLogin.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{currentContent.localLogin.username}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={language === 'ja' ? 'test001' : 'Enter username'}
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{currentContent.localLogin.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={language === 'ja' ? 'パスワードを入力' : 'Enter password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={localLoginMutation.isPending}
                >
                  {localLoginMutation.isPending ? currentContent.localLogin.loggingIn : currentContent.localLogin.loginButton}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Separator */}
          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-gradient-to-br from-blue-50 to-indigo-100 px-2 text-sm text-gray-500">
                {language === 'ja' ? 'または' : 'or'}
              </span>
            </div>
          </div>

          {/* Replit Login */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = "/api/login"}
          >
            {currentContent.replitLogin}
          </Button>

          {/* App Info and Guide Links */}
          <div className="flex gap-2 justify-center">
            <Link href="/guide">
              <Button 
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {language === 'ja' ? '使い方ガイド' : 'User Guide'}
              </Button>
            </Link>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>
              {language === 'ja' 
                ? 'ブックマークを自由に配置し、ドラッグ&ドロップで整理できるカスタマイズ可能なランチャーアプリです。'
                : 'A customizable launcher app where you can freely arrange bookmarks and organize them with drag & drop.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}