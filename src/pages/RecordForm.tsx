import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Star, Flag, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store-supabase';
import { translations } from '../i18n';
import { Module } from '../types';
import { clsx } from 'clsx';

interface FormErrors {
  date?: string;
  author?: string;
  content?: string;
  reason?: string;
}

export default function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records, teams, addRecord, updateRecord, language } = useStore();
  const t = translations[language];
  
  const isEdit = !!id;
  const existingRecord = id ? records.find((r) => r.id === id) : null;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    author: '',
    module: '底盘' as Module,
    team: '',
    reason: '',
    content: '',
    photos: [] as string[],
    testResult: '',
    problems: '',
    nextSteps: '',
    rating: 0,
    milestone: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [photoSizeWarning, setPhotoSizeWarning] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        ...existingRecord,
        rating: existingRecord.rating || 0,
        milestone: existingRecord.milestone || false,
      });
    }
  }, [existingRecord]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.date) {
      newErrors.date = language === 'zh' ? '请选择日期' : 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date = language === 'zh' ? '日期不能是未来时间' : 'Date cannot be in the future';
      }
    }
    
    if (!formData.author.trim()) {
      newErrors.author = language === 'zh' ? '请输入负责人姓名' : 'Please enter the author name';
    } else if (formData.author.trim().length < 2) {
      newErrors.author = language === 'zh' ? '负责人姓名至少2个字符' : 'Author name must be at least 2 characters';
    } else if (formData.author.trim().length > 50) {
      newErrors.author = language === 'zh' ? '负责人姓名不能超过50个字符' : 'Author name must not exceed 50 characters';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = language === 'zh' ? '请输入今日内容' : 'Please enter today\'s content';
    } else if (formData.reason.trim().length < 5) {
      newErrors.reason = language === 'zh' ? '今日内容至少5个字符' : 'Content must be at least 5 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = language === 'zh' ? '请输入项目具体描述' : 'Please enter project description';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = language === 'zh' ? '项目描述至少10个字符' : 'Description must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const quality = file.size > 2 * 1024 * 1024 ? 0.7 : 0.85;
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    console.log('准备保存的数据:', {
      photosLength: formData.photos.length,
      photosSize: formData.photos.map((p, i) => ({ index: i, length: p.length })),
      hasDate: !!formData.date,
      hasAuthor: !!formData.author,
      hasContent: !!formData.content,
      hasReason: !!formData.reason,
    });
    
    try {
      if (isEdit && id) {
        console.log('执行更新操作');
        await updateRecord(id, formData);
      } else {
        console.log('执行创建操作');
        await addRecord(formData);
      }
      
      console.log('保存成功，跳转到首页');
      navigate('/');
    } catch (error) {
      console.error('提交失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : language === 'zh' ? '保存失败，请重试' : 'Save failed, please try again';
      setSubmitError(errorMessage);
      
      if (errorMessage.includes('size') || errorMessage.includes('请求') || errorMessage.includes('413')) {
        setSubmitError(language === 'zh' ? '文件太大，请减少图片数量或使用更小的图片' : 'File too large, please reduce the number of images or use smaller images');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const warnings: string[] = [];
    setIsCompressing(true);
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          warnings.push(`${file.name}: ${language === 'zh' ? '不是有效的图片文件' : 'Invalid image file'}`);
          continue;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          warnings.push(`${file.name}: ${language === 'zh' ? '文件过大（超过10MB）' : 'File too large (over 10MB)'}`);
          continue;
        }
        
        if (file.size > 2 * 1024 * 1024) {
          warnings.push(`${file.name}: ${language === 'zh' ? '正在压缩...' : 'Compressing...'}`);
        }
        
        try {
          const compressed = await compressImage(file);
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, compressed],
          }));
        } catch (error) {
          warnings.push(`${file.name}: ${language === 'zh' ? '压缩失败，使用原图' : 'Compression failed, using original'}`);
          const reader = new FileReader();
          reader.onload = (event: ProgressEvent<FileReader>) => {
            const result = event.target?.result as string;
            setFormData((prev) => ({
              ...prev,
              photos: [...prev.photos, result],
            }));
          };
          reader.readAsDataURL(file);
        }
      }
      
      if (warnings.length > 0) {
        setPhotoSizeWarning(warnings);
        setTimeout(() => setPhotoSizeWarning([]), 3000);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

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

        <div className="border border-gray-200 rounded-2xl p-8">
          <h1 className="text-xl font-medium text-gray-900 mb-8">
            {isEdit ? (language === 'zh' ? '编辑记录' : 'Edit Record') : (language === 'zh' ? '新建记录' : 'New Record')}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex">
                <div className="w-1/2 flex-none pr-2 min-w-0 overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '日期' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={clsx(
                      "block w-full min-w-0 max-w-full box-border px-4 py-3 border rounded-full text-base focus:outline-none transition-colors",
                      errors.date
                        ? "border-red-500 focus:border-red-600"
                        : "border-gray-300 focus:border-gray-400"
                    )}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.date}
                    </p>
                  )}
                </div>
                <div className="w-1/2 flex-none pl-2 min-w-0 overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '负责人' : 'Author'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder={language === 'zh' ? '输入姓名' : 'Enter name'}
                    className={clsx(
                      "block w-full min-w-0 max-w-full box-border px-4 py-3 border rounded-full text-base focus:outline-none transition-colors",
                      errors.author
                        ? "border-red-500 focus:border-red-600"
                        : "border-gray-300 focus:border-gray-400"
                    )}
                  />
                  {errors.author && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.author}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 flex-none pr-2 min-w-0 overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '模块' : 'Module'}
                  </label>
                  <select
                    required
                    value={formData.module}
                    onChange={(e) => handleInputChange('module', e.target.value)}
                    className="block w-full min-w-0 max-w-full box-border px-4 py-3 border border-gray-300 rounded-full text-base focus:outline-none focus:border-gray-400 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="底盘">{language === 'zh' ? '底盘' : 'Chassis'}</option>
                    <option value="抓手">{language === 'zh' ? '抓手' : 'Gripper'}</option>
                    <option value="弹射">{language === 'zh' ? '弹射' : 'Catapult'}</option>
                    <option value="升降">{language === 'zh' ? '升降' : 'Lift'}</option>
                    <option value="其他">{language === 'zh' ? '其他' : 'Other'}</option>
                  </select>
                </div>
                <div className="w-1/2 flex-none pl-2 min-w-0 overflow-hidden">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '队伍' : 'Team'}
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => handleInputChange('team', e.target.value)}
                    className="block w-full min-w-0 max-w-full box-border px-4 py-3 border border-gray-300 rounded-full text-base focus:outline-none focus:border-gray-400 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">{language === 'zh' ? '请选择队伍' : 'Select team'}</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '今日内容' : 'Today\'s Content'}
              </label>
              <textarea
                required
                rows={3}
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder={language === 'zh' ? '简述今天的主要工作...' : 'Briefly describe today\'s main work...'}
                className={clsx(
                  "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors resize-none",
                  errors.reason
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-gray-400"
                )}
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reason}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '项目具体描述' : 'Project Description'}
              </label>
              <textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder={language === 'zh' ? '详细描述项目内容和实施细节...' : 'Describe project content and implementation details...'}
                className={clsx(
                  "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors resize-none",
                  errors.content
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-gray-400"
                )}
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.content}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'zh' ? '照片' : 'Photos'}
                <span className="text-gray-400 text-xs ml-2">
                  ({language === 'zh' ? '支持多张，自动压缩' : 'Multiple supported, auto-compressed'})
                </span>
              </label>
              
              {photoSizeWarning.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      {photoSizeWarning.map((warning, i) => (
                        <div key={i}>{warning}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt=""
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 text-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 hover:bg-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                        {language === 'zh' ? '封面' : 'Cover'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <label className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                {isCompressing ? (
                  <>
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    <span className="text-gray-600 text-sm">{language === 'zh' ? '压缩中...' : 'Compressing...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 text-sm">{language === 'zh' ? '上传照片' : 'Upload Photos'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isCompressing}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-xs text-gray-500 text-center">
                {language === 'zh' ? '支持 JPG、PNG，最大10MB' : 'Supports JPG, PNG, max 10MB'}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-base font-medium text-gray-900 mb-4">
                {language === 'zh' ? '测试结果' : 'Test Results'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '评分' : 'Rating'} <span className="text-gray-400">({language === 'zh' ? '1-5星' : '1-5 stars'})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-2 hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Star
                          className={clsx(
                            'w-7 h-7 transition-colors',
                            star <= formData.rating
                              ? 'fill-gray-600 text-gray-600'
                              : 'text-gray-300'
                          )}
                        />
                      </button>
                    ))}
                    {formData.rating > 0 && (
                      <span className="ml-4 text-sm text-gray-600">
                        {formData.rating} {language === 'zh' ? '星' : 'stars'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    id="milestone"
                    checked={formData.milestone}
                    onChange={(e) => setFormData({ ...formData, milestone: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                  />
                  <label htmlFor="milestone" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Flag className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {language === 'zh' ? '里程碑' : 'Milestone'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {language === 'zh' ? '标记重要的版本或改进' : 'Mark important versions or improvements'}
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '测试结果' : 'Test Result'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.testResult}
                    onChange={(e) => setFormData({ ...formData, testResult: e.target.value })}
                    placeholder={language === 'zh' ? '记录测试过程中的结果和观察...' : 'Record test results and observations...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '存在问题' : 'Problems'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.problems}
                    onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
                    placeholder={language === 'zh' ? '记录发现的问题和挑战...' : 'Record discovered problems and challenges...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'zh' ? '下一步计划' : 'Next Steps'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.nextSteps}
                    onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                    placeholder={language === 'zh' ? '规划接下来的工作方向...' : 'Plan the next work direction...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{language === 'zh' ? '保存失败' : 'Save Failed'}</p>
                  <p className="text-sm text-red-700 mt-1">{submitError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'zh' ? '保存中...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {language === 'zh' ? '保存' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
