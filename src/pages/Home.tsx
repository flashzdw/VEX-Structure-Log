import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, User, ChevronRight, Star, Layers, Target, Clock, Users, X, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store-supabase';
import { translations } from '../i18n';
import { Module } from '../types';
import { clsx } from 'clsx';

const moduleColors: Record<Module, string> = {
  '底盘': 'border border-gray-300 text-gray-700',
  '抓手': 'border border-gray-300 text-gray-700',
  '弹射': 'border border-gray-300 text-gray-700',
  '升降': 'border border-gray-300 text-gray-700',
  '其他': 'border border-gray-300 text-gray-700',
};

export default function Home() {
  const { records, teams, language } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<Module | 'all'>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredRecords = records.filter((record) => {
    const matchesSearch = 
      record.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || record.module === moduleFilter;
    const matchesAuthor = authorFilter === 'all' || record.author === authorFilter;
    const matchesTeam = teamFilter === 'all' || record.team === teamFilter;
    return matchesSearch && matchesModule && matchesAuthor && matchesTeam;
  });

  const allAuthors = Array.from(new Set(records.map(r => r.author)));
  const activeFiltersCount = [
    moduleFilter !== 'all',
    authorFilter !== 'all',
    teamFilter !== 'all',
    searchQuery.length > 0,
  ].filter(Boolean).length;
  
  const hasActiveFilters = activeFiltersCount > 0;

  const clearAllFilters = () => {
    setSearchQuery('');
    setModuleFilter('all');
    setAuthorFilter('all');
    setTeamFilter('all');
  };

  const clearFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'module':
        setModuleFilter('all');
        break;
      case 'author':
        setAuthorFilter('all');
        break;
      case 'team':
        setTeamFilter('all');
        break;
    }
  };

  const totalRecords = records.length;
  const milestoneCount = records.filter(r => r.milestone).length;
  const todayRecords = records.filter(r => r.date === new Date().toISOString().split('T')[0]).length;
  const totalTeams = teams.length;

  const getModuleTranslation = (module: Module) => {
    const map: Record<Module, string> = {
      '底盘': t.chassis,
      '抓手': t.gripper,
      '弹射': t.catapult,
      '升降': t.lift,
      '其他': t.other,
    };
    return map[module];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Module */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 mb-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {language === 'zh' ? 'LEVEL UP🏆' : 'LEVEL UP🏆'}
            </h1>
            <p className="text-lg text-gray-700 mb-3">2026-2027 VIQRC</p>
            <p className="text-base text-gray-500">
              {language === 'zh' ? '让每一次的发生都有迹可循。' : 'Make every "happening" traceable.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">—— TEAM 8009.</p>
          </div>
        </div>

        {/* Quick Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{language === 'zh' ? '赛季目标' : 'Season Goals'}</h3>
                <p className="text-sm text-gray-500">{language === 'zh' ? '记录每一次进步，迈向冠军之路' : 'Record every progress, march towards the championship'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{language === 'zh' ? '团队协作' : 'Team Collaboration'}</h3>
                <p className="text-sm text-gray-500">{language === 'zh' ? '共享工程笔记，提升团队效率' : 'Share engineering notes, improve team efficiency'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '总记录数 📝' : 'Total Records 📝'}</p>
                <p className="text-2xl font-semibold text-gray-900">{totalRecords}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '队伍数量 🤖' : 'Teams 🤖'}</p>
                <p className="text-2xl font-semibold text-gray-900">{totalTeams}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '里程碑 🏷️' : 'Milestones 🏷️'}</p>
                <p className="text-2xl font-semibold text-gray-900">{milestoneCount}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{language === 'zh' ? '今日更新 🆕' : 'Today Update 🆕'}</p>
                <p className="text-2xl font-semibold text-gray-900">{todayRecords}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{language === 'zh' ? '工程记录' : 'Engineering Records'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {hasActiveFilters
                ? `${language === 'zh' ? '筛选结果：' : 'Filtered: '}${filteredRecords.length} / ${totalRecords} ${language === 'zh' ? '条记录' : 'records'}`
                : language === 'zh' ? '查看和管理所有工程进度记录' : 'View and manage all engineering progress records'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                "inline-flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-all",
                showFilters
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'zh' ? '筛选' : 'Filters'}</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white text-gray-900 rounded-full text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <Link
              to="/new"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              {language === 'zh' ? '新建记录' : 'New Record'}
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        {records.length > 0 && (
          <div className="space-y-4 mb-8">
            {/* Search Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'zh' ? '搜索记录...' : 'Search records...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => clearFilter('search')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    {language === 'zh' ? '筛选条件' : 'Filter Conditions'}
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      {language === 'zh' ? '清除所有' : 'Clear all'}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={moduleFilter}
                      onChange={(e) => setModuleFilter(e.target.value as Module | 'all')}
                      className="w-full pl-11 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">{language === 'zh' ? '全部模块' : 'All Modules'}</option>
                      <option value="底盘">{language === 'zh' ? '底盘' : 'Chassis'}</option>
                      <option value="抓手">{language === 'zh' ? '抓手' : 'Gripper'}</option>
                      <option value="弹射">{language === 'zh' ? '弹射' : 'Catapult'}</option>
                      <option value="升降">{language === 'zh' ? '升降' : 'Lift'}</option>
                      <option value="其他">{language === 'zh' ? '其他' : 'Other'}</option>
                    </select>
                  </div>

                  {allAuthors.length > 0 && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value)}
                        className="w-full pl-11 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">{language === 'zh' ? '全部负责人' : 'All Authors'}</option>
                        {allAuthors.map(author => (
                          <option key={author} value={author}>{author}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {teams.length > 0 && (
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                        className="w-full pl-11 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-300 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">{language === 'zh' ? '全部队伍' : 'All Teams'}</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Active Filter Tags */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {language === 'zh' ? '搜索:' : 'Search:'} "{searchQuery}"
                        <button onClick={() => clearFilter('search')} className="ml-1 hover:text-gray-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {moduleFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {language === 'zh' ? '模块:' : 'Module:'} {getModuleTranslation(moduleFilter)}
                        <button onClick={() => clearFilter('module')} className="ml-1 hover:text-gray-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {authorFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {language === 'zh' ? '负责人:' : 'Author:'} {authorFilter}
                        <button onClick={() => clearFilter('author')} className="ml-1 hover:text-gray-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {teamFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {language === 'zh' ? '队伍:' : 'Team:'} {teams.find(t => t.id === teamFilter)?.name}
                        <button onClick={() => clearFilter('team')} className="ml-1 hover:text-gray-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'zh' ? '没有找到匹配的记录' : 'No matching records found'}
                </h3>
                <p className="text-gray-500 mb-8">
                  {language === 'zh' ? '尝试调整筛选条件或清除筛选' : 'Try adjusting your filters or clear all filters'}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                  {language === 'zh' ? '清除所有筛选' : 'Clear All Filters'}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{language === 'zh' ? '暂无记录' : 'No Records'}</h3>
                <p className="text-gray-500 mb-8">{language === 'zh' ? '开始添加您的第一条工程进度记录' : 'Start by adding your first engineering progress record'}</p>
                <Link
                  to="/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'zh' ? '新建记录' : 'New Record'}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRecords.map((record) => (
              <Link
                key={record.id}
                to={`/record/${record.id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 hover:border-gray-300 hover:shadow-sm active:scale-[0.995] transition-all duration-200"
              >
                <div className="flex items-start gap-3 sm:gap-6">
                  {record.photos.length > 0 ? (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={record.photos[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Layers className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <span className={clsx("px-3 py-1 rounded-full text-xs font-medium", moduleColors[record.module])}>
                        {getModuleTranslation(record.module)}
                      </span>
                      {record.milestone && (
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          {language === 'zh' ? '里程碑' : 'Milestone'}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {record.content || record.reason}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{record.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{record.author}</span>
                      </div>
                      {record.team && teams.find(t => t.id === record.team) && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{teams.find(t => t.id === record.team)?.name}</span>
                        </div>
                      )}
                      {record.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-gray-500 text-gray-500" />
                          <span>{record.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
