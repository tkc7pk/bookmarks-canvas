import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, Edit, Trash2, Menu, Grid3X3, BookmarkIcon, LogOut, User, HelpCircle, StickyNote, Palette, Type, X, FolderPlus } from "lucide-react";
import { Link } from "wouter";
import type { Bookmark, InsertBookmark, Category, InsertCategory, Note, InsertNote, WorkspaceTab, InsertWorkspaceTab, UpdateWorkspaceTab } from "@shared/schema";

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  bookmarkId: number | null;
  offset: Position;
  hasMoved: boolean;
  dragTimeout?: number;
}

interface CategoryDragState {
  isDragging: boolean;
  categoryId: number | null;
  isResizing: boolean;
  offset: Position;
  hasMoved: boolean;
}

interface TapState {
  lastTapTime: number;
  lastTapBookmarkId: number | null;
}

interface LongPressState {
  isLongPress: boolean;
  timeoutId: number | null;
}

const EMOJI_OPTIONS = [
  // 技術・開発
  "🌐", "📱", "💻", "🖥️", "⚙️", "🔧", "🔨", "🛠️", "🔍", "💾", "🖱️", "⌨️", "🔌", "📡", "🔬", "🧪",
  
  // コミュニケーション
  "📧", "💬", "📞", "📟", "📠", "📮", "📫", "📪", "📬", "📭", "📋", "📝", "✉️", "📨", "📩", "📤", "📥",
  
  // エンターテイメント
  "🎮", "🕹️", "🎵", "🎶", "🎧", "🎤", "🎬", "🎭", "🎨", "🎪", "🎰", "🎲", "🃏", "🎯", "🎳", "🎸", "🥁", "🎹", "🎺", "🎷",
  
  // 学習・仕事
  "📚", "📖", "📓", "📔", "📕", "📗", "📘", "📙", "📒", "📄", "📃", "📑", "📊", "📈", "📉", "🗂️", "📁", "📂", "🗃️", "🗄️",
  
  // 食べ物
  "🍕", "🍔", "🍟", "🌭", "🥪", "🌮", "🌯", "🥙", "🥗", "🍝", "🍜", "🍲", "🍱", "🍣", "🍤", "🍙", "🍚", "🍛", "🍳", "🥚",
  
  // 交通・旅行
  "✈️", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🚁",
  
  // 建物・場所
  "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "🗼", "🗽", "⛪", "🕌", "🛕",
  
  // スポーツ・活動
  "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅", "⛳", "🏁", "🚩", "🎣", "🤿", "🏊", "🏄", "🚣",
  
  // 自然・天気
  "☀️", "🌙", "⭐", "🌟", "💫", "✨", "☁️", "⛅", "🌤️", "🌦️", "🌧️", "⛈️", "🌩️", "❄️", "☃️", "⛄", "🌈", "🌍", "🌎", "🌏",
  
  // ハート・感情
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "😊", "😄", "😃", "😁",
  
  // 記号・マーク
  "✅", "❌", "⭕", "❓", "❗", "💯", "🔥", "⚡", "💥", "💢", "💤", "💨", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉"
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [editModal, setEditModal] = useState<{ isOpen: boolean; bookmark?: Bookmark }>({ isOpen: false });
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, bookmarkId: null, offset: { x: 0, y: 0 }, hasMoved: false });
  const [categoryDragState, setCategoryDragState] = useState<CategoryDragState>({ 
    isDragging: false, 
    categoryId: null, 
    isResizing: false, 
    offset: { x: 0, y: 0 }, 
    hasMoved: false 
  });
  const [tapState, setTapState] = useState<TapState>({
    lastTapTime: 0,
    lastTapBookmarkId: null,
  });
  const [longPressState, setLongPressState] = useState<LongPressState>({
    isLongPress: false,
    timeoutId: null,
  });
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    icon: "",
    iconType: "emoji" as "emoji" | "image" | "text",
  });
  const [categoryFormData, setCategoryFormData] = useState<InsertCategory>({
    name: "",
    color: "#3b82f6",
    backgroundStyle: "border",
    x: 0,
    y: 0,
    width: 300,
    height: 200,
  });
  const [categoryModal, setCategoryModal] = useState<{ isOpen: boolean; category?: Category }>({ isOpen: false });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [noteModal, setNoteModal] = useState<{ isOpen: boolean; note?: Note }>({ isOpen: false });
  const [tabModal, setTabModal] = useState<{ isOpen: boolean; tab?: WorkspaceTab }>({ isOpen: false });
  const [newTabName, setNewTabName] = useState("");
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [noteFormData, setNoteFormData] = useState<InsertNote>({
    content: "",
    x: 150,
    y: 150,
    width: 200,
    height: 150,
    backgroundColor: "#fef3c7",
    textColor: "#1f2937",
    fontSize: 14,
  });
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDragState, setNoteDragState] = useState<{
    isDragging: boolean;
    noteId: number | null;
    offset: Position;
    tempPosition: Position | null;
    isResizing: boolean;
    tempSize: { width: number; height: number } | null;
  }>({
    isDragging: false,
    noteId: null,
    offset: { x: 0, y: 0 },
    tempPosition: null,
    isResizing: false,
    tempSize: null,
  });

  // Category touch state for long press
  const [categoryTouchState, setCategoryTouchState] = useState<{
    isLongPressing: boolean;
    timeoutId: number | null;
    category: Category | null;
    isResizeHandle: boolean;
    initialTouch: { x: number; y: number } | null;
  }>({
    isLongPressing: false,
    timeoutId: null,
    category: null,
    isResizeHandle: false,
    initialTouch: null,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Window size state for responsive canvas
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch notes
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  // Fetch workspace tabs
  const { data: workspaceTabs = [] } = useQuery<WorkspaceTab[]>({
    queryKey: ["/api/workspace-tabs"],
  });

  // Filter content based on active tab
  const activeTabBookmarks = bookmarks.filter(b => 
    activeTabId === null ? b.tabId === null : b.tabId === activeTabId
  );
  const activeTabCategories = categories.filter(c => 
    activeTabId === null ? c.tabId === null : c.tabId === activeTabId
  );
  const activeTabNotes = notes.filter(n => 
    activeTabId === null ? n.tabId === null : n.tabId === activeTabId
  );

  // Create bookmark mutation
  const createBookmarkMutation = useMutation({
    mutationFn: async (data: InsertBookmark) => {
      const bookmarkData = { ...data, tabId: activeTabId };
      const response = await apiRequest("POST", "/api/bookmarks", bookmarkData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setFormData({ title: "", url: "", icon: "", iconType: "emoji" });
      toast({ title: "Success", description: "Bookmark added successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to add bookmark", variant: "destructive" });
    },
  });

  // Update bookmark mutation (for general updates with toast)
  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Bookmark> }) => {
      const response = await apiRequest("PATCH", `/api/bookmarks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ title: "Success", description: "Bookmark updated successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update bookmark", variant: "destructive" });
    },
  });

  // Silent update bookmark mutation (for position updates without toast)
  const silentUpdateBookmarkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Bookmark> }) => {
      const response = await apiRequest("PATCH", `/api/bookmarks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      // Silent error for position updates - no toast notification
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ title: "Success", description: "Bookmark deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete bookmark", variant: "destructive" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const categoryData = { ...data, tabId: activeTabId };
      const response = await apiRequest("POST", "/api/categories", categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryFormData({ name: "", color: "#3b82f6", backgroundStyle: "border", x: 0, y: 0, width: 300, height: 200 });
      toast({ title: "Success", description: "Category created successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const response = await apiRequest("PATCH", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category updated successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category deleted successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  // Note mutations
  const createNoteMutation = useMutation({
    mutationFn: async (data: InsertNote) => {
      const noteData = { ...data, tabId: activeTabId };
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNoteFormData({
        content: "",
        x: 150,
        y: 150,
        width: 200,
        height: 150,
        backgroundColor: "#fef3c7",
        textColor: "#1f2937",
        fontSize: 14,
      });
      setNoteModal({ isOpen: false });
      toast({ title: "Success", description: "付箋を作成しました！" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "付箋の作成に失敗しました", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertNote>) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      // Silent error for position updates
    },
  });

  // Silent mutation for note position/size updates with optimistic updates
  const silentUpdateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertNote> }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, data);
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      // Optimistically update the cache
      queryClient.setQueryData(["/api/notes"], (oldData: Note[]) => 
        oldData?.map(note => 
          note.id === id ? { ...note, ...data } : note
        ) || []
      );
    },
    onError: () => {
      // Silent error handling - could revert optimistic update here if needed
    },
  });

  // Tab creation mutation
  const createTabMutation = useMutation({
    mutationFn: async (data: InsertWorkspaceTab) => {
      const response = await apiRequest("POST", "/api/workspace-tabs", data);
      return response.json();
    },
    onSuccess: (newTab) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspace-tabs"] });
      setTabModal({ isOpen: false });
      setNewTabName("");
      setActiveTabId(newTab.id); // Automatically switch to new tab
      toast({ title: "成功", description: "新しいタブが作成されました！" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "エラー", description: "タブの作成に失敗しました", variant: "destructive" });
    },
  });

  // Optimized note update for dragging (debounced)
  const updateNotePositionMutation = useMutation({
    mutationFn: async ({ id, x, y }: { id: number; x: number; y: number }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, { x, y });
      return response.json();
    },
    onError: () => {
      // Silent error for position updates
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({ title: "Success", description: "付箋を削除しました！" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "付箋の削除に失敗しました", variant: "destructive" });
    },
  });

  const silentUpdateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const response = await apiRequest("PATCH", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url || !formData.icon) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    // Calculate a default position that avoids overlap
    const existingPositions = placedBookmarks.map(b => ({ x: b.x, y: b.y }));
    let defaultX = 100;
    let defaultY = 100;
    
    // Find an empty spot
    while (existingPositions.some(pos => 
      Math.abs(pos.x - defaultX) < 100 && Math.abs(pos.y - defaultY) < 100
    )) {
      defaultX += 120;
      if (defaultX > 800) {
        defaultX = 100;
        defaultY += 120;
      }
    }

    createBookmarkMutation.mutate({
      title: formData.title,
      url: formData.url,
      icon: formData.icon,
      iconType: formData.iconType,
      x: defaultX,
      y: defaultY,
      isPlaced: 1, // Automatically place on canvas
    });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast({ title: "Error", description: "Please enter a category name", variant: "destructive" });
      return;
    }

    // Calculate a default position that avoids overlap
    const existingPositions = categories.map(c => ({ x: c.x, y: c.y }));
    let defaultX = 50;
    let defaultY = 50;
    
    // Find an empty spot for the category
    while (existingPositions.some(pos => 
      Math.abs(pos.x - defaultX) < 320 && Math.abs(pos.y - defaultY) < 220
    )) {
      defaultX += 350;
      if (defaultX > 700) {
        defaultX = 50;
        defaultY += 250;
      }
    }

    createCategoryMutation.mutate({
      ...categoryFormData,
      x: defaultX,
      y: defaultY,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.bookmark) return;

    const form = new FormData(e.target as HTMLFormElement);
    const title = form.get("title") as string;
    const url = form.get("url") as string;

    updateBookmarkMutation.mutate({
      id: editModal.bookmark.id,
      data: { title, url },
    });
    setEditModal({ isOpen: false });
  };

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, icon: result, iconType: "image" }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - bookmark.x;
    const offsetY = e.clientY - rect.top - bookmark.y;
    
    setDragState({
      isDragging: true,
      bookmarkId: bookmark.id,
      offset: { x: offsetX, y: offsetY },
      hasMoved: false,
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, bookmark: Bookmark) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canvasRef.current) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left - bookmark.x;
    const offsetY = touch.clientY - rect.top - bookmark.y;
    
    // Store the initial state but don't set isDragging immediately
    // This allows for tap detection while still being ready for drag
    setDragState({
      isDragging: false, // Start as false to allow tap detection
      bookmarkId: bookmark.id,
      offset: { x: offsetX, y: offsetY },
      hasMoved: false,
    });

    // Set a timeout to start dragging after a short delay
    const dragTimeout = window.setTimeout(() => {
      setDragState(prev => ({ ...prev, isDragging: true }));
    }, 150); // Short delay before enabling drag

    // Start long press detection
    const longPressTimeout = window.setTimeout(() => {
      setLongPressState({
        isLongPress: true,
        timeoutId: null,
      });
      setEditModal({ isOpen: true, bookmark });
    }, 500); // 500ms for long press

    setLongPressState({
      isLongPress: false,
      timeoutId: longPressTimeout,
    });

    // Store the drag timeout so we can clear it if needed
    if (dragState.dragTimeout) {
      clearTimeout(dragState.dragTimeout);
    }
    setDragState(prev => ({ ...prev, dragTimeout }));
  }, [setEditModal, dragState]);

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging || !canvasRef.current || !dragState.bookmarkId) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 120, clientX - rect.left - dragState.offset.x));
    const y = Math.max(0, Math.min(rect.height - 120, clientY - rect.top - dragState.offset.y));
    
    // Mark that the bookmark has moved
    setDragState(prev => ({ ...prev, hasMoved: true }));
    
    // Update the position in real-time without waiting for server response
    const bookmark = bookmarks.find(b => b.id === dragState.bookmarkId);
    if (bookmark) {
      // Optimistic update - update the local state immediately
      queryClient.setQueryData(["/api/bookmarks"], (oldData: Bookmark[]) => 
        oldData?.map(b => 
          b.id === dragState.bookmarkId ? { ...b, x, y, isPlaced: 1 } : b
        ) || []
      );
    }
  }, [dragState, bookmarks, queryClient]);

  const updateCategoryPosition = useCallback((clientX: number, clientY: number) => {
    if (!categoryDragState.isDragging || !categoryDragState.categoryId || !canvasRef.current) return;

    const category = categories.find(c => c.id === categoryDragState.categoryId);
    if (!category) return;

    // Get canvas bounds for proper coordinate conversion
    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (categoryDragState.isResizing) {
      // Update size optimistically without API call
      // For resizing, calculate based on canvas-relative coordinates
      const canvasX = clientX - canvasRect.left;
      const canvasY = clientY - canvasRect.top;
      const newWidth = Math.max(150, canvasX - category.x);
      const newHeight = Math.max(100, canvasY - category.y);
      
      // Optimistic update - update the local state immediately
      queryClient.setQueryData(["/api/categories"], (oldData: Category[]) => 
        oldData?.map(c => 
          c.id === categoryDragState.categoryId ? { ...c, width: newWidth, height: newHeight } : c
        ) || []
      );
    } else {
      // Update position optimistically without API call
      // Convert client coordinates to canvas-relative coordinates
      const newX = Math.max(0, clientX - canvasRect.left - categoryDragState.offset.x);
      const newY = Math.max(0, clientY - canvasRect.top - categoryDragState.offset.y);
      
      // Optimistic update - update the local state immediately
      queryClient.setQueryData(["/api/categories"], (oldData: Category[]) => 
        oldData?.map(c => 
          c.id === categoryDragState.categoryId ? { ...c, x: newX, y: newY } : c
        ) || []
      );
    }

    setCategoryDragState(prev => ({ ...prev, hasMoved: true }));
  }, [categoryDragState, categories, queryClient]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
    updateCategoryPosition(e.clientX, e.clientY);
    
    // Handle note dragging
    if (noteDragState.isDragging && noteDragState.noteId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = e.clientX - rect.left - noteDragState.offset.x;
      const newY = e.clientY - rect.top - noteDragState.offset.y;

      const clampedX = Math.max(0, newX);
      const clampedY = Math.max(0, newY);

      setNoteDragState(prev => ({
        ...prev,
        tempPosition: { x: clampedX, y: clampedY },
      }));

      // Also update the cache immediately for visual feedback
      queryClient.setQueryData(["/api/notes"], (oldData: Note[]) => 
        oldData?.map(note => 
          note.id === noteDragState.noteId ? { ...note, x: clampedX, y: clampedY } : note
        ) || []
      );
    }
  }, [updatePosition, updateCategoryPosition, noteDragState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragState.isDragging || categoryDragState.isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Cancel long press if finger moves
    if (longPressState.timeoutId) {
      clearTimeout(longPressState.timeoutId);
      setLongPressState({
        isLongPress: false,
        timeoutId: null,
      });
    }
    
    // Cancel category long press if finger moves significantly
    if (categoryTouchState.timeoutId && categoryTouchState.initialTouch && e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - categoryTouchState.initialTouch.x);
      const deltaY = Math.abs(touch.clientY - categoryTouchState.initialTouch.y);
      
      // If moved more than 10px, cancel long press and allow scrolling
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(categoryTouchState.timeoutId);
        setCategoryTouchState(prev => ({
          ...prev,
          timeoutId: null,
        }));
      }
    }
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
      updateCategoryPosition(touch.clientX, touch.clientY);
    }
  }, [updatePosition, updateCategoryPosition, dragState.isDragging, categoryDragState.isDragging, longPressState.timeoutId, categoryTouchState]);

  const endDrag = useCallback(() => {
    // Clear any pending drag timeout
    if (dragState.dragTimeout) {
      clearTimeout(dragState.dragTimeout);
    }
    
    if (dragState.isDragging && dragState.bookmarkId) {
      // Save the final position to the database silently (no toast notification)
      const bookmark = bookmarks.find(b => b.id === dragState.bookmarkId);
      if (bookmark) {
        silentUpdateBookmarkMutation.mutate({
          id: dragState.bookmarkId,
          data: { x: bookmark.x, y: bookmark.y, isPlaced: 1 },
        });
      }
    }
    
    // Reset drag state after a short delay to prevent immediate clicks
    setTimeout(() => {
      setDragState({ isDragging: false, bookmarkId: null, offset: { x: 0, y: 0 }, hasMoved: false, dragTimeout: undefined });
    }, 100);
  }, [dragState, bookmarks, silentUpdateBookmarkMutation]);

  const endCategoryDrag = useCallback(() => {
    if (categoryDragState.isDragging && categoryDragState.categoryId && categoryDragState.hasMoved) {
      // Save the final position/size to the database silently
      const category = categories.find(c => c.id === categoryDragState.categoryId);
      if (category) {
        silentUpdateCategoryMutation.mutate({
          id: categoryDragState.categoryId,
          data: { 
            x: category.x, 
            y: category.y, 
            width: category.width, 
            height: category.height 
          },
        });
      }
    }
    
    // Reset category drag state after a short delay to prevent immediate clicks
    setTimeout(() => {
      setCategoryDragState({ 
        isDragging: false, 
        categoryId: null, 
        isResizing: false, 
        offset: { x: 0, y: 0 }, 
        hasMoved: false 
      });
    }, 100);
  }, [categoryDragState, categories, silentUpdateCategoryMutation]);

  const handleMouseUp = useCallback(() => {
    endDrag();
    endCategoryDrag();
    
    // Handle note drag end
    if (noteDragState.isDragging && noteDragState.noteId && noteDragState.tempPosition) {
      silentUpdateNoteMutation.mutate({
        id: noteDragState.noteId,
        data: {
          x: noteDragState.tempPosition.x,
          y: noteDragState.tempPosition.y,
        },
      });
    }
    
    // Handle note resize end
    if (noteDragState.isResizing && noteDragState.noteId && noteDragState.tempSize) {
      silentUpdateNoteMutation.mutate({
        id: noteDragState.noteId,
        data: {
          width: noteDragState.tempSize.width,
          height: noteDragState.tempSize.height,
        },
      });
    }
    
    // Reset note drag state
    if (noteDragState.isDragging || noteDragState.isResizing) {
      setNoteDragState({
        isDragging: false,
        noteId: null,
        offset: { x: 0, y: 0 },
        tempPosition: null,
        isResizing: false,
        tempSize: null,
      });
    }
  }, [endDrag, endCategoryDrag, noteDragState, updateNotePositionMutation]);

  const handleTouchEnd = useCallback((e: React.TouchEvent, bookmark?: Bookmark) => {
    // Clear any drag timeout first
    if (dragState.dragTimeout) {
      clearTimeout(dragState.dragTimeout);
    }
    
    // Cancel long press timeout if still active
    if (longPressState.timeoutId) {
      clearTimeout(longPressState.timeoutId);
      setLongPressState({
        isLongPress: false,
        timeoutId: null,
      });
    }

    // If long press already triggered, don't handle tap
    if (longPressState.isLongPress) {
      setLongPressState({
        isLongPress: false,
        timeoutId: null,
      });
      endDrag();
      return;
    }

    // Check for double tap on mobile - simplified condition
    if (bookmark) {
      const currentTime = Date.now();
      const timeDiff = currentTime - tapState.lastTapTime;
      
      // If this is the same bookmark and within double tap time window
      if (timeDiff < 500 && timeDiff > 50 && tapState.lastTapBookmarkId === bookmark.id && !dragState.hasMoved) {
        // Double tap detected
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Double tap detected, opening:", bookmark.url);
        window.open(bookmark.url, "_blank", "noopener,noreferrer");
        
        // Reset tap state
        setTapState({
          lastTapTime: 0,
          lastTapBookmarkId: null,
        });
        
        endDrag();
        return;
      }
      
      // Single tap - update tap state only if not dragging and hasn't moved
      if (!dragState.hasMoved && !dragState.isDragging) {
        console.log("Single tap recorded for bookmark:", bookmark.id);
        setTapState({
          lastTapTime: currentTime,
          lastTapBookmarkId: bookmark.id,
        });
      }
    }
    
    endDrag();
  }, [endDrag, dragState, tapState, longPressState]);

  const handleBookmarkClick = useCallback((e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    e.stopPropagation();
    // Just prevent default behavior - no edit modal on click
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Right click opens edit modal
    setEditModal({ isOpen: true, bookmark });
  }, [setEditModal]);

  const handleBookmarkDoubleClick = useCallback((e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only open URL if we haven't dragged the bookmark
    if (!dragState.hasMoved && !dragState.isDragging) {
      try {
        window.open(bookmark.url, "_blank");
      } catch (error) {
        console.log("Navigation handled:", bookmark.url);
      }
    }
  }, [dragState.hasMoved, dragState.isDragging]);

  // Category event handlers
  const handleCategoryMouseDown = useCallback((e: React.MouseEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const isResizeHandle = e.target instanceof Element && e.target.classList.contains('resize-handle');
    
    setCategoryDragState({
      isDragging: true,
      categoryId: category.id,
      isResizing: isResizeHandle,
      offset: {
        x: isResizeHandle ? 0 : e.clientX - canvasRect.left - category.x,
        y: isResizeHandle ? 0 : e.clientY - canvasRect.top - category.y,
      },
      hasMoved: false,
    });
  }, []);

  const handleCategoryTouchStart = useCallback((e: React.TouchEvent, category: Category) => {
    // Don't prevent default immediately - allow scrolling for short touches
    e.stopPropagation();
    
    if (!canvasRef.current) return;
    
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const isResizeHandle = e.target instanceof Element && e.target.classList.contains('resize-handle');
      
      // Store initial touch state but don't start dragging yet
      setCategoryTouchState({
        isLongPressing: false,
        timeoutId: null,
        category: category,
        isResizeHandle: isResizeHandle,
        initialTouch: { x: touch.clientX, y: touch.clientY },
      });

      // Start long press timer (500ms)
      const longPressTimeout = window.setTimeout(() => {
        // Prevent scrolling once long press is detected
        e.preventDefault();
        
        setCategoryTouchState(prev => ({
          ...prev,
          isLongPressing: true,
          timeoutId: null,
        }));
        
        // Start dragging after long press
        setCategoryDragState({
          isDragging: true,
          categoryId: category.id,
          isResizing: isResizeHandle,
          offset: {
            x: isResizeHandle ? 0 : touch.clientX - canvasRect.left - category.x,
            y: isResizeHandle ? 0 : touch.clientY - canvasRect.top - category.y,
          },
          hasMoved: false,
        });
      }, 500); // 500ms for long press
      
      setCategoryTouchState(prev => ({
        ...prev,
        timeoutId: longPressTimeout,
      }));
    }
  }, []);

  const handleCategoryClick = useCallback((e: React.MouseEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the category
    setSelectedCategory(category);
  }, []);

  const handleCategoryTouchEnd = useCallback((e: React.TouchEvent, category: Category) => {
    e.stopPropagation();
    
    // Clear long press timeout if it's still active
    if (categoryTouchState.timeoutId) {
      clearTimeout(categoryTouchState.timeoutId);
    }
    
    // If long press was detected and dragging occurred, end the drag
    if (categoryTouchState.isLongPressing && categoryDragState.isDragging) {
      e.preventDefault();
      endCategoryDrag();
    } 
    // If it was a short touch without long press, treat as selection
    else if (!categoryTouchState.isLongPressing && !categoryDragState.hasMoved) {
      setSelectedCategory(category);
    }
    // If dragging was happening, end it
    else if (categoryDragState.isDragging) {
      e.preventDefault();
      endCategoryDrag();
    }
    
    // Reset category touch state
    setCategoryTouchState({
      isLongPressing: false,
      timeoutId: null,
      category: null,
      isResizeHandle: false,
      initialTouch: null,
    });
  }, [categoryTouchState, categoryDragState, endCategoryDrag]);

  const placedBookmarks = activeTabBookmarks.filter(b => b.isPlaced === 1);
  const unplacedBookmarks = activeTabBookmarks.filter(b => b.isPlaced === 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-2 min-h-[48px]">
        <div className="flex items-center space-x-1 flex-1">
          {/* Default Tab */}
          <div 
            className={`flex items-center border rounded-md px-3 py-1.5 text-sm font-medium shadow-sm cursor-pointer transition-colors ${
              activeTabId === null 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTabId(null)}
          >
            <span>メインワークスペース</span>
          </div>
          
          {/* Dynamic Workspace Tabs */}
          {workspaceTabs.map((tab) => (
            <div 
              key={tab.id}
              className={`flex items-center border rounded-md px-3 py-1.5 text-sm font-medium shadow-sm cursor-pointer transition-colors ${
                activeTabId === tab.id 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span>{tab.name}</span>
            </div>
          ))}
          
          {/* Add Tab Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTabModal({ isOpen: true })}
            className="ml-2 text-gray-500 hover:text-gray-700"
            title="新しいタブを追加"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookmarkIcon className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Smart Bookmark Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{(user as any)?.email || 'User'}</span>
              </div>
              <Link href="/guide">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center space-x-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Guide</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className="hidden sm:flex items-center space-x-2"
              >
                <Grid3X3 className="w-4 h-4" />
                <span>{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="hidden sm:flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`w-80 bg-white border-r border-slate-200 flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed sm:relative z-40 h-full overflow-y-auto`}>
          <div className="p-6 h-auto min-h-full flex flex-col">
            {/* Add Bookmark Form */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Bookmark</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">Website URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="text-sm"
                    required
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">Title</Label>
                  <Input
                    type="text"
                    placeholder="Website Name"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="text-sm"
                    required
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">Icon</Label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={formData.iconType === "emoji" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, iconType: "emoji", icon: "" }))}
                        className="text-xs"
                      >
                        😊 Emoji
                      </Button>
                      <Button
                        type="button"
                        variant={formData.iconType === "text" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, iconType: "text", icon: "" }))}
                        className="text-xs"
                      >
                        A Text
                      </Button>
                      <Button
                        type="button"
                        variant={formData.iconType === "image" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, iconType: "image", icon: "" }))}
                        className="text-xs"
                      >
                        🖼️ Image
                      </Button>
                    </div>
                    
                    {formData.iconType === "emoji" && (
                      <div className="grid grid-cols-6 gap-2 p-3 bg-slate-50 rounded-lg max-h-48 overflow-y-auto">
                        {EMOJI_OPTIONS.map((emoji, index) => (
                          <button
                            key={`${emoji}-${index}`}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                            className={`text-2xl hover:bg-slate-200 rounded p-1 transition-colors ${
                              formData.icon === emoji ? 'bg-slate-200' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {formData.iconType === "text" && (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Enter 1-2 characters (e.g., A, AB, 社)"
                          value={formData.icon}
                          onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value.slice(0, 2) }))}
                          className="text-center text-lg font-bold"
                          maxLength={2}
                        />
                        {formData.icon && (
                          <div className="flex justify-center">
                            <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                              {formData.icon}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {formData.iconType === "image" && (
                      <FileUpload onFileSelect={handleFileSelect} />
                    )}
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={createBookmarkMutation.isPending}
                  className="w-full"
                >
                  {createBookmarkMutation.isPending ? "Adding..." : "Add Bookmark"}
                </Button>
              </form>
            </div>

            {/* Add Category Form */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Add Category</h2>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">Category Name</Label>
                  <Input
                    type="text"
                    placeholder="Work, Personal, etc."
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-sm"
                    required
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">Color</Label>
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", 
                      "#6366f1", "#f97316", "#06b6d4", "#84cc16", "#d946ef", "#f43f5e",
                      "#64748b", "#374151", "#7c2d12", "#166534", "#7c3aed", "#be185d"].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCategoryFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          categoryFormData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div>
                    <Label className="block text-sm text-slate-600 mb-1">カスタム色</Label>
                    <input
                      type="color"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">表示スタイル</Label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setCategoryFormData(prev => ({ ...prev, backgroundStyle: 'border' }))}
                      className={`flex-1 py-2 px-3 rounded border text-sm ${
                        categoryFormData.backgroundStyle === 'border' 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      枠のみ
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryFormData(prev => ({ ...prev, backgroundStyle: 'fill' }))}
                      className={`flex-1 py-2 px-3 rounded border text-sm ${
                        categoryFormData.backgroundStyle === 'fill' 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      背景塗り
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="w-full"
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Add Category"}
                </Button>
              </form>
            </div>

            {/* Add Note Button */}
            <div className="mb-6">
              <Button 
                onClick={() => setNoteModal({ isOpen: true })}
                className="w-full"
                size="sm"
                variant="outline"
              >
                <StickyNote className="w-4 h-4 mr-2" />
                付箋追加
              </Button>
            </div>

            {/* Selected Category Edit Panel */}
            {selectedCategory && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Edit Category</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">Name</Label>
                    <Input
                      type="text"
                      value={selectedCategory.name}
                      onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">Color</Label>
                    <div className="grid grid-cols-6 gap-2 mb-3">
                      {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", 
                        "#6366f1", "#f97316", "#06b6d4", "#84cc16", "#d946ef", "#f43f5e",
                        "#64748b", "#374151", "#7c2d12", "#166534", "#7c3aed", "#be185d"].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedCategory(prev => prev ? { ...prev, color } : null)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <Label className="block text-sm text-slate-600 mb-1">カスタム色</Label>
                      <input
                        type="color"
                        value={selectedCategory.color}
                        onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, color: e.target.value } : null)}
                        className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">表示スタイル</Label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(prev => prev ? { ...prev, backgroundStyle: 'border' } : null)}
                        className={`flex-1 py-2 px-3 rounded border text-sm ${
                          selectedCategory.backgroundStyle === 'border' 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        枠のみ
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(prev => prev ? { ...prev, backgroundStyle: 'fill' } : null)}
                        className={`flex-1 py-2 px-3 rounded border text-sm ${
                          selectedCategory.backgroundStyle === 'fill' 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        背景塗り
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="block text-sm font-medium text-slate-700 mb-2">Width</Label>
                      <Input
                        type="number"
                        min="150"
                        max="800"
                        value={selectedCategory.width}
                        onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, width: parseInt(e.target.value) || 150 } : null)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-slate-700 mb-2">Height</Label>
                      <Input
                        type="number"
                        min="100"
                        max="600"
                        value={selectedCategory.height}
                        onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, height: parseInt(e.target.value) || 100 } : null)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        // Update category
                        if (selectedCategory) {
                          updateCategoryMutation.mutate({
                            id: selectedCategory.id,
                            data: selectedCategory
                          });
                        }
                      }}
                      disabled={updateCategoryMutation.isPending}
                      className="flex-1 text-sm"
                      size="sm"
                    >
                      {updateCategoryMutation.isPending ? "Updating..." : "Update"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selectedCategory && confirm("このカテゴリを削除しますか？")) {
                          deleteCategoryMutation.mutate(selectedCategory.id);
                          setSelectedCategory(null);
                        }
                      }}
                      disabled={deleteCategoryMutation.isPending}
                      className="flex-1 text-sm"
                      size="sm"
                    >
                      {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Section */}
            <div className="bg-slate-50 rounded-lg p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800">使い方</h3>
                <Link href="/guide">
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                    <HelpCircle className="w-3 h-3 mr-1" />
                    詳細ガイド
                  </Button>
                </Link>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p>• URLとタイトルを入力してブックマークを作成</p>
                <p>• カテゴリを作成してブックマークを整理</p>
                <p>• 作成されたアイコンは自動的にキャンバスに配置</p>
                <p>• アイコンやカテゴリをドラッグして自由に配置</p>
                <p>• アイコンをダブルクリックで新しいタブでサイトを開く</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 relative overflow-auto bg-slate-50">
          <div className="absolute top-4 right-4 z-30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="bg-white shadow-sm"
              title={showGrid ? 'Hide Grid' : 'Show Grid'}
            >
              <Grid3X3 className={`w-4 h-4 ${showGrid ? 'text-blue-600' : 'text-gray-600'}`} />
            </Button>
          </div>

          <div
            ref={canvasRef}
            className={`min-h-full relative p-8 ${showGrid ? 'bg-dot-pattern' : 'bg-slate-50'}`}
            style={{
              width: Math.max(
                windowSize.width - (sidebarOpen ? 320 : 0),
                activeTabBookmarks.length > 0 || activeTabCategories.length > 0 || activeTabNotes.length > 0 ? Math.max(
                  ...activeTabBookmarks.map(b => b.x + 100),
                  ...activeTabCategories.map(c => c.x + c.width + 50),
                  ...activeTabNotes.map(n => n.x + n.width + 50),
                  1200
                ) : 1200
              ),
              height: Math.max(
                windowSize.height - 64,
                activeTabBookmarks.length > 0 || activeTabCategories.length > 0 || activeTabNotes.length > 0 ? Math.max(
                  ...activeTabBookmarks.map(b => b.y + 100),
                  ...activeTabCategories.map(c => c.y + c.height + 50),
                  ...activeTabNotes.map(n => n.y + n.height + 50),
                  800
                ) : 800
              ),
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              endCategoryDrag();
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => {
              handleTouchEnd(e);
              endCategoryDrag();
            }}
            onClick={(e) => {
              // Deselect category when clicking on empty canvas
              if (e.target === e.currentTarget) {
                setSelectedCategory(null);
              }
            }}
          >


            {/* Render sticky notes */}
            {activeTabNotes.map((note) => {
              const isBeingDragged = noteDragState.isDragging && noteDragState.noteId === note.id;
              const isBeingResized = noteDragState.isResizing && noteDragState.noteId === note.id;
              const displayX = isBeingDragged && noteDragState.tempPosition ? noteDragState.tempPosition.x : note.x;
              const displayY = isBeingDragged && noteDragState.tempPosition ? noteDragState.tempPosition.y : note.y;
              const displayWidth = isBeingResized && noteDragState.tempSize ? noteDragState.tempSize.width : note.width;
              const displayHeight = isBeingResized && noteDragState.tempSize ? noteDragState.tempSize.height : note.height;
              
              return (
                <div
                  key={`note-${note.id}`}
                  className="absolute select-none shadow-lg rounded-md border border-gray-300 group"
                  style={{
                    left: displayX,
                    top: displayY,
                    width: displayWidth,
                    height: displayHeight,
                    backgroundColor: note.backgroundColor,
                    color: note.textColor,
                    fontSize: `${note.fontSize}px`,
                    zIndex: 20,
                  }}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("この付箋を削除しますか？")) {
                        deleteNoteMutation.mutate(note.id);
                      }
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs font-bold z-30"
                    title="削除"
                  >
                    ×
                  </button>

                  {/* Note content - editable or display */}
                  {editingNoteId === note.id ? (
                    <textarea
                      className="w-full h-full p-3 border-none outline-none resize-none rounded-md"
                      style={{
                        backgroundColor: 'transparent',
                        color: note.textColor,
                        fontSize: `${note.fontSize}px`,
                      }}
                      value={note.content}
                      onChange={(e) => {
                        updateNoteMutation.mutate({
                          id: note.id,
                          content: e.target.value,
                        });
                      }}
                      onBlur={() => setEditingNoteId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingNoteId(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="w-full h-full p-3 whitespace-pre-wrap break-words overflow-hidden cursor-move"
                      onMouseDown={(e) => {
                        // Only start drag if not clicking on content for editing
                        if (e.detail === 1) { // Single click
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Get the note element's position relative to canvas
                          const noteElement = e.currentTarget.closest('.absolute') as HTMLElement;
                          if (!noteElement) return;
                          
                          const noteRect = noteElement.getBoundingClientRect();
                          const startX = e.clientX - noteRect.left;
                          const startY = e.clientY - noteRect.top;
                          
                          setNoteDragState({
                            isDragging: true,
                            noteId: note.id,
                            offset: { x: startX, y: startY },
                            tempPosition: { x: note.x, y: note.y },
                            isResizing: false,
                            tempSize: null,
                          });
                        }
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingNoteId(note.id);
                      }}
                    >
                      {note.content}
                    </div>
                  )}
                  
                  {/* Resize handle - only show when not editing */}
                  {editingNoteId !== note.id && (
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize"
                      style={{
                        background: `linear-gradient(-45deg, transparent 30%, ${note.textColor} 30%, ${note.textColor} 70%, transparent 70%)`,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        setNoteDragState({
                          isDragging: false,
                          noteId: note.id,
                          offset: { x: 0, y: 0 },
                          tempPosition: null,
                          isResizing: true,
                          tempSize: { width: note.width, height: note.height },
                        });
                        
                        const startWidth = note.width;
                        const startHeight = note.height;
                        const startX = e.clientX;
                        const startY = e.clientY;
                        
                        const handleMouseMove = (e: MouseEvent) => {
                          const deltaX = e.clientX - startX;
                          const deltaY = e.clientY - startY;
                          
                          const newWidth = Math.max(100, startWidth + deltaX);
                          const newHeight = Math.max(100, startHeight + deltaY);
                          
                          setNoteDragState(prev => ({
                            ...prev,
                            tempSize: { width: newWidth, height: newHeight },
                          }));

                          // Also update the cache immediately for visual feedback
                          queryClient.setQueryData(["/api/notes"], (oldData: Note[]) => 
                            oldData?.map(n => 
                              n.id === note.id ? { ...n, width: newWidth, height: newHeight } : n
                            ) || []
                          );
                        };
                        
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                          
                          // The final size is already in the state from the last mouse move
                          // Just end the resize operation - the global handleMouseUp will save it
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Render category boxes */}
            {activeTabCategories.map((category) => (
              <div
                key={`category-${category.id}`}
                className={`absolute border-2 border-dashed rounded-lg bg-opacity-10 cursor-move select-none group ${
                  selectedCategory?.id === category.id ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                } ${
                  categoryTouchState.timeoutId && categoryTouchState.category?.id === category.id 
                    ? 'ring-2 ring-orange-400 ring-opacity-70' 
                    : ''
                }`}
                style={{
                  left: category.x,
                  top: category.y,
                  width: category.width,
                  height: category.height,
                  borderColor: category.color,
                  backgroundColor: category.backgroundStyle === 'fill' ? category.color + '20' : 'transparent',
                  transition: categoryTouchState.timeoutId && categoryTouchState.category?.id === category.id 
                    ? 'all 0.5s ease-in-out' 
                    : 'none',
                }}
                onMouseDown={(e) => handleCategoryMouseDown(e, category)}
                onTouchStart={(e) => handleCategoryTouchStart(e, category)}
                onTouchEnd={(e) => handleCategoryTouchEnd(e, category)}
                onClick={(e) => handleCategoryClick(e, category)}
              >
                <div 
                  className="absolute top-2 left-2 px-2 py-1 rounded text-sm font-medium text-white pointer-events-none"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </div>
                
                {/* Resize handle */}
                <div
                  className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-60 hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: category.color }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleCategoryMouseDown(e, category);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleCategoryTouchStart(e, category);
                  }}
                />
              </div>
            ))}

            {placedBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="absolute cursor-move group select-none touch-none"
                style={{ left: bookmark.x, top: bookmark.y }}
                onMouseDown={(e) => handleMouseDown(e, bookmark)}
                onTouchStart={(e) => handleTouchStart(e, bookmark)}
                onTouchEnd={(e) => handleTouchEnd(e, bookmark)}
                onClick={(e) => handleBookmarkClick(e, bookmark)}
                onDoubleClick={(e) => handleBookmarkDoubleClick(e, bookmark)}
                onContextMenu={(e) => handleContextMenu(e, bookmark)}
              >
                <Card className="bg-white shadow-lg rounded-xl p-3 border border-slate-200 hover:shadow-xl transition-all transform hover:scale-105 w-24 h-24 flex flex-col items-center justify-center">
                  <div className="text-2xl mb-1 flex-shrink-0">
                    {bookmark.iconType === "emoji" ? (
                      bookmark.icon
                    ) : bookmark.iconType === "text" ? (
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {bookmark.icon}
                      </div>
                    ) : (
                      <img src={bookmark.icon} alt="" className="w-7 h-7 object-cover rounded" />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 text-center w-full leading-tight px-1" title={bookmark.title}>
                    {bookmark.title.length > 8 ? bookmark.title.substring(0, 8) + '...' : bookmark.title}
                  </div>
                </Card>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBookmarkMutation.mutate(bookmark.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0"
                >
                  ×
                </Button>
              </div>
            ))}

            {placedBookmarks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="text-slate-400">
                  <BookmarkIcon className="w-16 h-16 mb-4 opacity-50 mx-auto" />
                  <h3 className="text-xl font-medium mb-2">ランチャーを作成しよう</h3>
                  <p className="text-sm">サイドバーからブックマークを追加すると、ここに自動的に配置されます</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModal.isOpen} onOpenChange={(open) => setEditModal({ isOpen: open })}>
        <DialogContent className="sm:max-w-md" aria-describedby="edit-bookmark-description">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          <p id="edit-bookmark-description" className="text-sm text-slate-600 mb-4">
            Update the title and URL for this bookmark.
          </p>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Website URL</Label>
              <Input
                name="url"
                type="url"
                defaultValue={editModal.bookmark?.url}
                required
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Title</Label>
              <Input
                name="title"
                type="text"
                defaultValue={editModal.bookmark?.title}
                required
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModal({ isOpen: false })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateBookmarkMutation.isPending}
                className="flex-1"
              >
                {updateBookmarkMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Note Modal */}
      <Dialog open={noteModal.isOpen} onOpenChange={(open) => setNoteModal({ isOpen: open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>付箋を作成</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createNoteMutation.mutate(noteFormData);
          }} className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">内容</Label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md resize-none"
                rows={4}
                placeholder="付箋の内容を入力..."
                value={noteFormData.content}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  背景色
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {["#fef3c7", "#fecaca", "#fed7d7", "#dbeafe", "#d1fae5", "#f3e8ff", "#fde68a", "#f1f5f9"].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNoteFormData(prev => ({ ...prev, backgroundColor: color }))}
                      className={`w-8 h-8 rounded border-2 ${
                        noteFormData.backgroundColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  <Type className="w-4 h-4 inline mr-1" />
                  文字色
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {["#1f2937", "#991b1b", "#7c2d12", "#1e40af", "#059669", "#7c3aed", "#be123c", "#6b7280"].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNoteFormData(prev => ({ ...prev, textColor: color }))}
                      className={`w-8 h-8 rounded border-2 ${
                        noteFormData.textColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">文字サイズ</Label>
                <select
                  value={noteFormData.fontSize}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={10}>10px</option>
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={18}>18px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                </select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">幅</Label>
                <Input
                  type="number"
                  min="100"
                  max="400"
                  value={noteFormData.width}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 200 }))}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">高さ</Label>
                <Input
                  type="number"
                  min="100"
                  max="400"
                  value={noteFormData.height}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 150 }))}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={createNoteMutation.isPending || !noteFormData.content.trim()}
              className="w-full"
            >
              {createNoteMutation.isPending ? "作成中..." : "付箋を作成"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tab Creation Modal */}
      <Dialog open={tabModal.isOpen} onOpenChange={(open) => setTabModal({ isOpen: open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新しいタブを作成</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tab-name" className="text-sm font-medium">
                タブ名
              </Label>
              <Input
                id="tab-name"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="例: 仕事、趣味、学習..."
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTabModal({ isOpen: false });
                  setNewTabName("");
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => {
                  if (newTabName.trim()) {
                    createTabMutation.mutate({
                      name: newTabName.trim(),
                      isActive: false,
                      order: 0,
                    });
                  }
                }}
                disabled={!newTabName.trim() || createTabMutation.isPending}
              >
                {createTabMutation.isPending ? "作成中..." : "作成"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
