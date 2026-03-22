import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkIcon, Languages, ArrowLeft, HelpCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type Language = 'ja' | 'en';

const content = {
  ja: {
    title: "ブックマークキャンバス",
    subtitle: "ログインまたは新規登録",
    login: {
      tab: "ログイン",
      username: "ユーザー名",
      password: "パスワード",
      button: "ログイン",
      loading: "ログイン中...",
    },
    register: {
      tab: "新規登録",
      username: "ユーザー名",
      password: "パスワード",
      displayName: "表示名（任意）",
      button: "登録",
      loading: "登録中...",
    },
    backToHome: "トップに戻る",
    guide: "使い方ガイド",
  },
  en: {
    title: "Bookmarks Canvas",
    subtitle: "Login or create an account",
    login: {
      tab: "Login",
      username: "Username",
      password: "Password",
      button: "Login",
      loading: "Logging in...",
    },
    register: {
      tab: "Register",
      username: "Username",
      password: "Password",
      displayName: "Display name (optional)",
      button: "Register",
      loading: "Registering...",
    },
    backToHome: "Back to Home",
    guide: "User Guide",
  },
};

export default function Auth() {
  const [language, setLanguage] = useState<Language>('ja');
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", displayName: "" });
  const { toast } = useToast();
  const t = content[language];

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/local/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ja' ? "ログイン失敗" : "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; displayName: string }) => {
      const res = await apiRequest("POST", "/api/local/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ja' ? "登録失敗" : "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: language === 'ja' ? "エラー" : "Error",
        description: language === 'ja' ? "すべての項目を入力してください" : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password) {
      toast({
        title: language === 'ja' ? "エラー" : "Error",
        description: language === 'ja' ? "ユーザー名とパスワードを入力してください" : "Please fill in username and password",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="p-6 flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.backToHome}
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

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <BookmarkIcon className="w-12 h-12 mx-auto text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t.login.tab}</TabsTrigger>
              <TabsTrigger value="register">{t.register.tab}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{t.login.tab}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">{t.login.username}</Label>
                      <Input
                        id="login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t.login.password}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? t.login.loading : t.login.button}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{t.register.tab}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">{t.register.username}</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t.register.password}</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-displayname">{t.register.displayName}</Label>
                      <Input
                        id="reg-displayname"
                        type="text"
                        value={registerData.displayName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, displayName: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? t.register.loading : t.register.button}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center">
            <Link href="/guide">
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                {t.guide}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
