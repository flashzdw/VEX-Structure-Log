import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, Settings as SettingsIcon, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useStore } from '../store-supabase';
import { clsx } from 'clsx';

export default function Settings() {
  const navigate = useNavigate();
  const { teams, addTeam, updateTeam, deleteTeam, language, user, loading, joinTeam, getTeamInviteCode } = useStore();
  const [newTeamName, setNewTeamName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const validateTeamName = (name: string): string | null => {
    if (!name.trim()) {
      return language === 'zh' ? '队伍名称不能为空' : 'Team name is required';
    }
    if (name.trim().length < 2) {
      return language === 'zh' ? '队伍名称至少2个字符' : 'Team name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return language === 'zh' ? '队伍名称不能超过50个字符' : 'Team name must not exceed 50 characters';
    }
    
    const exists = teams.some(t => t.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return language === 'zh' ? '该队伍名称已存在' : 'This team name already exists';
    }
    
    return null;
  };

  const handleAddTeam = async () => {
    const error = validateTeamName(newTeamName);
    if (error) {
      setErrors({ newTeam: error });
      return;
    }
    
    await addTeam(newTeamName.trim());
    setNewTeamName('');
    setShowAddForm(false);
    setErrors({});
    setSuccessMessage(language === 'zh' ? '队伍添加成功！' : 'Team added successfully!');
    setTimeout(() => setSuccessMessage(null), 2000);
  };
  
  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      setErrors({ join: language === 'zh' ? '请输入邀请码' : 'Please enter invite code' });
      return;
    }
    
    try {
      await joinTeam(inviteCode.trim());
      setInviteCode('');
      setShowJoinForm(false);
      setErrors({});
      setSuccessMessage(language === 'zh' ? '成功加入队伍！' : 'Successfully joined team!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      setErrors({ join: error instanceof Error ? error.message : '加入失败' });
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setErrors({});
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      setErrors({ edit: language === 'zh' ? '队伍名称不能为空' : 'Team name is required' });
      return;
    }
    
    const team = teams.find(t => t.id === editingId);
    if (team && team.name.toLowerCase() !== editingName.trim().toLowerCase()) {
      const exists = teams.some(t => t.name.toLowerCase() === editingName.trim().toLowerCase());
      if (exists) {
        setErrors({ edit: language === 'zh' ? '该队伍名称已存在' : 'This team name already exists' });
        return;
      }
    }
    
    if (editingId && editingName.trim()) {
      await updateTeam(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
      setErrors({});
      setSuccessMessage(language === 'zh' ? '队伍更新成功！' : 'Team updated successfully!');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setErrors({});
  };

  const handleDeleteClick = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const handleConfirmDelete = async () => {
    if (showDeleteConfirm) {
      await deleteTeam(showDeleteConfirm);
      setShowDeleteConfirm(null);
      setSuccessMessage(language === 'zh' ? '队伍删除成功！' : 'Team deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleCopyInviteCode = async (teamId: string) => {
    setCopyingId(teamId);
    try {
      const code = await getTeamInviteCode(teamId);
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        setCopyStatus({ type: 'success', message: '邀请码已复制到剪贴板' });
      } else {
        // 降级：使用 prompt 让用户手动复制
        window.prompt('复制以下邀请码：', code);
        setCopyStatus({ type: 'success', message: '已显示邀请码，请手动复制' });
      }
    } catch (error) {
      setCopyStatus({ type: 'error', message: error instanceof Error ? error.message : '复制失败' });
    } finally {
      setCopyingId(null);
    }
  };

  useEffect(() => {
    if (!copyStatus) return;
    const t = setTimeout(() => setCopyStatus(null), 2000);
    return () => clearTimeout(t);
  }, [copyStatus]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          {language === 'zh' ? '返回' : 'Back'}
        </button>

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">
                  {language === 'zh' ? '队伍管理' : 'Team Management'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {language === 'zh' ? '添加、编辑或删除队伍' : 'Add, edit or delete teams'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            {copyStatus && (
              <div className={clsx(
                "mb-6 p-4 border rounded-xl",
                copyStatus.type === 'success' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-3">
                  {copyStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={clsx(
                    "font-medium",
                    copyStatus.type === 'success' ? "text-green-800" : "text-red-800"
                  )}>
                    {copyStatus.message}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              {showAddForm ? (
                <div className="col-span-2 p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '新队伍名称' : 'New Team Name'}
                  </label>
                  {errors.newTeam && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">{errors.newTeam}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => {
                        setNewTeamName(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
                      placeholder={language === 'zh' ? '例如：8009A' : 'e.g. 8009A'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTeam}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4 inline-block" />
                      </button>
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setNewTeamName('');
                          setErrors({});
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4 inline-block" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm">{language === 'zh' ? '添加新队伍' : 'Add New Team'}</div>
                    <div className="text-[10px] opacity-70 hidden sm:block">
                      {language === 'zh' ? '你是队长？创建并邀请成员' : "Captain? Create & invite"}
                    </div>
                  </div>
                </button>
              )}

              {showJoinForm ? (
                <div className="col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '输入邀请码' : 'Enter Invite Code'}
                  </label>
                  {errors.join && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">{errors.join}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinTeam()}
                      placeholder={language === 'zh' ? '8 位邀请码' : '8-char invite code'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleJoinTeam}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4 inline-block" />
                      </button>
                      <button
                        onClick={() => {
                          setShowJoinForm(false);
                          setInviteCode('');
                          setErrors({});
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
                      >
                        <X className="w-4 h-4 inline-block" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {language === 'zh' ? '不知道邀请码？向你的队长索取 8 位邀请码' : "Don't have one? Ask your team captain for the 8-char code"}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm">{language === 'zh' ? '加入现有队伍' : 'Join Existing Team'}</div>
                    <div className="text-[10px] opacity-70 hidden sm:block">
                      {language === 'zh' ? '已有邀请码？输入 8 位码加入' : "Have an invite code? Enter it"}
                    </div>
                  </div>
                </button>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">
                  {language === 'zh' ? '暂无队伍，请添加' : 'No teams yet, please add'}
                </p>
                <p className="text-sm text-gray-400">
                  {language === 'zh' ? '点击上方按钮添加第一个队伍' : 'Click the button above to add your first team'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team, index) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {editingId === team.id ? (
                      <div className="flex-1 flex gap-2">
                        {errors.edit && (
                          <div className="w-full mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-700">{errors.edit}</span>
                          </div>
                        )}
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => {
                            setEditingName(e.target.value);
                            setErrors({});
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 active:scale-95 transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-200 active:scale-95 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : showDeleteConfirm === team.id ? (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {language === 'zh' ? '确认删除该队伍？' : 'Confirm delete this team?'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 active:scale-95 transition-all"
                          >
                            {language === 'zh' ? '确认' : 'Confirm'}
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
                          >
                            {language === 'zh' ? '取消' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{team.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyInviteCode(team.id)}
                            disabled={copyingId === team.id}
                            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all disabled:opacity-50"
                            title={language === 'zh' ? '复制邀请码' : 'Copy invite code'}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(team.id, team.name)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all"
                            title={language === 'zh' ? '编辑' : 'Edit'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(team.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                            title={language === 'zh' ? '删除' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {teams.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">{teams.length}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">
                      {language === 'zh' ? '统计信息' : 'Statistics'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {language === 'zh' 
                        ? `当前共有 ${teams.length} 个队伍` 
                        : `Currently ${teams.length} team${teams.length > 1 ? 's' : ''} in total`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
