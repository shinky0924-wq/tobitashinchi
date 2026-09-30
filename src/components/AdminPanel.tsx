import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredArticles, saveArticles, BlogArticle, BLOG_CATEGORIES, getValidArticleEyeCatch } from '../blogData';
import { getStoredSiteContent, saveSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '../siteContent';
import { getConsultations, updateConsultationStatus, deleteConsultation, saveBlogArticlesToFirestore, saveSiteContentToFirestore } from '../firebase';
import { 
  Lock, KeyRound, ShieldAlert, FileText, Plus, Trash2, Edit3, Save, 
  ArrowLeft, RotateCcw, Copy, Check, Eye, HelpCircle, MoveUp, MoveDown, 
  Grid, LogOut, CheckCircle2, Sparkles, BookOpen, AlertCircle, Settings,
  Download, Archive, User, Inbox, Heart
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshBlog: () => void;
  onRefreshSite: () => void;
}

type EditorBlock = BlogArticle['content'][number] & { id: string };

const isImageUrl = (str: string) => {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/') || str.includes('unsplash.com') || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(str);
};

export default function AdminPanel({ onClose, onRefreshBlog, onRefreshSite }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Download states
  const [isDownloadingWeb, setIsDownloadingWeb] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);

  const handleDownloadFile = async (url: string, filename: string, setStatus: (s: boolean) => void) => {
    setStatus(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showAlert(`「${filename}」を正常にダウンロードしました！`);
    } catch (error) {
      console.error('Download error:', error);
      showAlert('ダウンロード中にエラーが発生しました。時間を置いて再度お試しください。', 'error');
    } finally {
      setStatus(false);
    }
  };
  
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Tabs within Admin panel
  const [activeAdminTab, setActiveAdminTab] = useState<'blog' | 'site' | 'consultation'>('blog');
  const [activeSiteSection, setActiveSiteSection] = useState<'hero' | 'concerns' | 'reasons' | 'jobs' | 'flow' | 'faq' | 'consultation'>('hero');
  const [siteText, setSiteText] = useState<SiteContent>(getStoredSiteContent());

  // Firebase consultation submissions states
  const [consultationsList, setConsultationsList] = useState<any[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);

  // Editor states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<BlogArticle['category']>('beginner');
  const [summary, setSummary] = useState('');
  const [eyeCatch, setEyeCatch] = useState('/images/col_beginner_guide_art_1787803245812.jpg');
  const [authorName, setAuthorName] = useState('さくら');
  const [authorRole, setAuthorRole] = useState('女性サポートスタッフ');
  const [authorAvatar, setAuthorAvatar] = useState('👩‍💼');
  const [tagsInput, setTagsInput] = useState('');
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  
  // Notice & Copy states
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showCodeExport, setShowCodeExport] = useState(false);

  // AI batch generator states
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'claude'>('gemini');
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiCategory, setAiCategory] = useState<string>('all');
  const [aiTopic, setAiTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [clientGeminiKey, setClientGeminiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('client_gemini_api_key') || '';
    }
    return '';
  });
  const [showClientKeyInput, setShowClientKeyInput] = useState<boolean>(false);

  // Deep nested updaters for SiteContent State
  const updateHeroField = (field: keyof SiteContent['hero'], val: string) => {
    setSiteText(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: val
      }
    }));
  };

  const updateConcernsField = (field: 'title' | 'subtitle', val: string) => {
    setSiteText(prev => ({
      ...prev,
      concerns: {
        ...prev.concerns,
        [field]: val
      }
    }));
  };

  const updateConcernItem = (index: number, field: 'title' | 'question' | 'answer', val: string) => {
    setSiteText(prev => {
      const nextItems = [...prev.concerns.items];
      nextItems[index] = { ...nextItems[index], [field]: val };
      return {
        ...prev,
        concerns: {
          ...prev.concerns,
          items: nextItems
        }
      };
    });
  };

  const updateReasonsField = (field: 'title' | 'subtitle', val: string) => {
    setSiteText(prev => ({
      ...prev,
      reasons: {
        ...prev.reasons,
        [field]: val
      }
    }));
  };

  const updateReasonItem = (index: number, field: 'title' | 'description', val: string) => {
    setSiteText(prev => {
      const nextItems = [...prev.reasons.items];
      nextItems[index] = { ...nextItems[index], [field]: val };
      return {
        ...prev,
        reasons: {
          ...prev.reasons,
          items: nextItems
        }
      };
    });
  };

  const updateJobsField = (field: keyof SiteContent['jobs'], val: string) => {
    setSiteText(prev => ({
      ...prev,
      jobs: {
        ...prev.jobs,
        [field]: val
      }
    }));
  };

  const updateFlowField = (field: 'title' | 'subtitle', val: string) => {
    setSiteText(prev => ({
      ...prev,
      flow: {
        ...prev.flow,
        [field]: val
      }
    }));
  };

  const updateFlowItem = (index: number, val: string) => {
    setSiteText(prev => {
      const nextItems = [...prev.flow.items];
      nextItems[index] = { ...nextItems[index], title: val };
      return {
        ...prev,
        flow: {
          ...prev.flow,
          items: nextItems
        }
      };
    });
  };

  const updateFaqField = (field: 'title' | 'sidebarRole' | 'sidebarMessage', val: string) => {
    setSiteText(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        [field]: val
      }
    }));
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', val: string) => {
    setSiteText(prev => {
      const nextItems = [...prev.faq.items];
      nextItems[index] = { ...nextItems[index], [field]: val };
      return {
        ...prev,
        faq: {
          ...prev.faq,
          items: nextItems
        }
      };
    });
  };

  const updateConsultationField = (field: keyof SiteContent['consultation'], val: string) => {
    setSiteText(prev => ({
      ...prev,
      consultation: {
        ...prev.consultation,
        [field]: val
      }
    }));
  };

  const handleSaveSiteContent = async () => {
    saveSiteContent(siteText);
    onRefreshSite();
    
    try {
      // 1. Save directly to Firebase Firestore for durable multi-browser real-time synchronization
      const firestoreSuccess = await saveSiteContentToFirestore(siteText);
      
      if (firestoreSuccess) {
        showAlert('データベース(Firestore)にサイト文章を永久保存しました！別ブラウザや本番環境でも瞬時に反映されます。');
        
        // 2. Also send to the Express server as backup quietly (it doesn't matter if it fails)
        try {
          await fetch('/api/cms/site', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Admin-Password': getAdminPassword()
            },
            body: JSON.stringify(siteText)
          });
        } catch (serverErr) {
          console.warn('Backup to Express server failed, but Firestore was successful:', serverErr);
        }
      } else {
        // Try server backup if Firestore failed
        try {
          const res = await fetch('/api/cms/site', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Admin-Password': getAdminPassword()
            },
            body: JSON.stringify(siteText)
          });
          if (res.ok) {
            showAlert('サーバーのディスクにサイト文章を保存しました！');
          } else {
            showAlert('ブラウザには一時保存されましたが、サーバーへの同期に失敗しました。', 'error');
          }
        } catch (serverErr) {
          console.error('Both Firestore and Server saving failed:', serverErr);
          showAlert('ブラウザには一時保存されましたが、サーバーへの同期に失敗しました。', 'error');
        }
      }
    } catch (e) {
      console.error('Error in handleSaveSiteContent:', e);
      showAlert('ブラウザには一時保存されましたが、サーバーへの同期に失敗しました。', 'error');
    }
  };

  const handleResetSiteContent = async () => {
    if (window.confirm('サイト内の文章をすべて初期状態にリセットしますか？')) {
      try {
        localStorage.removeItem('custom_site_content');
      } catch (err) {
        console.warn('localStorage.removeItem failed', err);
      }
      setSiteText(DEFAULT_SITE_CONTENT);
      onRefreshSite();

      try {
        // 1. Save directly to Firebase Firestore
        const firestoreSuccess = await saveSiteContentToFirestore(DEFAULT_SITE_CONTENT);

        if (firestoreSuccess) {
          showAlert('データベース(Firestore)にサイト文章を初期設定にリセット保存しました！');
          
          // 2. Also send to Express quietly as backup
          try {
            await fetch('/api/cms/site', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(DEFAULT_SITE_CONTENT)
            });
          } catch (serverErr) {
            console.warn('Backup reset to Express server failed, but Firestore was successful:', serverErr);
          }
        } else {
          try {
            const res = await fetch('/api/cms/site', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(DEFAULT_SITE_CONTENT)
            });
            if (res.ok) {
              showAlert('サイト内の文章を初期設定にリセット（サーバー保存完了）しました！');
            } else {
              showAlert('ブラウザ側はリセットされましたが、サーバー同期に失敗しました。', 'error');
            }
          } catch (serverErr) {
            showAlert('ブラウザ側はリセットされましたが、サーバー同期に失敗しました。', 'error');
          }
        }
      } catch (e) {
        showAlert('ブラウザ側はリセットされましたが、サーバー同期に失敗しました。', 'error');
      }
    }
  };

  // Load articles
  useEffect(() => {
    setArticles(getStoredArticles());
    
    const loadServerData = async () => {
      try {
        const blogRes = await fetch('/api/cms/articles');
        if (blogRes.ok) {
          const data = await blogRes.json();
          setArticles(data);
        }
      } catch (e) {
        console.warn('Could not sync articles from server in CMS panel', e);
      }

      try {
        const siteRes = await fetch('/api/cms/site');
        if (siteRes.ok) {
          const data = await siteRes.json();
          setSiteText(data);
        }
      } catch (e) {
        console.warn('Could not sync site text from server in CMS panel', e);
      }
    };
    loadServerData();
  }, []);

  const getAdminPassword = () => {
    return password || '';
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const localCheck = () => {
      const isPassCorrect = password === 'admin' || password === 'tobita' || password === 'tobita2026';
      const isUserCorrect = username === 'admin' || !username;
      if (isUserCorrect && isPassCorrect) {
        setIsAuthenticated(true);
        setLoginError('');
        return true;
      }
      return false;
    };

    try {
      const res = await fetch('/api/cms/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          setIsAuthenticated(true);
          setLoginError('');
        } else {
          // Fallback to local check if API response JSON parsing fails or isn't successful
          if (!localCheck()) {
            setLoginError('IDまたはパスワードが正しくありません。');
          }
        }
      } else {
        // If API returns non-200 code (404, 405 Method Not Allowed, 403, 500 etc),
        // fallback to local verification immediately to guarantee usability in static hosts like Cloudflare Pages
        if (!localCheck()) {
          const data = await res.json().catch(() => ({}));
          setLoginError(data.error || 'IDまたはパスワードが正しくありません。');
        }
      }
    } catch (err) {
      console.warn('Login connection failed, fallback to local verification', err);
      if (!localCheck()) {
        setLoginError('IDまたはパスワードが正しくありません。');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  // Firebase Consultation CRM Handlers
  const fetchConsultationsData = async () => {
    setIsLoadingConsultations(true);
    try {
      const data = await getConsultations();
      setConsultationsList(data);
    } catch (err) {
      console.error(err);
      showAlert('お問合せデータの読み込みに失敗しました。', 'error');
    } finally {
      setIsLoadingConsultations(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'unread' | 'read' | 'contacted') => {
    try {
      const success = await updateConsultationStatus(id, newStatus);
      if (success) {
        setConsultationsList(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        showAlert('お問合せステータスを更新しました！');
      } else {
        showAlert('ステータス更新に失敗しました。', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('ステータス更新中にエラーが発生しました。', 'error');
    }
  };

  const handleDeleteConsultationData = async (id: string) => {
    if (window.confirm('このお問合せデータを完全に削除しますか？')) {
      try {
        const success = await deleteConsultation(id);
        if (success) {
          setConsultationsList(prev => prev.filter(item => item.id !== id));
          showAlert('お問合せを削除しました。');
        } else {
          showAlert('削除に失敗しました。', 'error');
        }
      } catch (err) {
        console.error(err);
        showAlert('削除中にエラーが発生しました。', 'error');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeAdminTab === 'consultation') {
      fetchConsultationsData();
    }
  }, [isAuthenticated, activeAdminTab]);

  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  // Reset to default preset
  const handleResetToDefault = async () => {
    if (window.confirm('すべての変更を破棄して、初期登録のコラムデータにリセットしますか？ (追加したカスタムコラムは消去されます)')) {
      try {
        localStorage.removeItem('custom_blog_articles');
      } catch (err) {
        console.warn('localStorage.removeItem failed', err);
      }
      const defaults = getStoredArticles();
      setArticles(defaults);
      onRefreshBlog();
      
      try {
        // 1. Save directly to Firebase Firestore
        const firestoreSuccess = await saveBlogArticlesToFirestore(defaults);

        if (firestoreSuccess) {
          showAlert('コラムを初期状態にリセットし、データベース(Firestore)に保存しました！');
          
          // 2. Also send to Express quietly
          try {
            await fetch('/api/cms/articles', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(defaults)
            });
          } catch (serverErr) {
            console.warn('Backup reset to Express server failed, but Firestore was successful:', serverErr);
          }
        } else {
          try {
            const res = await fetch('/api/cms/articles', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(defaults)
            });
            if (res.ok) {
              showAlert('コラムを初期状態にリセット（サーバー保存完了）しました！');
            } else {
              showAlert('ブラウザ側はリセットされましたが、サーバー同期に失敗しました。', 'error');
            }
          } catch (serverErr) {
            showAlert('ブラウザ側はリセットされましたが、サーバー同期に失敗しました。', 'error');
          }
        }
      } catch (e) {
        showAlert('ブラウザ側はリセットされましたが、サーバー同期に失敗しました。', 'error');
      }
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: string, articleTitle: string) => {
    if (window.confirm(`「${articleTitle}」を本当に削除しますか？`)) {
      const updated = articles.filter(a => a.id !== id);
      setArticles(updated);
      saveArticles(updated);
      onRefreshBlog();
      
      try {
        // 1. Save directly to Firebase Firestore
        const firestoreSuccess = await saveBlogArticlesToFirestore(updated);

        if (firestoreSuccess) {
          showAlert('コラムを削除し、データベース(Firestore)に保存しました');
          
          // 2. Also send to Express quietly
          try {
            await fetch('/api/cms/articles', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(updated)
            });
          } catch (serverErr) {
            console.warn('Backup delete to Express server failed, but Firestore was successful:', serverErr);
          }
        } else {
          try {
            const res = await fetch('/api/cms/articles', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(updated)
            });
            if (res.ok) {
              showAlert('コラムを削除し、サーバーに保存しました');
            } else {
              showAlert('コラムをブラウザから削除しましたが、サーバー同期に失敗しました。', 'error');
            }
          } catch (serverErr) {
            showAlert('コラムをブラウザから削除しましたが、サーバー同期に失敗しました。', 'error');
          }
        }
      } catch (e) {
        showAlert('コラムをブラウザから削除しましたが、サーバー同期に失敗しました。', 'error');
      }
    }
  };

  // Start creating new
  const handleStartCreate = () => {
    setEditingArticleId(null);
    setTitle('');
    setSlug(`custom-column-${Date.now()}`);
    setCategory('beginner');
    setSummary('');
    setEyeCatch('📝');
    setAuthorName('さくら');
    setAuthorRole('女性サポートスタッフ');
    setAuthorAvatar('👩‍💼');
    setTagsInput('未経験歓迎, 飛田新地');
    setBlocks([
      { id: '1', type: 'p', text: 'ここに本文の最初の段落を入力してください。' },
      { id: '2', type: 'h2', text: '魅力的な見出し' },
      { id: '3', type: 'p', text: '見出しに続く詳細な説明文を入力します。' },
      { id: '4', type: 'cta' }
    ]);
    setIsEditing(true);
  };

  // Start editing existing
  const handleStartEdit = (article: BlogArticle) => {
    setEditingArticleId(article.id);
    setTitle(article.title);
    setSlug(article.slug);
    setCategory(article.category);
    setSummary(article.summary);
    setEyeCatch(article.eyeCatch);
    setAuthorName(article.author.name);
    setAuthorRole(article.author.role);
    setAuthorAvatar(article.author.avatar);
    setTagsInput(article.tags.join(', '));
    setBlocks(
      article.content.map((b, idx) => ({
        ...b,
        id: `${idx}-${Date.now()}`
      }))
    );
    setIsEditing(true);
  };

  // Save changes
  const handleSaveArticle = () => {
    if (!title.trim()) {
      showAlert('タイトルを入力してください', 'error');
      return;
    }
    if (!slug.trim()) {
      showAlert('スラッグ（URLパーツ）を入力してください', 'error');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const categoryObj = BLOG_CATEGORIES.find(c => c.id === category);
    const categoryLabel = categoryObj ? categoryObj.label : '未経験者向け';

    // Format content block by stripping the temporary visual editor IDs
    const formattedContent = blocks.map(({ id, ...rest }) => rest);

    const newArticle: BlogArticle = {
      id: editingArticleId || `custom-${Date.now()}`,
      title,
      slug,
      category,
      categoryLabel,
      publishedAt: editingArticleId 
        ? (articles.find(a => a.id === editingArticleId)?.publishedAt || new Date().toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0],
      readTime: `${Math.max(2, Math.ceil(blocks.filter(b => b.text).reduce((acc, b) => acc + (b.text?.length || 0), 0) / 400))}分`,
      summary,
      eyeCatch: getValidArticleEyeCatch({ id: editingArticleId || undefined, category, eyeCatch }),
      author: {
        name: authorName,
        role: authorRole,
        avatar: authorAvatar
      },
      content: formattedContent,
      tags: cleanTags
    };

    let updatedArticles: BlogArticle[];
    if (editingArticleId) {
      updatedArticles = articles.map(a => a.id === editingArticleId ? newArticle : a);
    } else {
      updatedArticles = [newArticle, ...articles];
    }

    setArticles(updatedArticles);
    saveArticles(updatedArticles);
    setIsEditing(false);
    onRefreshBlog();

    // Send to server and Firestore
    const isEdit = !!editingArticleId;
    (async () => {
      try {
        // 1. Save directly to Firebase Firestore for durable real-time synchronization
        const firestoreSuccess = await saveBlogArticlesToFirestore(updatedArticles);

        if (firestoreSuccess) {
          showAlert(isEdit ? 'コラムを更新し、データベース(Firestore)に保存しました！別ブラウザや本番環境にも即座に反映されます。' : '新しいコラムを公開し、データベース(Firestore)に保存しました！別ブラウザや本番環境にも即座に反映されます。');
          
          // 2. Also send to the Express server as backup quietly (it doesn't matter if it fails)
          try {
            await fetch('/api/cms/articles', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(updatedArticles)
            });
          } catch (serverErr) {
            console.warn('Backup column save to Express server failed, but Firestore was successful:', serverErr);
          }
        } else {
          try {
            const res = await fetch('/api/cms/articles', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': getAdminPassword()
              },
              body: JSON.stringify(updatedArticles)
            });
            if (res.ok) {
              showAlert(isEdit ? 'コラムを更新し、サーバーに保存しました！' : '新しいコラムを公開し、サーバーに保存しました！');
            } else {
              showAlert('コラムはブラウザに一時保存されましたが、サーバー同期に失敗しました。', 'error');
            }
          } catch (serverErr) {
            showAlert('コラムはブラウザに一時保存されましたが、サーバー同期に失敗しました。', 'error');
          }
        }
      } catch (e) {
        showAlert('コラムはブラウザに一時保存されましたが、サーバー同期に失敗しました。', 'error');
      }
    })();
  };

  const generateArticleClientSide = async (apiKey: string, index: number, category: string, customTopic: string, currentArticles: BlogArticle[]) => {
    const modelName = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const topicPrompt = customTopic ? `特別テーマ・要望:「${customTopic}」` : "テーマは自由（未経験者向け、給料システム、身バレ対策などからバランスよく選んでください）";
    const requestedCategory = category || "all";

    const singlePrompt = `あなたは飛田新地の女性向けサポート＆求人サイト「飛田ガールズ」のプロの編集者です。
求職中の20代女性（未経験者が多い）が抱く、不安や疑問（身バレ対策、安全面、給料システム、実際の仕事の流れ、体入（体験入店）、生活・働き方など）を優しく丁寧に解消し、一歩踏み出す安心感を与える極めて高品質なコラム記事を日本語で作成してください。

今回は、全リクエストのうち「${index + 1}番目」のコラム記事を1件だけ生成してください。
${requestedCategory !== "all" ? `カテゴリーは必ず「${requestedCategory}」にしてください。` : "カテゴリーは 'beginner', 'salary', 'security', 'lifestyle', 'onboarding' の中から適したものを1つ選択してください。"}
${topicPrompt}

記事は、以下のJSONスキーマに従った完全な1つのオブジェクトである必要があります。

記事のコンテンツ（content配列）は、見出し（h2, h3）、本文（p）、リスト（list）、よくある質問（qna）、LINE誘導（cta）のブロックを複数組み合わせた、読み応えのある構成（合計文字数1000文字〜1500文字程度）にしてください。

JSONスキーマ：
{
  "title": "読者の目を惹く魅力的なコラムタイトル（30〜50文字程度。例：【身バレ防止】飛田新地で親や友達にバレずに働くための4つの鉄則）",
  "slug": "記事のタイトルを簡潔に英訳・ローマ字にし、半角小文字の英数字とハイフンのみで構成したURLスラッグ。末尾にランダムな文字列や日付は含めず、タイトルに即した意味のある英単語（3〜5単語程度）にしてください。（例：タイトルが「【身バレ防止】親や友達にバレずに働く4つの鉄則」なら「tobitashinchi-privacy-rules」や「work-without-revealing-identity」など）",
  "category": "'beginner' | 'salary' | 'security' | 'lifestyle' | 'onboarding' のいずれか1つ",
  "categoryLabel": "カテゴリーに応じた和名（例：未経験者向け、給与・待遇、安心・身バレ対策、生活・働き方、面接・お仕事の流れ）",
  "summary": "一覧ページで表示される、記事の概要を2文程度で魅力的にまとめた紹介文",
  "author": {
    "name": "さくら または ひまり または ゆい などの女性サポートスタッフ名、またはマネージャー木村",
    "role": "女性サポートスタッフ（歴8年） または 採用担当マネージャー などの役職",
    "avatar": "👩‍💼 または 👩‍💻 または 👩"
  },
  "tags": ["関連するタグ名1", "タグ2", "タグ3"],
  "content": [
    {
      "type": "p",
      "text": "導入段落。読者の不安に共感し、本記事を読めば解決することを伝えます。"
    },
    {
      "type": "h2",
      "text": "中見出しのタイトル"
    },
    {
      "type": "p",
      "text": "詳細な解説。安心できるトーンで具体的に説明します。"
    },
    {
      "type": "list",
      "items": [
        "リスト項目1",
        "リスト項目2",
        "リスト項目3"
      ]
    },
    {
      "type": "h3",
      "text": "小見出しのタイトル"
    },
    {
      "type": "p",
      "text": "より細分化した情報や豆知識。"
    },
    {
      "type": "qna",
      "question": "よくある質問の問い？",
      "answer": "丁寧で安心感に満ちた回答。"
    },
    {
      "type": "cta"
    }
  ]
}

注意点：
1. 違法な行為や危険な行為を推奨する内容は避け、安心・安全・健全なサポート環境であることを一貫して強調してください。
2. 日本の女の子が読んで自然で、温かみがあり、信頼できる言葉遣い（〜です、〜ます調）にしてください。
3. リスト(list)やQ&A(qna)ブロックを効果的に使い、視覚的に読みやすくしてください。
4. LINE誘導(cta)ブロックは、記事の中間か最後付近に1つ以上配置してください。ctaブロックは 'type': 'cta' のみで、'text' や 'items' などのキーは不要です。`;

    const payload = {
      contents: [
        {
          parts: [
            { text: `${singlePrompt}\n\n指定されたJSONスキーマに完全に従って日本語で1記事生成してください。` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            slug: { type: "STRING" },
            category: { type: "STRING" },
            categoryLabel: { type: "STRING" },
            summary: { type: "STRING" },
            author: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                role: { type: "STRING" },
                avatar: { type: "STRING" }
              },
              required: ["name", "role", "avatar"]
            },
            tags: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            content: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  type: { type: "STRING" },
                  text: { type: "STRING" },
                  items: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  },
                  question: { type: "STRING" },
                  answer: { type: "STRING" }
                },
                required: ["type"]
              }
            }
          },
          required: ["title", "slug", "category", "categoryLabel", "summary", "author", "tags", "content"]
        }
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini APIエラー: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini APIから空のレスポンスが返されました。");
    }

    let art = JSON.parse(text);

    // Map properties and random eyecatch exactly like server.ts
    const premiumIllustrations = [
      "/src/assets/images/col_age_looks_1783677859202.jpg",
      "/src/assets/images/col_aroma_diffuser_1785381010_1785380691227.jpg",
      "/src/assets/images/col_bank_envelope_1785381004_1785380605532.jpg",
      "/src/assets/images/col_beauty_skincare_1785380345912.jpg",
      "/src/assets/images/col_beginner_guide_1783677791058.jpg",
      "/src/assets/images/col_cast_holiday_1783677895722.jpg",
      "/src/assets/images/col_cherry_bloom_1783883726145.jpg",
      "/src/assets/images/col_confidence_mirror_1785380357158.jpg",
      "/src/assets/images/col_cozy_blanket_1785381375.jpg",
      "/src/assets/images/col_cozy_room_93_1785507643387.jpg",
      "/src/assets/images/col_daily_cash_53_1785495791484.jpg",
      "/src/assets/images/col_daily_routine_51_1785495767020.jpg",
      "/src/assets/images/col_daytime_shift_38_1785507316876.jpg",
      "/src/assets/images/col_digital_calendar_1785380297293.jpg",
      "/src/assets/images/col_discreet_commute_48_1785495730427.jpg",
      "/src/assets/images/col_entrepreneur_girl_35_1785507303961.jpg",
      "/src/assets/images/col_fluffy_slippers_1785381007_1785380647936.jpg",
      "/src/assets/images/col_folding_fan_1785381006_1785380633214.jpg",
      "/src/assets/images/col_foot_bath_1785381378.jpg",
      "/src/assets/images/col_foot_bath_96_1785507695229.jpg",
      "/src/assets/images/col_friendship_tea_1785380310316.jpg",
      "/src/assets/images/col_gold_reward_50_1785495755977.jpg",
      "/src/assets/images/col_gourmet_takoyaki_1785380270711.jpg",
      "/src/assets/images/col_guardian_heart_52_1785495778194.jpg",
      "/src/assets/images/col_herbal_tea_1785381373.jpg",
      "/src/assets/images/col_herbal_tea_91_1785507611571.jpg",
      "/src/assets/images/col_housing_support_1783677825592.jpg",
      "/src/assets/images/col_hydrangea_vase_1785381003_1785380592566.jpg",
      "/src/assets/images/col_ill_age_looks_1783884287024.jpg",
      "/src/assets/images/col_ill_beauty_lifestyle_1783912347430.jpg",
      "/src/assets/images/col_ill_beginner_guide_1783884225541.jpg",
      "/src/assets/images/col_ill_cast_holiday_1783884322866.jpg",
      "/src/assets/images/col_ill_cherry_bloom_1783884503300.jpg",
      "/src/assets/images/col_ill_gold_bubble_1783913188809.jpg",
      "/src/assets/images/col_ill_housing_support_1783884256462.jpg",
      "/src/assets/images/col_ill_interview_guide_1783884267011.jpg",
      "/src/assets/images/col_ill_kimono_magic_1783884424450.jpg",
      "/src/assets/images/col_ill_kimono_makeup_1783884356215.jpg",
      "/src/assets/images/col_ill_makeup_vanity_1783884445492.jpg",
      "/src/assets/images/col_ill_mental_support_1783884376739.jpg",
      "/src/assets/images/col_ill_non_alcoholic_1783884312890.jpg",
      "/src/assets/images/col_ill_obachan_role_1783884412493.jpg",
      "/src/assets/images/col_ill_one_day_flow_1783884401530.jpg",
      "/src/assets/images/col_ill_privacy_guide_1783884246291.jpg",
      "/src/assets/images/col_ill_privacy_smart_1783884436471.jpg",
      "/src/assets/images/col_ill_relax_spa_1783884493332.jpg",
      "/src/assets/images/col_ill_safe_entrance_1783884460416.jpg",
      "/src/assets/images/col_ill_safety_security_1783884343829.jpg",
      "/src/assets/images/col_ill_salary_system_1783884234635.jpg",
      "/src/assets/images/col_ill_search_words_1783884385779.jpg",
      "/src/assets/images/col_ill_short_term_1783884332841.jpg",
      "/src/assets/images/col_ill_smart_planner_1783884470546.jpg",
      "/src/assets/images/col_ill_tax_guide_1783884296268.jpg",
      "/src/assets/images/col_ill_trial_guide_1783884277032.jpg",
      "/src/assets/images/col_ill_weekend_shift_1783884365752.jpg",
      "/src/assets/images/col_ill_welcome_gift_1783884481747.jpg",
      "/src/assets/images/col_incognito_cute_55_1785495817237.jpg",
      "/src/assets/images/col_interview_guide_1783677837312.jpg",
      "/src/assets/images/col_kimono_magic_1783748310784.jpg",
      "/src/assets/images/col_kimono_makeup_1783677929197.jpg",
      "/src/assets/images/col_makeup_vanity_1783883669976.jpg",
      "/src/assets/images/col_mental_relax_63_1785509298139.jpg",
      "/src/assets/images/col_mental_support_1783677954070.jpg",
      "/src/assets/images/col_mocktail_toast_95_1785507679077.jpg",
      "/src/assets/images/col_morning_coffee_1785381002_1785380579731.jpg",
      "/src/assets/images/col_non_alcoholic_1783677885472.jpg",
      "/src/assets/images/col_obachan_role_1783748297250.jpg",
      "/src/assets/images/col_obi_ribbon_89_1785507575434.jpg",
      "/src/assets/images/col_one_day_flow_1783748283731.jpg",
      "/src/assets/images/col_pancake_cafe_1785381370662.jpg",
      "/src/assets/images/col_peony_mirror_1785381008_1785380660996.jpg",
      "/src/assets/images/col_planner_dreams_94_1785507661072.jpg",
      "/src/assets/images/col_popular_cast_26_1785509281369.jpg",
      "/src/assets/images/col_privacy_guide_1783677816084.jpg",
      "/src/assets/images/col_privacy_shield_47_1785495714291.jpg",
      "/src/assets/images/col_privacy_smart_1783883659536.jpg",
      "/src/assets/images/col_relax_bath_1785380379937.jpg",
      "/src/assets/images/col_relax_spa_1783883716832.jpg",
      "/src/assets/images/col_resort_stay_46_1785507334215.jpg",
      "/src/assets/images/col_safe_entrance_1783883680643.jpg",
      "/src/assets/images/col_safety_security_1783677920159.jpg",
      "/src/assets/images/col_salary_system_1783677804535.jpg",
      "/src/assets/images/col_savings_chart_56_1785495838818.jpg",
      "/src/assets/images/col_savings_jar_1785381372.jpg",
      "/src/assets/images/col_savings_jar_90_1785507594531.jpg",
      "/src/assets/images/col_savings_ribbon_1785380323578.jpg",
      "/src/assets/images/col_search_words_1783677965204.jpg",
      "/src/assets/images/col_seasonal_kimono_1785380285577.jpg",
      "/src/assets/images/col_secret_account_49_1785495743866.jpg",
      "/src/assets/images/col_short_term_1783677909352.jpg",
      "/src/assets/images/col_skincare_bottles_1785381374.jpg",
      "/src/assets/images/col_skincare_glow_92_1785507628390.jpg",
      "/src/assets/images/col_smart_planner_1783883692671.jpg",
      "/src/assets/images/col_sparkling_juice_1785381377.jpg",
      "/src/assets/images/col_star_necklace_97_1785507710568.jpg",
      "/src/assets/images/col_star_pendant_1785381379.jpg",
      "/src/assets/images/col_starlit_moon_1785381005_1785380618892.jpg",
      "/src/assets/images/col_starry_window_1785380333938.jpg",
      "/src/assets/images/col_stationery_notebook_1785381376.jpg",
      "/src/assets/images/col_strawberry_parfait_1785381001_1785380565566.jpg",
      "/src/assets/images/col_tax_guide_1783677870446.jpg",
      "/src/assets/images/col_travel_map_1785380368965.jpg",
      "/src/assets/images/col_trial_guide_1783677848466.jpg",
      "/src/assets/images/col_trial_step_57_1785495851341.jpg",
      "/src/assets/images/col_vintage_camera_1785381009_1785380673843.jpg",
      "/src/assets/images/col_weekend_shift_1783677940789.jpg",
      "/src/assets/images/col_welcome_booklet_54_1785495804984.jpg",
      "/src/assets/images/col_welcome_gift_1783883703745.jpg",
      "/src/assets/images/col_yukata_ribbon_1785381371.jpg",
      "/src/assets/images/new_col_cherry_tea_1785378552865.jpg",
      "/src/assets/images/new_col_coffee_laptop_1785378489412.jpg",
      "/src/assets/images/new_col_cozy_sofa_1785378602940.jpg",
      "/src/assets/images/new_col_gold_piggy_1785378525722.jpg",
      "/src/assets/images/new_col_hair_salon_1785378540259.jpg",
      "/src/assets/images/new_col_heart_shield_1785378576575.jpg",
      "/src/assets/images/new_col_luggage_travel_1785378592409.jpg",
      "/src/assets/images/new_col_makeup_bag_1785378503353.jpg",
      "/src/assets/images/new_col_night_city_1785378564307.jpg",
      "/src/assets/images/new_col_train_commute_1785378515110.jpg",
      "/src/assets/images/premium_beauty_mirror_illust_1783983011517.jpg",
      "/src/assets/images/premium_cafe_study_illust_1783982999931.jpg",
      "/src/assets/images/premium_cat_mascot_illust_1783983070646.jpg",
      "/src/assets/images/premium_comfy_bedroom_illust_1783983257261.jpg",
      "/src/assets/images/premium_cute_chat_illust_1783983111499.jpg",
      "/src/assets/images/premium_cute_desk_illust_1783983276314.jpg",
      "/src/assets/images/premium_cute_outfit_illust_1783982989517.jpg",
      "/src/assets/images/premium_dorm_life_illust_1783982967926.jpg",
      "/src/assets/images/premium_flower_vase_illust_1783983192676.jpg",
      "/src/assets/images/premium_kimono_dress_illust_1783983134104.jpg",
      "/src/assets/images/premium_lucky_keys_illust_1783983202689.jpg",
      "/src/assets/images/premium_luxury_shopping_illust_1783983163266.jpg",
      "/src/assets/images/premium_mentor_advice_illust_1783983212274.jpg",
      "/src/assets/images/premium_morning_breakfast_illust_1783983222167.jpg",
      "/src/assets/images/premium_nail_art_illust_1783983247884.jpg",
      "/src/assets/images/premium_onsen_spa_illust_1783983059885.jpg",
      "/src/assets/images/premium_peaceful_yoga_illust_1783983173190.jpg",
      "/src/assets/images/premium_piggy_bank_illust_1783983266778.jpg",
      "/src/assets/images/premium_planner_flow_illust_1783983081126.jpg",
      "/src/assets/images/premium_rainy_boots_illust_1783983237954.jpg",
      "/src/assets/images/premium_relaxing_spa_illust_1783983152487.jpg",
      "/src/assets/images/premium_safety_heart_illust_1783983030211.jpg",
      "/src/assets/images/premium_smart_finance_illust_1783983021235.jpg",
      "/src/assets/images/premium_spring_umbrella_illust_1783983092350.jpg",
      "/src/assets/images/premium_support_hands_illust_1783982978701.jpg",
      "/src/assets/images/premium_tea_time_illust_1783983101716.jpg",
      "/src/assets/images/premium_warm_fireplace_illust_1783983182824.jpg",
      "/src/assets/images/premium_welcome_door_illust_1783983123541.jpg",
      "/src/assets/images/premium_women_friends_illust_1783983040476.jpg",
      "/src/assets/images/test_illustration_1783978015138.jpg",
      "/src/assets/images/tobita_advisor_avatar_1782370695372.jpg",
      "/src/assets/images/tobita_cast_one_1781787976936.jpg",
      "/src/assets/images/tobita_cast_one_real_1782374824918.jpg",
      "/src/assets/images/tobita_cast_three_1781788006133.jpg",
      "/src/assets/images/tobita_cast_three_real_1782374857559.jpg",
      "/src/assets/images/tobita_cast_two_1781787990991.jpg",
      "/src/assets/images/tobita_cast_two_real_1782374841336.jpg",
      "/src/assets/images/tobita_dream_hero_banner_1782557055526.jpg",
      "/src/assets/images/tobita_soft_hero_1782370495398.jpg",
      "/src/assets/images/tobita_streetscape_1782370386330.jpg"
    ];

    let maxId = 0;
    for (const a of currentArticles) {
      const parsedId = parseInt(a.id, 10);
      if (!isNaN(parsedId) && parsedId > maxId) {
        maxId = parsedId;
      }
    }
    const nextId = (maxId + index + 1).toString();
    const todayStr = new Date().toISOString().split("T")[0];
    const charCount = art.content ? JSON.stringify(art.content).length : 1200;
    const readTimeMinutes = Math.max(2, Math.ceil(charCount / 400));

    // Calculate current usage frequencies in client-side context
    const illustrationUsage = new Map<string, number>();
    for (const img of premiumIllustrations) {
      illustrationUsage.set(img, 0);
    }
    for (const a of currentArticles) {
      if (a.eyeCatch && illustrationUsage.has(a.eyeCatch)) {
        illustrationUsage.set(a.eyeCatch, illustrationUsage.get(a.eyeCatch)! + 1);
      }
    }

    // Sort illustrations so the least-used ones are first
    const sortedIllustrations = [...premiumIllustrations].sort((x, y) => {
      const countX = illustrationUsage.get(x) || 0;
      const countY = illustrationUsage.get(y) || 0;
      if (countX !== countY) {
        return countX - countY;
      }
      return premiumIllustrations.indexOf(x) - premiumIllustrations.indexOf(y);
    });
    const chosenEyeCatch = sortedIllustrations[0];

    // Deduplicate and sanitize URL slug on client side
    const existingSlugs = new Set(currentArticles.map(a => (a.slug || "").toLowerCase()));
    let slug = (art.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      slug = "tobitashinchi-column";
    }

    let uniqueSlug = slug;
    let counter = 1;
    while (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return {
      id: nextId,
      title: art.title || "【新コラム】飛田新地での働き方コラム",
      slug: uniqueSlug,
      category: art.category || "beginner",
      categoryLabel: art.categoryLabel || "未経験者向け",
      publishedAt: todayStr,
      readTime: `${readTimeMinutes}分`,
      summary: art.summary || "AIによって自動生成された最新のコラム記事です。",
      eyeCatch: chosenEyeCatch,
      author: {
        name: art.author?.name || "さくら",
        role: art.author?.role || "女性サポートスタッフ",
        avatar: art.author?.avatar || "👩‍💼"
      },
      content: art.content || [
        { type: "p", text: "準備中のコラムコンテンツです。" }
      ],
      tags: art.tags || ["AI自動生成", "未経験歓迎"]
    } as BlogArticle;
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep('AIコラム生成エンジンを初期化中...');
    
    // Simulate engaging progress steps
    const steps = [
      { text: '飛田新地のお仕事トレンド・未経験者の不安要素をAIで分析中...', delay: 1500 },
      { text: '読者の興味を惹くSEO向けタイトル・見出しの構成を構築中...', delay: 2500 },
      { text: '優しく安心感を与えるトーン（〜です、〜ます調）でコラム本文を執筆中（数十秒かかる場合があります）...', delay: 4000 },
      { text: '最新のプレミアムイラスト画像をアイキャッチに選定中...', delay: 2000 },
      { text: '全体のフォーマット確認、データベース保存準備完了...', delay: 1500 }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setGenerationStep(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    try {
      let data;
      let isClientSide = false;

      if (clientGeminiKey && aiModel === 'gemini') {
        isClientSide = true;
      }

      if (isClientSide) {
        console.log('Using browser client-side Gemini generation fallback...');
        setGenerationStep('ご自身のGemini APIキーを使用してブラウザ上で直接コラムを生成しています...');
        
        const generatedArticles: BlogArticle[] = [];
        let currentTempArticles = [...articles];
        for (let i = 0; i < aiCount; i++) {
          setGenerationStep(`[ブラウザ直接生成] 記事 ${i + 1}/${aiCount} を生成中（約10秒）...`);
          const art = await generateArticleClientSide(clientGeminiKey, i, aiCategory, aiTopic, currentTempArticles);
          generatedArticles.push(art);
          currentTempArticles = [art, ...currentTempArticles];
        }
        
        data = {
          success: true,
          count: generatedArticles.length,
          articles: generatedArticles
        };
      } else {
        const response = await fetch('/api/cms/generate-articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': getAdminPassword()
          },
          body: JSON.stringify({
            model: aiModel,
            count: aiCount,
            category: aiCategory,
            customTopic: aiTopic
          })
        });

        if (!response.ok) {
          const textResponse = await response.text().catch(() => '');
          if (textResponse.trim().startsWith('<!doctype html') || textResponse.trim().startsWith('<html') || response.status === 405) {
            throw new Error('static_hosting_fallback');
          }
          let errData;
          try {
            errData = JSON.parse(textResponse);
          } catch (e) {
            errData = {};
          }
          throw new Error(errData.error || '自動生成APIの呼び出しに失敗しました。');
        }

        data = await response.json();
      }

      clearInterval(interval);

      if (data.success && data.articles) {
        // Prepend generated articles
        const updatedArticles = [...data.articles, ...articles];
        setArticles(updatedArticles);
        saveArticles(updatedArticles);
        onRefreshBlog();
        
        // Push durably to Firebase
        await saveBlogArticlesToFirestore(updatedArticles);
        
        showAlert(`コラムを ${data.count} 件自動生成し、データベースに公開保存しました！`);
        setShowAiGenerator(false);
        setAiTopic('');
      } else {
        throw new Error('コラムの生成結果が空、または不正な形式です。');
      }

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      if (err.message === 'static_hosting_fallback') {
        setShowClientKeyInput(true);
        showAlert('【重要】このWebサイトは、現在「静的ホスティング（Cloudflare/Vercel等）」で公開されているため、サーバー側でのAI自動生成APIが利用できません。ご自身の Gemini APIキーを入力し、ブラウザから直接自動生成を実行（無料）してください。入力欄を自動で開きました。', 'error');
      } else {
        showAlert(err.message || 'コラムの自動生成中にエラーが発生しました。時間を置いて再度お試しください。', 'error');
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Block handlers
  const addBlock = (type: BlogArticle['content'][number]['type']) => {
    const newBlock: EditorBlock = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      text: type === 'p' ? '新しい段落文を入力してください。' : type === 'h2' ? '新しい中見出し' : type === 'h3' ? '新しい小見出し' : '',
      items: type === 'list' ? ['箇条書きリスト項目 1', '箇条書きリスト項目 2'] : undefined,
      question: type === 'qna' ? '質問を入力してください' : undefined,
      answer: type === 'qna' ? '回答をここに入力してください。安心できる丁寧なトーンがおすすめです。' : undefined
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlockText = (id: string, text: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, text } : b));
  };

  const updateBlockQna = (id: string, field: 'question' | 'answer', val: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        if (field === 'answer') {
          return { ...b, answer: val, text: val };
        }
        return { ...b, [field]: val };
      }
      return b;
    }));
  };

  const updateBlockListItems = (id: string, idx: number, val: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id && b.items) {
        const nextItems = [...b.items];
        nextItems[idx] = val;
        return { ...b, items: nextItems };
      }
      return b;
    }));
  };

  const addListItem = (id: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id && b.items) {
        return { ...b, items: [...b.items, '新しいリスト項目'] };
      }
      return b;
    }));
  };

  const removeListItem = (id: string, itemIdx: number) => {
    setBlocks(blocks.map(b => {
      if (b.id === id && b.items) {
        return { ...b, items: b.items.filter((_, idx) => idx !== itemIdx) };
      }
      return b;
    }));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (idx: number, direction: 'up' | 'down') => {
    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= blocks.length) return;
    
    const nextBlocks = [...blocks];
    const temp = nextBlocks[idx];
    nextBlocks[idx] = nextBlocks[nextIdx];
    nextBlocks[nextIdx] = temp;
    setBlocks(nextBlocks);
  };

  // Export full blogData as clean TypeScript
  const getExportCode = () => {
    const formatted = articles.map(({ id, ...rest }) => rest);
    return `// ==========================================
// 💡 このファイルを丸ごとダウンロードしたコードの 
//    「/src/blogData.ts」 に上書きコピーして貼り付けるだけで、
//    あなたのサーバーでもコラムが追加・保存されます！
// ==========================================

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: 'beginner' | 'salary' | 'security' | 'lifestyle' | 'onboarding';
  categoryLabel: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  eyeCatch: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  content: {
    type: 'p' | 'h2' | 'h3' | 'list' | 'cta' | 'qna';
    text?: string;
    items?: string[];
    question?: string;
    answer?: string;
  }[];
  tags: string[];
}

export const BLOG_CATEGORIES = [
  { id: 'all', label: 'すべて' },
  { id: 'beginner', label: '未経験者向け' },
  { id: 'salary', label: '給与・待遇' },
  { id: 'security', label: '安心・身バレ対策' },
  { id: 'lifestyle', label: '生活・働き方' },
  { id: 'onboarding', label: '面接・お仕事の流れ' }
];

export const BLOG_ARTICLES: BlogArticle[] = ${JSON.stringify(articles, null, 2)};

export function getStoredArticles(): BlogArticle[] {
  if (typeof window === 'undefined') return BLOG_ARTICLES;
  const stored = localStorage.getItem('custom_blog_articles');
  if (!stored) {
    return BLOG_ARTICLES;
  }
  try {
    const customArticles = JSON.parse(stored) as BlogArticle[];
    if (customArticles.length === 0) return BLOG_ARTICLES;
    return customArticles;
  } catch (e) {
    console.error('Error parsing custom blog articles:', e);
    return BLOG_ARTICLES;
  }
}

export function saveArticles(articles: BlogArticle[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('custom_blog_articles', JSON.stringify(articles));
}
`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getExportCode());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-surface border-t border-rose-100 py-12 px-4 sm:px-6 lg:px-8 min-h-[600px]">
      
      {/* Alert Banner */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold text-sm ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            <CheckCircle2 size={18} className={alertMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
            {alertMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {!isAuthenticated ? (
        <>
          {/* ==========================================
             A. LOGIN FORM SCREEN
             ========================================== */}
          <div className="max-w-md mx-auto bg-white border border-outline-variant rounded-4xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-secondary mb-3">
              <KeyRound size={22} />
            </div>
            <h2 className="text-xl font-bold text-[#2c1a1e]">管理者用ログイン</h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              コラムを新規追加・編集・削除するためのシステム管理画面です。ログインしてください。
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">管理者ログインID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#5e474c]/50">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="IDを入力してください"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">セキュリティパスワード</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#5e474c]/50">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="パスワードを入力してください"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm transition-all"
                />
              </div>
              {loginError && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {loginError}
                </p>
              )}
            </div>



            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 bg-white border border-outline-variant rounded-2xl text-xs font-bold text-on-surface hover:bg-rose-50 transition-all cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-secondary hover:bg-opacity-95 text-white font-bold rounded-2xl text-sm shadow-md shadow-secondary/10 transition-all cursor-pointer"
              >
                ログイン
              </button>
            </div>
          </form>
        </div>
      </>
      ) : isEditing ? (
        /* ==========================================
           B. CMS ARTICLE EDITOR SCREEN
           ========================================== */
        <div className="max-w-4xl mx-auto bg-white border border-outline-variant rounded-4xl p-6 md:p-8 shadow-sm">
          {/* Editor Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-rose-50 mb-6">
            <div>
              <span className="text-xs text-secondary font-semibold uppercase tracking-wider">ARTICLE BUILDER</span>
              <h2 className="text-xl md:text-2xl font-bold text-[#2c1a1e] flex items-center gap-1.5">
                <FileText size={20} className="text-secondary" />
                {editingArticleId ? 'コラムの編集' : '新しいコラムの追加'}
              </h2>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2 bg-white border border-outline-variant rounded-2xl text-xs font-bold text-on-surface hover:bg-rose-50 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                キャンセル
              </button>
              <button
                onClick={handleSaveArticle}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-5 py-2 bg-secondary hover:bg-opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-secondary/15 transition-all cursor-pointer"
              >
                <Save size={14} />
                保存して公開
              </button>
            </div>
          </div>

          {/* Form Meta Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Title & Slug */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">コラムタイトル <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="例: 【初心者必読】飛田新地の1日の流れを徹底解説！"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">スラッグ（URLパーツ / 半角英数字） <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="例: tobitashinchi-flow-guide"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">コラムカテゴリー</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm"
                >
                  <option value="beginner">未経験者向け</option>
                  <option value="salary">給与・待遇</option>
                  <option value="security">安心・身バレ対策</option>
                  <option value="lifestyle">生活・働き方</option>
                  <option value="onboarding">面接・お仕事の流れ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">タグ（カンマ区切り）</label>
                <input
                  type="text"
                  placeholder="未経験歓迎, 飛田新地, 日給10万"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm"
                />
              </div>
            </div>

            {/* Eyecatch, Author, Summary */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">アイキャッチ (絵文字か画像URL)</label>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-surface-container rounded-xl border border-outline-variant flex items-center justify-center shrink-0 text-xl overflow-hidden select-none">
                      {isImageUrl(eyeCatch) ? (
                        <img 
                          src={eyeCatch.startsWith('http') || eyeCatch.startsWith('/') ? eyeCatch : `/${eyeCatch}`} 
                          className="w-full h-full object-cover" 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        eyeCatch
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="例: 🌸 や 画像のURL"
                      value={eyeCatch}
                      onChange={(e) => setEyeCatch(e.target.value)}
                      className="flex-grow px-3 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">監修者アバター</label>
                  <input
                    type="text"
                    placeholder="👩‍💼 や 👨‍💻"
                    value={authorAvatar}
                    onChange={(e) => setAuthorAvatar(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm text-center font-display"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">監修スタッフ名</label>
                  <input
                    type="text"
                    placeholder="さくら"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">監修者の役職</label>
                  <input
                    type="text"
                    placeholder="女性サポートスタッフ"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">コラムの要約（一覧画面で表示）</label>
                <textarea
                  rows={3}
                  placeholder="コラムの概要や引き付ける紹介文を2〜3文で記述してください。"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Core Content Blocks Builder */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-[#2c1a1e] border-b border-rose-100 pb-2 mb-4 flex items-center justify-between">
              <span>本文のブロック構成</span>
              <span className="text-xs text-on-surface-variant font-normal">お好きな順番でドラッグ・追加・編集できます</span>
            </h3>

            {/* Block list */}
            <div className="space-y-4 mb-6" id="editor-blocks-container">
              {blocks.map((block, idx) => (
                <div 
                  key={block.id} 
                  className={`relative p-5 rounded-3xl border transition-all ${
                    block.type === 'cta' 
                      ? 'bg-rose-50/40 border-rose-200/60' 
                      : block.type === 'qna'
                      ? 'bg-[#06c755]/5 border-[#06c755]/15'
                      : 'bg-surface border-outline-variant'
                  }`}
                >
                  {/* Block Header Toolbar */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                      block.type === 'h2' ? 'bg-secondary text-white' :
                      block.type === 'h3' ? 'bg-pink-100 text-secondary' :
                      block.type === 'list' ? 'bg-amber-100 text-amber-800' :
                      block.type === 'cta' ? 'bg-[#2c1a1e] text-white' :
                      block.type === 'qna' ? 'bg-[#06c755] text-white' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {block.type === 'p' && '本文段落 (p)'}
                      {block.type === 'h2' && '中見出し (H2)'}
                      {block.type === 'h3' && '小見出し (H3)'}
                      {block.type === 'list' && '箇条書き (List)'}
                      {block.type === 'cta' && 'LINEお問い合わせ誘導 (CTA)'}
                      {block.type === 'qna' && 'よくある質問 Q&A'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveBlock(idx, 'up')}
                        className="p-1 hover:bg-white rounded-md text-on-surface-variant hover:text-on-surface disabled:opacity-35 cursor-pointer"
                        title="上に移動"
                      >
                        <MoveUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === blocks.length - 1}
                        onClick={() => moveBlock(idx, 'down')}
                        className="p-1 hover:bg-white rounded-md text-on-surface-variant hover:text-on-surface disabled:opacity-35 cursor-pointer"
                        title="下に移動"
                      >
                        <MoveDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 hover:bg-white rounded-md text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="ブロック削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Block Content Inputs */}
                  {block.type === 'cta' ? (
                    <div className="text-center py-2 text-xs text-on-surface-variant leading-relaxed">
                      💡 LINE公式への無料相談リンク、および給与シミュレーターが並ぶコンバージョン用のバナーがここに自動挿入されます。
                    </div>
                  ) : block.type === 'qna' ? (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Q. 知りたい質問は？ (例: お酒が全く飲めないのですが…)"
                        value={block.question || ''}
                        onChange={(e) => updateBlockQna(block.id, 'question', e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-xs font-semibold"
                      />
                      <textarea
                        rows={2}
                        placeholder="A. 回答を記述します。お酒が飲めなくても笑顔で話せれば全く問題ありませんよ、など安心感を与える内容がベスト。"
                        value={block.answer || block.text || ''}
                        onChange={(e) => updateBlockQna(block.id, 'answer', e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-xs"
                      />
                    </div>
                  ) : block.type === 'list' ? (
                    <div className="space-y-2">
                      {block.items?.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-secondary">{itemIdx + 1}.</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateBlockListItems(block.id, itemIdx, e.target.value)}
                            className="flex-grow px-3 py-1.5 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeListItem(block.id, itemIdx)}
                            className="text-xs text-rose-500 p-1 hover:bg-rose-50 rounded-md cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addListItem(block.id)}
                        className="mt-1 text-xs text-secondary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Plus size={12} /> 箇条書き項目を追加
                      </button>
                    </div>
                  ) : (
                    <textarea
                      rows={block.type === 'p' ? 3 : 1}
                      placeholder={block.type === 'p' ? "ここに段落本文を入力します。" : block.type === 'h2' ? "中見出しを入力します。" : "小見出しを入力します。"}
                      value={block.text || ''}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      className={`w-full px-3.5 py-2 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-sm ${
                        block.type === 'h2' ? 'font-bold text-[#2c1a1e]' : block.type === 'h3' ? 'font-bold text-secondary' : 'leading-relaxed'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Block Adder Actions bar */}
            <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant text-center">
              <p className="text-xs font-bold text-on-surface-variant mb-3">新しいコンテンツブロックを追加する</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => addBlock('p')}
                  className="px-3.5 py-2 bg-white border border-outline-variant hover:border-secondary hover:text-secondary rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  本文段落 (P)
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('h2')}
                  className="px-3.5 py-2 bg-white border border-outline-variant hover:border-secondary hover:text-secondary rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  中見出し (H2)
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('h3')}
                  className="px-3.5 py-2 bg-white border border-outline-variant hover:border-secondary hover:text-secondary rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  小見出し (H3)
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('list')}
                  className="px-3.5 py-2 bg-white border border-outline-variant hover:border-secondary hover:text-secondary rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  リスト (List)
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('qna')}
                  className="px-3.5 py-2 bg-white border border-[#06c755] text-[#06c755] hover:bg-emerald-50 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  よくある質問 (Q&A)
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('cta')}
                  className="px-3.5 py-2 bg-[#2c1a1e] hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus size={14} />
                  LINE誘導 (CTA)
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer Button in Editor */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-rose-50 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-white border border-outline-variant rounded-2xl text-sm font-bold text-on-surface hover:bg-rose-50 transition-all cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveArticle}
              className="px-8 py-2.5 bg-secondary hover:bg-opacity-95 text-white font-bold rounded-2xl text-sm shadow-md shadow-secondary/15 transition-all cursor-pointer flex items-center gap-1"
            >
              <Save size={16} />
              変更を保存して公開する
            </button>
          </div>
        </div>
      ) : (
        /* ==========================================
           C. CMS DASHBOARD SCREEN (LIST ALL)
           ========================================== */
        <div className="max-w-5xl mx-auto">
          
          {/* Tab Selector */}
          <div className="flex flex-wrap border-b border-rose-100 mb-8 gap-1 md:gap-2">
            <button
              onClick={() => setActiveAdminTab('blog')}
              className={`px-3 md:px-5 py-3 text-xs md:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
                activeAdminTab === 'blog'
                  ? 'border-secondary text-secondary font-black'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <BookOpen size={16} />
              コラム管理 (CMS)
            </button>
            <button
              onClick={() => setActiveAdminTab('site')}
              className={`px-3 md:px-5 py-3 text-xs md:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
                activeAdminTab === 'site'
                  ? 'border-secondary text-secondary font-black'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Settings size={16} />
              サイト文章編集 (CMS)
            </button>
            <button
              onClick={() => setActiveAdminTab('consultation')}
              className={`px-3 md:px-5 py-3 text-xs md:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
                activeAdminTab === 'consultation'
                  ? 'border-secondary text-secondary font-black'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Inbox size={16} />
              直接お問合せ一覧 (Firebase)
            </button>
          </div>

          {activeAdminTab === 'blog' ? (
            <>
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-secondary border border-rose-100">
                    <BookOpen size={12} />
                    コラム管理システム (CMS)
                  </span>
                  <h2 className="text-2xl font-bold text-[#2c1a1e] mt-1.5 font-sans">飛田ガールズ コラムダッシュボード</h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    現在登録されているすべてのコラムをリアルタイムで追加・変更・削除できます。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    onClick={handleResetToDefault}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                    title="初期化"
                  >
                    <RotateCcw size={14} />
                    コラム初期化
                  </button>
                  <button
                    onClick={() => setShowCodeExport(true)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-[#2c1a1e] hover:bg-black text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Copy size={14} />
                    コード出力
                  </button>
                  <button
                    onClick={() => setShowAiGenerator(!showAiGenerator)}
                    className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                      showAiGenerator
                        ? 'bg-rose-100 border-rose-300 text-rose-800'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-rose-500/10 border-transparent'
                    }`}
                  >
                    <Sparkles size={14} className={showAiGenerator ? 'animate-spin' : 'animate-pulse'} />
                    AIコラム自動生成
                  </button>
                  <button
                    onClick={handleStartCreate}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1 px-5 py-2.5 bg-secondary hover:bg-[#b03f62] text-white rounded-2xl text-xs font-bold shadow-md shadow-secondary/15 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    新規コラム追加
                  </button>
                </div>
              </div>

              {/* Code Export Drawer/Modal */}
              <AnimatePresence>
                {showCodeExport && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-900 text-zinc-100 rounded-3xl p-5 mb-8 border border-zinc-800 shadow-xl overflow-hidden"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-800 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Sparkles size={16} className="text-amber-400" />
                          書き出しソースコードの取得
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          ここに入力したデータを含めた新しい <code className="text-secondary font-mono">blogData.ts</code> を自動生成しました。コピペで完全反映できます！
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyCode}
                          className="px-3 py-1.5 bg-secondary hover:bg-opacity-90 rounded-xl text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          {isCopied ? 'コピー完了' : 'コードをコピー'}
                        </button>
                        <button
                          onClick={() => setShowCodeExport(false)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer"
                        >
                          閉じる
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        rows={8}
                        value={getExportCode()}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-zinc-300 focus:outline-none focus:ring-0"
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] text-zinc-500 select-none">
                        Type: TypeScript
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Auto-Generator Drawer */}
              <AnimatePresence>
                {showAiGenerator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50/30 border border-rose-100 rounded-3xl p-6 mb-8 shadow-sm overflow-hidden"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-rose-100 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white">
                          <Sparkles size={16} className="animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#2c1a1e] flex items-center gap-1">
                            AIコラム自動生成パネル
                          </h3>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                            高品質なサポート・紹介コラムを、一括で自動生成して瞬時にデータベースへ公開・保存します。
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAiGenerator(false)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-outline-variant rounded-xl text-xs font-bold text-on-surface cursor-pointer transition-colors"
                        disabled={isGenerating}
                      >
                        閉じる
                      </button>
                    </div>

                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-pink-100 animate-pulse"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-pink-500">
                            <Sparkles size={24} className="animate-pulse" />
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-[#2c1a1e] animate-pulse">AIがコラムを生成しています...</h4>
                        <p className="text-xs text-secondary font-medium max-w-md mt-2 leading-relaxed transition-all duration-300">
                          {generationStep}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-4">
                          ※生成完了まで15秒〜45秒ほどかかる場合があります。画面を閉じずにお待ちください。
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Options Section */}
                        <div className="md:col-span-8 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* AI Model Choice */}
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">AIモデルの選択</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAiModel('gemini')}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    aiModel === 'gemini'
                                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                                      : 'bg-white border-outline-variant text-on-surface hover:bg-rose-50/30'
                                  }`}
                                >
                                  <span>Gemini (推奨・即時稼働)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAiModel('claude')}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    aiModel === 'claude'
                                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                                      : 'bg-white border-outline-variant text-on-surface hover:bg-rose-50/30'
                                  }`}
                                >
                                  <span>Claude 3.5 Sonnet</span>
                                </button>
                              </div>
                            </div>

                            {/* Batch Count Selection */}
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">同時生成件数</label>
                              <div className="grid grid-cols-4 gap-1.5">
                                {[1, 2, 3, 5].map((count) => (
                                  <button
                                    key={count}
                                    type="button"
                                    onClick={() => setAiCount(count)}
                                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                      aiCount === count
                                        ? 'bg-[#2c1a1e] border-[#2c1a1e] text-white shadow-xs'
                                        : 'bg-white border-outline-variant text-on-surface hover:bg-rose-50/30'
                                    }`}
                                  >
                                    {count}件
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Category Filter */}
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">生成カテゴリー</label>
                              <select
                                value={aiCategory}
                                onChange={(e) => setAiCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-xs"
                              >
                                <option value="all">おまかせ (カテゴリーを分散)</option>
                                <option value="beginner">未経験者向け</option>
                                <option value="salary">給与・待遇</option>
                                <option value="security">安心・身バレ対策</option>
                                <option value="lifestyle">生活・働き方</option>
                                <option value="onboarding">面接・お仕事の流れ</option>
                              </select>
                            </div>

                            {/* Custom topic prompt */}
                            <div>
                              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">特定のテーマ・ご要望 (任意)</label>
                              <input
                                type="text"
                                placeholder="例: 体験入店の一日の流れ、身バレ対策の鉄則など"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-xs"
                              />
                            </div>
                          </div>

                          {/* Client API Key Fallback Settings */}
                          <div className="mt-4 pt-3 border-t border-rose-100/50">
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="text-xs font-bold text-[#2c1a1e] flex items-center gap-1.5">
                                <span>🔑 ブラウザ直接生成モード (静的ホスティング用)</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowClientKeyInput(!showClientKeyInput)}
                                className="text-[10px] font-bold text-secondary hover:underline cursor-pointer"
                              >
                                {showClientKeyInput ? '設定を閉じる' : 'Gemini APIキーを設定・表示する'}
                              </button>
                            </div>
                            
                            {showClientKeyInput && (
                              <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                                  Cloudflare Pages、Vercelなどの静的ホスティングで運用されている場合、サーバー側のAPIが動作しません。
                                  下記にご自身の <strong>Gemini APIキー</strong> を保存することで、ブラウザから直接AI生成を可能にします（キーは本人のブラウザ内にのみ安全に保存されます）。
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="password"
                                    placeholder="AIzaSy..."
                                    value={clientGeminiKey}
                                    onChange={(e) => {
                                      const key = e.target.value;
                                      setClientGeminiKey(key);
                                      localStorage.setItem('client_gemini_api_key', key);
                                    }}
                                    className="flex-grow px-3 py-1.5 bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-secondary text-xs font-mono"
                                  />
                                  {clientGeminiKey && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setClientGeminiKey('');
                                        localStorage.removeItem('client_gemini_api_key');
                                        showAlert('APIキーを消去しました。');
                                      }}
                                      className="px-3 py-1.5 bg-rose-100 text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-200 cursor-pointer"
                                    >
                                      クリア
                                    </button>
                                  )}
                                </div>
                                <div className="text-[9px] text-rose-500/80">
                                  ※ APIキーをお持ちでない場合は、Google AI Studio で無料のキーを1分で発行できます。
                                </div>
                              </div>
                            )}
                            
                            {clientGeminiKey ? (
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                                <span>● ブラウザ直接生成モードが有効です (Gemini APIキー設定済み)</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-1">
                                <span>○ 通常モード (サーバーAPI経由で生成します)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Guide/Launcher Section */}
                        <div className="md:col-span-4 bg-white rounded-3xl p-5 border border-rose-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-secondary font-extrabold tracking-wider uppercase">HOW IT WORKS</span>
                            <h4 className="text-xs font-bold text-[#2c1a1e] mt-1">安心安全な自動生成</h4>
                            <p className="text-[10px] text-on-surface-variant mt-1.5 leading-relaxed">
                              飛田ガールズのコンセプトに基づき、未経験の女性が知りたい情報、ノルマなし、飲酒強要なし、1日体入のメリットなどを自動で盛り込んだSEOに強い記事を作成します。アイキャッチ画像には本番用の厳選イラストを自動でセットします。
                            </p>
                          </div>
                          
                          <button
                            onClick={handleAiGenerate}
                            className="mt-4 w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-2xl text-xs shadow-md shadow-rose-500/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles size={14} className="animate-pulse" />
                            AIコラム生成を開始する
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Articles list grid */}
              <div className="bg-white border border-outline-variant rounded-4xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-rose-50 bg-surface-container-low flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2c1a1e] font-sans">コラム数: <span className="font-mono">{articles.length}</span>件</span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-on-surface-variant hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LogOut size={13} />
                    管理画面を閉じる・ログアウト
                  </button>
                </div>

                {articles.length > 0 ? (
                  <div className="divide-y divide-rose-50/50">
                    {articles.map((article) => (
                      <div 
                        key={article.id} 
                        className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:bg-rose-50/10 transition-colors"
                      >
                        {/* Left: Meta & Title */}
                        <div className="flex gap-4 items-center flex-grow max-w-2xl">
                          <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center shrink-0 border border-outline-variant text-2xl select-none overflow-hidden">
                            {isImageUrl(article.eyeCatch) ? (
                              <img 
                                src={article.eyeCatch.startsWith('http') || article.eyeCatch.startsWith('/') ? article.eyeCatch : `/${article.eyeCatch}`} 
                                alt={article.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              article.eyeCatch
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap gap-2 items-center text-[11px] font-sans mb-1 text-on-surface-variant">
                              <span className="font-semibold text-secondary bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100/55">{article.categoryLabel}</span>
                              <span>•</span>
                              <span>公開日: <span className="font-mono">{article.publishedAt}</span></span>
                              <span>•</span>
                              <span>読了: <span className="font-mono">{article.readTime}</span></span>
                            </div>
                            <h3 className="text-sm font-bold text-[#2c1a1e] leading-snug hover:text-secondary cursor-pointer" onClick={() => handleStartEdit(article)}>
                              {article.title}
                            </h3>
                            <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5 leading-relaxed">
                              {article.summary}
                            </p>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 justify-end">
                          <button
                            onClick={() => handleStartEdit(article)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-secondary border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 size={13} />
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id, article.title)}
                            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShieldAlert size={40} className="mx-auto text-rose-300 mb-3" />
                    <p className="text-sm font-bold text-[#2c1a1e]">コラムが登録されていません</p>
                    <p className="text-xs text-on-surface-variant mt-1">「新規コラム追加」ボタンから追加してみましょう！</p>
                  </div>
                )}
              </div>
            </>
          ) : activeAdminTab === 'site' ? (
            /* ==========================================
               SITE TEXT EDITOR CMS
               ========================================== */
            <div className="bg-white border border-outline-variant rounded-4xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-rose-50">
                <div>
                  <h3 className="text-xl font-bold text-[#2c1a1e] flex items-center gap-1.5">
                    <Settings size={20} className="text-secondary animate-spin-slow" />
                    サイト内文章編集システム
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    スマホやパソコンで閲覧される、求人トップページのあらゆる文章・見出しを直感的に変更できます。
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={handleResetSiteContent}
                    className="flex-grow md:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    初期テキストに戻す
                  </button>
                  <button
                    onClick={handleSaveSiteContent}
                    className="flex-grow md:flex-initial inline-flex items-center justify-center gap-1 px-6 py-2.5 bg-secondary hover:bg-opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-secondary/15 transition-all cursor-pointer animate-pulse"
                  >
                    <Save size={14} />
                    変更を保存する
                  </button>
                </div>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap gap-1.5 mb-8 bg-rose-50/20 p-1.5 rounded-2xl border border-rose-100/30">
                <button
                  onClick={() => setActiveSiteSection('hero')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'hero' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  メインビジュアル
                </button>
                <button
                  onClick={() => setActiveSiteSection('concerns')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'concerns' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  解決お悩み (5項目)
                </button>
                <button
                  onClick={() => setActiveSiteSection('reasons')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'reasons' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  選ばれる理由 (6項目)
                </button>
                <button
                  onClick={() => setActiveSiteSection('jobs')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'jobs' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  店舗情報・給与・シミュレータ
                </button>
                <button
                  onClick={() => setActiveSiteSection('flow')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'flow' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  応募フロー (6ステップ)
                </button>
                <button
                  onClick={() => setActiveSiteSection('faq')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'faq' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  よくある質問 (10項目)
                </button>
                <button
                  onClick={() => setActiveSiteSection('consultation')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeSiteSection === 'consultation' ? 'bg-secondary text-white shadow-xs' : 'text-on-surface-variant hover:bg-rose-50/40'
                  }`}
                >
                  相談・応募フォーム・LINE
                </button>
              </div>

              {/* Dynamic form based on selected section */}
              <div className="space-y-6" id="site-content-form-fields">
                {activeSiteSection === 'hero' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b pb-1 mb-2">キャッチコピー・タイトル</h4>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">最上部タグライン（ピンク文字）</label>
                        <input
                          type="text"
                          value={siteText.hero.tagline}
                          onChange={(e) => updateHeroField('tagline', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">大見出し1行目</label>
                        <input
                          type="text"
                          value={siteText.hero.titleLine1}
                          onChange={(e) => updateHeroField('titleLine1', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">大見出し2行目（強調）</label>
                        <input
                          type="text"
                          value={siteText.hero.titleLine2}
                          onChange={(e) => updateHeroField('titleLine2', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b pb-1 mb-2">説明文・CTAボタン</h4>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">説明文 1行目</label>
                        <input
                          type="text"
                          value={siteText.hero.descriptionLine1}
                          onChange={(e) => updateHeroField('descriptionLine1', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">説明文 2行目</label>
                        <input
                          type="text"
                          value={siteText.hero.descriptionLine2}
                          onChange={(e) => updateHeroField('descriptionLine2', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">説明文 3行目（シミュレータ誘導）</label>
                        <input
                          type="text"
                          value={siteText.hero.descriptionLine3}
                          onChange={(e) => updateHeroField('descriptionLine3', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">応募ボタン文字</label>
                          <input
                            type="text"
                            value={siteText.hero.ctaButtonText}
                            onChange={(e) => updateHeroField('ctaButtonText', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">バッジ文言</label>
                          <input
                            type="text"
                            value={siteText.hero.badgeText}
                            onChange={(e) => updateHeroField('badgeText', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSiteSection === 'concerns' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">セクションタイトル</label>
                        <input
                          type="text"
                          value={siteText.concerns.title}
                          onChange={(e) => updateConcernsField('title', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">セクションサブタイトル</label>
                        <input
                          type="text"
                          value={siteText.concerns.subtitle}
                          onChange={(e) => updateConcernsField('subtitle', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-rose-50">
                      <h4 className="text-xs font-bold text-secondary">お悩み質問 & 回答 (全5項目)</h4>
                      {siteText.concerns.items.map((item, idx) => (
                        <div key={item.id} className="p-4 bg-rose-50/10 border border-rose-100/50 rounded-3xl space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-secondary font-mono">お悩み #{idx + 1} ({item.title})</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">短縮タイトル</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateConcernItem(idx, 'title', e.target.value)}
                                className="w-full px-3.5 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">質問（女の子側の悩み）</label>
                              <input
                                type="text"
                                value={item.question}
                                onChange={(e) => updateConcernItem(idx, 'question', e.target.value)}
                                className="w-full px-3.5 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">回答（アドバイザーの答え）</label>
                            <textarea
                              rows={2}
                              value={item.answer}
                              onChange={(e) => updateConcernItem(idx, 'answer', e.target.value)}
                              className="w-full px-3.5 py-1.5 bg-white border border-outline-variant rounded-xl text-xs resize-none focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSiteSection === 'reasons' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">セクションタイトル</label>
                        <input
                          type="text"
                          value={siteText.reasons.title}
                          onChange={(e) => updateReasonsField('title', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">セクションサブタイトル</label>
                        <input
                          type="text"
                          value={siteText.reasons.subtitle}
                          onChange={(e) => updateReasonsField('subtitle', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-rose-50">
                      <h4 className="text-xs font-bold text-secondary">選ばれる理由 (全6項目)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {siteText.reasons.items.map((item, idx) => (
                          <div key={item.number || idx} className="p-4 bg-rose-50/10 border border-rose-100/50 rounded-3xl space-y-2.5">
                            <span className="text-xs font-black text-secondary font-mono block">理由 #{idx + 1}</span>
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">理由タイトル</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateReasonItem(idx, 'title', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">理由詳細説明</label>
                              <textarea
                                rows={2}
                                value={item.description}
                                onChange={(e) => updateReasonItem(idx, 'description', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs resize-none focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSiteSection === 'jobs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b pb-1 mb-2">求人・店舗情報ヘッダー</h4>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">セクションタイトル</label>
                        <input
                          type="text"
                          value={siteText.jobs.title}
                          onChange={(e) => updateJobsField('title', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">セクションサブタイトル</label>
                        <input
                          type="text"
                          value={siteText.jobs.subtitle}
                          onChange={(e) => updateJobsField('subtitle', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">注意書き等</label>
                        <input
                          type="text"
                          value={siteText.jobs.infoSubtitle}
                          onChange={(e) => updateJobsField('infoSubtitle', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b pb-1 mb-2">1分でわかる！給与シミュレーター</h4>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">シミュレータータイトル</label>
                        <input
                          type="text"
                          value={siteText.jobs.simulatorTitle}
                          onChange={(e) => updateJobsField('simulatorTitle', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">シミュレーター概要（説明文）</label>
                        <textarea
                          rows={3}
                          value={siteText.jobs.simulatorDesc}
                          onChange={(e) => updateJobsField('simulatorDesc', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm resize-none focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSiteSection === 'flow' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">セクションタイトル</label>
                        <input
                          type="text"
                          value={siteText.flow.title}
                          onChange={(e) => updateFlowField('title', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">セクションサブタイトル</label>
                        <input
                          type="text"
                          value={siteText.flow.subtitle}
                          onChange={(e) => updateFlowField('subtitle', e.target.value)}
                          className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-rose-50">
                      <h4 className="text-xs font-bold text-secondary">応募から開始までのフロー (全6項目)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {siteText.flow.items.map((item, idx) => (
                          <div key={item.number || idx} className="p-4 bg-rose-50/10 border border-rose-100/50 rounded-3xl space-y-2">
                            <span className="text-xs font-black text-secondary font-mono block">ステップ {item.number}</span>
                            <div>
                              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">ステップ名</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateFlowItem(idx, e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSiteSection === 'faq' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-rose-50/15 border border-rose-100/50 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">Q&A大見出し（改行は \n または直接入力）</label>
                        <textarea
                          rows={2}
                          value={siteText.faq.title}
                          onChange={(e) => updateFaqField('title', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">相談役の役職ラベル</label>
                        <input
                          type="text"
                          value={siteText.faq.sidebarRole}
                          onChange={(e) => updateFaqField('sidebarRole', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">相談役からの一言</label>
                        <textarea
                          rows={2}
                          value={siteText.faq.sidebarMessage}
                          onChange={(e) => updateFaqField('sidebarMessage', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-rose-50">
                      <h4 className="text-xs font-bold text-secondary">よくある不安 Q&A リスト (全10問)</h4>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" id="faq-admin-scrollable">
                        {siteText.faq.items.map((item, idx) => (
                          <div key={item.id} className="p-4 bg-rose-50/10 border border-rose-100/50 rounded-3xl space-y-2">
                            <span className="text-xs font-black text-secondary font-mono block">質問 #{idx + 1}</span>
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">質問 (Q)</label>
                              <input
                                type="text"
                                value={item.question}
                                onChange={(e) => updateFaqItem(idx, 'question', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">回答 (A)</label>
                              <textarea
                                rows={2}
                                value={item.answer}
                                onChange={(e) => updateFaqItem(idx, 'answer', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-xl text-xs resize-none focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSiteSection === 'consultation' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Consultation Headers */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b pb-1 mb-2">相談・応募セクションヘッダー</h4>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">セクション大見出し（改行はそのまま入力）</label>
                          <textarea
                            rows={2}
                            value={siteText.consultation.title}
                            onChange={(e) => updateConsultationField('title', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">相談説明・メッセージ本文（改行はそのまま入力）</label>
                          <textarea
                            rows={3}
                            value={siteText.consultation.description}
                            onChange={(e) => updateConsultationField('description', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">プライバシー・厳守事項に関する注釈</label>
                          <input
                            type="text"
                            value={siteText.consultation.privacyNote}
                            onChange={(e) => updateConsultationField('privacyNote', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Right: Copy Template & LINE CTA */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-secondary uppercase tracking-widest border-b pb-1 mb-2">テンプレートコピー & LINE案内</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">コピペ用上部バッジ</label>
                            <input
                              type="text"
                              value={siteText.consultation.badgeText}
                              onChange={(e) => updateConsultationField('badgeText', e.target.value)}
                              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">コピーボタン文言</label>
                            <input
                              type="text"
                              value={siteText.consultation.copyButtonText}
                              onChange={(e) => updateConsultationField('copyButtonText', e.target.value)}
                              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">コピー促しサブタイトル</label>
                          <input
                            type="text"
                            value={siteText.consultation.copySubtitle}
                            onChange={(e) => updateConsultationField('copySubtitle', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">コピペ用応募テンプレート（改行はそのまま入力）</label>
                          <textarea
                            rows={4}
                            value={siteText.consultation.templateText}
                            onChange={(e) => updateConsultationField('templateText', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl font-mono text-xs focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">LINEボタン上のバッジ案内</label>
                            <input
                              type="text"
                              value={siteText.consultation.lineBadgeText}
                              onChange={(e) => updateConsultationField('lineBadgeText', e.target.value)}
                              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">LINEボタン表示文字</label>
                            <input
                              type="text"
                              value={siteText.consultation.lineButtonText}
                              onChange={(e) => updateConsultationField('lineButtonText', e.target.value)}
                              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">LINEボタン下の注釈</label>
                          <input
                            type="text"
                            value={siteText.consultation.lineSubtitle}
                            onChange={(e) => updateConsultationField('lineSubtitle', e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-2xl text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer Button inside Site Editor */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-rose-50 justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white border border-outline-variant rounded-2xl text-sm font-bold text-on-surface hover:bg-rose-50 transition-all cursor-pointer"
                >
                  編集をやめる
                </button>
                <button
                  onClick={handleSaveSiteContent}
                  className="px-8 py-2.5 bg-secondary hover:bg-opacity-95 text-white font-bold rounded-2xl text-sm shadow-md shadow-secondary/15 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={16} />
                  変更を保存して反映する
                </button>
              </div>
            </div>
          ) : (
            /* ==========================================
               FIREBASE CONSULTATIONS MANAGER
               ========================================== */
            <div className="bg-white border border-outline-variant rounded-4xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-rose-50">
                <div>
                  <h3 className="text-xl font-bold text-[#2c1a1e] flex items-center gap-1.5 font-sans">
                    <Inbox size={20} className="text-secondary" />
                    直接お問合せ一覧 (Firebase CRM)
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    求人サイトのWEBフォームから直接送信された、応募者の生の声と連絡先が Firebase Firestore データベースに安全に蓄積されています。
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={fetchConsultationsData}
                    disabled={isLoadingConsultations}
                    className="flex-grow md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-rose-200 text-secondary hover:bg-rose-50 rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={14} className={isLoadingConsultations ? 'animate-spin' : ''} />
                    一覧を更新する
                  </button>
                </div>
              </div>

              {isLoadingConsultations ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-on-surface-variant">データをロード中...</p>
                </div>
              ) : consultationsList.length > 0 ? (
                <div className="space-y-4">
                  {consultationsList.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-5 rounded-3xl border transition-all text-left ${
                        item.status === 'unread' 
                          ? 'bg-rose-50/20 border-rose-200/60 shadow-xs' 
                          : 'bg-white border-outline-variant'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-rose-50/50">
                        <div className="flex items-center gap-2 flex-wrap text-xs font-sans">
                          <span className="font-bold text-sm text-[#2c1a1e]">{item.name}</span>
                          {item.age && (
                            <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              {item.age}
                            </span>
                          )}
                          <span className="text-zinc-400 font-mono text-[10px]">
                            {new Date(item.createdAt).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                            className={`px-3 py-1 text-[11px] font-black rounded-lg border focus:outline-none cursor-pointer transition-all ${
                              item.status === 'unread'
                                ? 'bg-rose-50 text-secondary border-rose-200 font-bold'
                                : item.status === 'contacted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                : 'bg-zinc-50 text-zinc-500 border-zinc-200 font-medium'
                            }`}
                          >
                            <option value="unread">未対応 (新規)</option>
                            <option value="read">確認済み</option>
                            <option value="contacted">対応完了 (連絡済み)</option>
                          </select>
                          <button
                            onClick={() => handleDeleteConsultationData(item.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="削除"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1 bg-zinc-50 rounded-2xl p-3 border border-zinc-200 space-y-1">
                          <span className="block text-[10px] font-bold text-zinc-500">返信用連絡先</span>
                          <span className="block text-xs font-bold text-[#2c1a1e] break-all select-all font-mono">
                            {item.contact}
                          </span>
                        </div>
                        <div className="md:col-span-3 bg-zinc-50/50 rounded-2xl p-3 border border-zinc-200">
                          <span className="block text-[10px] font-bold text-zinc-500 mb-1">相談内容</span>
                          <p className="text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed select-text font-sans">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-secondary/60">
                    <Inbox size={22} />
                  </div>
                  <p className="text-sm font-bold text-[#2c1a1e]">お問合せはまだ届いていません</p>
                  <p className="text-xs text-on-surface-variant">求人サイトのWEBフォームから相談が送信されると、ここに自動的に追加されます。</p>
                </div>
              )}
            </div>
          )}

          {/* Safe ZIP Download Options Section for Authenticated Admins */}
          <div className="max-w-md mx-auto mt-12 bg-white border border-outline-variant rounded-4xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-secondary mb-3">
              <Download size={22} />
            </div>
            <h3 className="text-base font-bold text-[#2c1a1e] mb-1.5">ファイル直接ダウンロード</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              プレビュー警告を完全に回避して、ウェブサイトのデータやソースコードを安全かつ一瞬でダウンロードできます。
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDownloadFile('/tobita-girls-website-release.zip', 'tobita-girls-website-release.zip', setIsDownloadingWeb)}
                disabled={isDownloadingWeb}
                className="w-full py-3 bg-secondary hover:bg-opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-secondary/10 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Archive size={14} />
                {isDownloadingWeb ? 'ダウンロード中...' : '本番公開用ウェブサイトZIP (HTML/CSS)'}
              </button>
              <button
                onClick={() => handleDownloadFile('/tobita-girls-source-code.zip', 'tobita-girls-source-code.zip', setIsDownloadingSource)}
                disabled={isDownloadingSource}
                className="w-full py-3 bg-white border border-outline-variant hover:bg-rose-50 font-bold text-on-surface rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={14} />
                {isDownloadingSource ? 'ダウンロード中...' : '開発用フルソースコードZIP (Node.js/React)'}
              </button>
            </div>
            <div className="mt-4 text-[10px] text-on-surface-variant opacity-70 leading-relaxed">
              ※ボタンをクリックするとブラウザのBlob通信により、リダイレクトの警告なしに直接ローカルへ安全に保存されます。
            </div>
          </div>

          {/* Action Back To App */}
          <div className="mt-8 text-center">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2c1a1e] hover:text-secondary cursor-pointer py-2 border-b border-transparent hover:border-secondary transition-all"
            >
              <ArrowLeft size={16} />
              プレビュー・コラム表示画面へ戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
