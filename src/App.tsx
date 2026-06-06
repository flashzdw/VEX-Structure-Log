import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Plus, Globe, Download, Upload, X, Home, Cog, Settings, CheckCircle, AlertCircle, AlertTriangle, Info, LogOut, User, Loader2, Menu } from 'lucide-react';
import { useStore } from './store-supabase';
import { translations } from './i18n';
import HomePage from './pages/Home';
import RecordForm from './pages/RecordForm';
import RecordDetail from './pages/RecordDetail';
import ExportPage from './pages/ExportPage';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import { clsx } from 'clsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useStore();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function Navigation() {
  const { language, setLanguage, records, exportData, importData, user, logout, isLoggedIn, loading } = useStore();
  const t = translations[language];
  const location = useLocation();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileContent, setImportFileContent] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<{ message: string }>;
  } | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const closeMobileMenu = () => setShowMobileMenu(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleExport = () => {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vex-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (importFileContent) {
      const result = await importData(importFileContent);
      setImportResult(result);
      
      setTimeout(() => {
        setShowImportModal(false);
        setImportFileContent('');
        setImportResult(null);
      }, 3000);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFileContent('');
    setImportResult(null);
  };

  return (
    <>
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-40 overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center text-gray-900 font-semibold text-base sm:text-lg whitespace-nowrap">
              工程进度管理!
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/"
                className={clsx(
                  "px-4 py-2 rounded-full text-center transition-all duration-200 text-sm font-medium whitespace-nowrap",
                  isActive('/') && !isActive('/new') && !isActive('/record') && !isActive('/edit') && !isActive('/export')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {language === 'zh' ? '首页' : 'Home'}
              </Link>

              <Link
                to="/new"
                className={clsx(
                  "px-4 py-2 rounded-full text-center transition-all duration-200 text-sm font-medium whitespace-nowrap",
                  isActive('/new')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {language === 'zh' ? '新建' : 'New'}
              </Link>

              <Link
                to="/export"
                className={clsx(
                  "px-4 py-2 rounded-full text-center transition-all duration-200 text-sm font-medium whitespace-nowrap",
                  isActive('/export')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {language === 'zh' ? '导出' : 'Export'}
              </Link>

              <button
                onClick={handleExport}
                disabled={records.length === 0}
                className={clsx(
                  "px-4 py-2 rounded-full text-center transition-all duration-200 text-sm font-medium whitespace-nowrap",
                  records.length === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {language === 'zh' ? '导出数据' : 'Export Data'}
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-full text-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                {language === 'zh' ? '导入数据' : 'Import Data'}
              </button>

              <Link
                to="/settings"
                className={clsx(
                  "px-4 py-2 rounded-full text-center transition-all duration-200 text-sm font-medium whitespace-nowrap",
                  isActive('/settings')
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {language === 'zh' ? '设置' : 'Settings'}
              </Link>

              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="px-4 py-2 rounded-full text-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm font-medium whitespace-nowrap"
              >
                {language === 'zh' ? '中文' : 'English'}
              </button>

              <div className="flex items-center gap-2 ml-2 border-l border-gray-200 pl-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="truncate max-w-[160px]">{user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-full text-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  {language === 'zh' ? '退出' : 'Logout'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              aria-label="Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <div className="sm:hidden fixed inset-x-0 top-20 z-50 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            <Link to="/" onClick={closeMobileMenu} className={clsx(
              "block px-4 py-3 rounded-xl text-sm font-medium",
              isActive('/') && !isActive('/new') && !isActive('/record') && !isActive('/edit') && !isActive('/export')
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50"
            )}>
              {language === 'zh' ? '首页' : 'Home'}
            </Link>
            <Link to="/new" onClick={closeMobileMenu} className={clsx(
              "block px-4 py-3 rounded-xl text-sm font-medium",
              isActive('/new')
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50"
            )}>
              {language === 'zh' ? '新建' : 'New'}
            </Link>
            <Link to="/export" onClick={closeMobileMenu} className={clsx(
              "block px-4 py-3 rounded-xl text-sm font-medium",
              isActive('/export')
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50"
            )}>
              {language === 'zh' ? '导出' : 'Export'}
            </Link>
            <button onClick={() => { handleExport(); closeMobileMenu(); }} disabled={records.length === 0} className={clsx(
              "w-full text-left block px-4 py-3 rounded-xl text-sm font-medium",
              records.length === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-50"
            )}>
              {language === 'zh' ? '导出数据' : 'Export Data'}
            </button>
            <button onClick={() => { setShowImportModal(true); closeMobileMenu(); }} className="w-full text-left block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              {language === 'zh' ? '导入数据' : 'Import Data'}
            </button>
            <Link to="/settings" onClick={closeMobileMenu} className={clsx(
              "block px-4 py-3 rounded-xl text-sm font-medium",
              isActive('/settings')
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50"
            )}>
              {language === 'zh' ? '设置' : 'Settings'}
            </Link>
            <button onClick={() => { setLanguage(language === 'zh' ? 'en' : 'zh'); closeMobileMenu(); }} className="w-full text-left block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              {language === 'zh' ? '中文' : 'English'}
            </button>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-4 py-2 text-sm text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="truncate">{user?.email}</span>
              </div>
              <button onClick={() => { logout(); closeMobileMenu(); }} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <LogOut className="w-4 h-4" />
                {language === 'zh' ? '退出' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'zh' ? '导入数据' : 'Import Data'}
              </h3>
              <button
                onClick={closeImportModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {importResult ? (
              <div className="space-y-4">
                <div className={clsx(
                  "p-4 rounded-xl",
                  importResult.success && importResult.errors.length === 0
                    ? "bg-green-50 border border-green-200"
                    : importResult.errors.some(e => e.message.includes('警告'))
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-red-50 border border-red-200"
                )}>
                  <div className="flex items-start gap-3">
                    {importResult.success && importResult.errors.length === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : importResult.errors.some(e => e.message.includes('警告')) ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={clsx(
                        "font-medium mb-2",
                        importResult.success && importResult.errors.length === 0
                          ? "text-green-800"
                          : importResult.errors.some(e => e.message.includes('警告'))
                          ? "text-yellow-800"
                          : "text-red-800"
                      )}>
                        {importResult.success && importResult.errors.length === 0
                          ? (language === 'zh' ? '导入成功！' : 'Import Successful!')
                          : importResult.errors.some(e => e.message.includes('警告'))
                          ? (language === 'zh' ? '导入完成（有问题）' : 'Import Completed (with warnings)')
                          : (language === 'zh' ? '导入失败' : 'Import Failed')}
                      </h4>
                      
                      <div className="text-sm space-y-1">
                        <div className="text-gray-700">
                          {language === 'zh' ? '成功导入：' : 'Imported: '} 
                          <span className="font-medium">{importResult.imported}</span> 
                          {language === 'zh' ? '条记录' : 'records'}
                        </div>
                        {importResult.skipped > 0 && (
                          <div className="text-gray-700">
                            {language === 'zh' ? '跳过：' : 'Skipped: '} 
                            <span className="font-medium text-orange-600">{importResult.skipped}</span> 
                            {language === 'zh' ? '条记录' : 'records'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      {language === 'zh' ? '详细信息' : 'Details'}
                    </h5>
                    <div className="space-y-1 text-xs text-gray-600">
                      {importResult.errors.slice(0, 10).map((error, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{error.message}</span>
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <div className="text-gray-500 italic mt-2">
                          {language === 'zh' ? `...还有 ${importResult.errors.length - 10} 条错误信息` : `...and ${importResult.errors.length - 10} more errors`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '选择 JSON 文件' : 'Select JSON File'}
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {language === 'zh' ? '支持从本应用导出的JSON文件' : 'Supports JSON files exported from this app'}
                  </p>
                </div>

                {importFileContent && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        {language === 'zh' ? '文件已加载' : 'File loaded'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeImportModal}
                    className="flex-1 px-5 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all duration-200"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFileContent}
                    className={clsx(
                      "flex-1 px-5 py-3 rounded-full text-sm font-medium transition-all duration-200",
                      importFileContent
                        ? "bg-gray-900 text-white hover:bg-gray-800 active:scale-95"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {language === 'zh' ? '导入' : 'Import'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  const { isLoggedIn } = useStore();
  
  return (
    <div className="min-h-screen bg-white">
      {isLoggedIn && <Navigation />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/new" element={
          <ProtectedRoute>
            <RecordForm />
          </ProtectedRoute>
        } />
        <Route path="/edit/:id" element={
          <ProtectedRoute>
            <RecordForm />
          </ProtectedRoute>
        } />
        <Route path="/record/:id" element={
          <ProtectedRoute>
            <RecordDetail />
          </ProtectedRoute>
        } />
        <Route path="/export" element={
          <ProtectedRoute>
            <ExportPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default function App() {
  const { initialize } = useStore();
  
  useEffect(() => {
    initialize();
  }, []);
  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
