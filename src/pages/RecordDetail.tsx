import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, User, CheckCircle, AlertCircle, ChevronRight, Users } from 'lucide-react';
import { useStore } from '../store-pocketbase';
import { Module } from '../types';

const moduleColors: Record< Module, string> = {
  '底盘': 'border border-gray-300 text-gray-700',
  '抓手': 'border border-gray-300 text-gray-700',
  '弹射': 'border border-gray-300 text-gray-700',
  '升降': 'border border-gray-300 text-gray-700',
  '其他': 'border border-gray-300 text-gray-700',
};

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records, teams, deleteRecord } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const record = records.find((r) => r.id === id);
  const teamName = record?.team ? teams.find(t => t.id === record.team)?.name : null;

  if (!record) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">记录不存在</h2>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
        </div>
      </div>
    );
  }

  const getModuleTranslation = (module: Module) => {
    const map: Record<Module, string> = {
      '底盘': '底盘',
      '抓手': '抓手',
      '弹射': '弹射',
      '升降': '升降',
      '其他': '其他',
    };
    return map[module];
  };

  const handleDelete = async () => {
    if (id) {
      await deleteRecord(id);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <div className="flex gap-2">
            <Link
              to={`/edit/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Edit className="w-4 h-4" />
              编辑
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${moduleColors[record.module]}`}>
                {getModuleTranslation(record.module)}
              </span>
            </div>
            
            <div className="flex items-center gap-5 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{record.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{record.author}</span>
              </div>
              {teamName && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{teamName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                今日内容
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record.reason}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                项目具体描述
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record.content}
              </p>
            </section>

            {record.photos.length > 0 && (
              <section>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  照片
                </h3>
                <div className="space-y-4">
                  {record.photos.map((photo, index) => (
                    <div key={index} className="rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                测试结果
              </h3>
              
              <div className="space-y-4">
                {record.testResult && (
                  <div className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">测试结果</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {record.testResult}
                      </p>
                    </div>
                  </div>
                )}

                {record.problems && (
                  <div className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">存在问题</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {record.problems}
                      </p>
                    </div>
                  </div>
                )}

                {record.nextSteps && (
                  <div className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">下一步计划</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                        {record.nextSteps}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              确认删除
            </h3>
            <p className="text-gray-600 mb-6">
              确定要删除这条记录吗？此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-3 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-5 py-3 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 active:scale-95 transition-all"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
