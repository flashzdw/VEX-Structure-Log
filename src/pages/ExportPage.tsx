import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle2, FileText } from 'lucide-react';
import { useStore } from '../store-pocketbase';
import { Module } from '../types';
import { clsx } from 'clsx';

const moduleColors: Record<Module, string> = {
  '底盘': 'border border-gray-300 text-gray-700',
  '抓手': 'border border-gray-300 text-gray-700',
  '弹射': 'border border-gray-300 text-gray-700',
  '升降': 'border border-gray-300 text-gray-700',
  '其他': 'border border-gray-300 text-gray-700',
};

export default function ExportPage() {
  const navigate = useNavigate();
  const { records } = useStore();
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

  const toggleRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const toggleAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((r) => r.id)));
    }
  };

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

  const exportToHTML = () => {
    if (records.length === 0) {
      alert('没有记录可以导出');
      return;
    }

    const recordsToExport = selectedRecords.size > 0
      ? records.filter((r) => selectedRecords.has(r.id))
      : records;

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>VIQRC 工程进度管理</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
    padding: 20px;
    color: #1f2937;
  }
  .header {
    text-align: right;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 20px;
    margin-bottom: 40px;
  }
  .slogan {
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 4px;
  }
  .team {
    font-size: 12px;
    color: #6b7280;
  }
  .title-section {
    text-align: center;
    margin-bottom: 40px;
  }
  .title-section h1 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  .title-section .subtitle {
    font-size: 14px;
    color: #6b7280;
  }
  .record { 
    margin-bottom: 40px; 
    padding-bottom: 30px; 
    border-bottom: 1px solid #e5e7eb; 
    page-break-inside: avoid; 
  }
  .record:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .record-header { 
    font-size: 18px; 
    font-weight: 600; 
    margin-bottom: 8px;
    color: #111827;
  }
  .record-author { 
    font-size: 14px; 
    color: #6b7280; 
    margin-bottom: 20px; 
  }
  .section { 
    margin-bottom: 16px; 
  }
  .section-title { 
    font-weight: 600; 
    margin-bottom: 6px;
    color: #374151;
    font-size: 15px;
  }
  .section-content { 
    margin-left: 10px;
    line-height: 1.6;
    font-size: 14px;
    color: #4b5563;
  }
  .milestone { 
    display: inline-block; 
    background-color: #fef3c7; 
    color: #92400e; 
    padding: 4px 12px; 
    border-radius: 20px; 
    font-size: 13px;
    font-weight: 500;
  }
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: 15px 20px;
    font-size: 12px;
    color: #9ca3af;
    border-top: 1px solid #e5e7eb;
  }
  @media print {
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
    }
    body {
      padding-bottom: 60px;
    }
  }
</style>
</head>
<body>
<div class="header">
  <div class="slogan">让每一次的发生都有迹可循。</div>
  <div class="team">—— TEAM 8009.</div>
</div>

<div class="title-section">
  <h1>VIQRC 工程进度管理</h1>
  <div class="subtitle">结构改动记录 - ${new Date().toLocaleDateString()}</div>
</div>
`;

    recordsToExport.forEach((record, index) => {
      htmlContent += `
<div class="record">
  <div class="record-header">${index + 1}. ${record.date} - ${getModuleTranslation(record.module)}</div>
  <div class="record-author">负责人: ${record.author}</div>
`;
      if (record.reason) {
        htmlContent += `
  <div class="section">
    <div class="section-title">今日内容</div>
    <div class="section-content">${record.reason.replace(/\n/g, '<br>')}</div>
  </div>
`;
      }
      if (record.content) {
        htmlContent += `
  <div class="section">
    <div class="section-title">项目具体描述</div>
    <div class="section-content">${record.content.replace(/\n/g, '<br>')}</div>
  </div>
`;
      }
      if (record.testResult) {
        htmlContent += `
  <div class="section">
    <div class="section-title">测试结果</div>
    <div class="section-content">${record.testResult.replace(/\n/g, '<br>')}</div>
  </div>
`;
      }
      if (record.problems) {
        htmlContent += `
  <div class="section">
    <div class="section-title">存在问题</div>
    <div class="section-content">${record.problems.replace(/\n/g, '<br>')}</div>
  </div>
`;
      }
      if (record.nextSteps) {
        htmlContent += `
  <div class="section">
    <div class="section-title">下一步计划</div>
    <div class="section-content">${record.nextSteps.replace(/\n/g, '<br>')}</div>
  </div>
`;
      }
      if (record.milestone) {
        htmlContent += `
  <div class="section">
    <span class="milestone">里程碑</span>
  </div>
`;
      }
      htmlContent += `</div>`;
    });

    htmlContent += `
<div class="footer">
  TEAM 8009 · VIQRC 工程进度管理
</div>
</body>
</html>
`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VIQRC工程记录_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('HTML文件已下载！请打开文件后，在浏览器中按 Cmd+P 打印，然后选择"保存为PDF"。');
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
          
          <button
            onClick={exportToHTML}
            disabled={records.length === 0}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Download className="w-4 h-4" />
            导出HTML文件
          </button>
        </div>

        <div className="border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 border border-gray-300 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                导出为PDF
              </h1>
              <p className="text-sm text-gray-500">
                {selectedRecords.size > 0
                  ? `已选择 ${selectedRecords.size} 条记录`
                  : `导出全部记录 (${records.length})`}
              </p>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">暂无记录</p>
            </div>
          ) : (
            <>
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <CheckCircle2 className={clsx(
                  'w-4 h-4',
                  selectedRecords.size === records.length ? 'text-gray-900' : 'text-gray-400'
                )} />
                {selectedRecords.size === records.length ? '取消全选' : '全选'}
              </button>

              <div className="space-y-3">
                {records.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => toggleRecord(record.id)}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all active:scale-[0.99]',
                      selectedRecords.has(record.id)
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      selectedRecords.has(record.id)
                        ? 'border-gray-900 bg-gray-900'
                        : 'border-gray-300'
                    )}>
                      {selectedRecords.has(record.id) && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          moduleColors[record.module]
                        )}>
                          {getModuleTranslation(record.module)}
                        </span>
                        <span className="text-xs text-gray-500">{record.date}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {record.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-medium text-gray-900 mb-2">使用说明：</h3>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. 点击"导出HTML文件"按钮</li>
                  <li>2. 打开下载的HTML文件</li>
                  <li>3. 在浏览器中按 Cmd+P 打印</li>
                  <li>4. 选择"另存为PDF"保存文件</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
