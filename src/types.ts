
export type Module = '底盘' | '抓手' | '弹射' | '升降' | '其他';
export type Language = 'zh' | 'en';

export interface Team {
  id: string;
  name: string;
  createdAt: number;
}

export interface Record {
  id: string;
  date: string;
  author: string;
  module: Module;
  team: string; // 队伍ID
  reason: string;
  content: string;
  photos: string[];
  testResult: string;
  problems: string;
  nextSteps: string;
  rating: number; // 测试评分 1-5星
  milestone: boolean; // 是否为里程碑版本
  createdAt: number;
  updatedAt: number;
}

export interface Translations {
  [key: string]: {
    appName: string;
    home: string;
    newRecord: string;
    editRecord: string;
    export: string;
    language: string;
    english: string;
    chinese: string;
    noRecords: string;
    startAdding: string;
    date: string;
    author: string;
    module: string;
    reason: string;
    content: string;
    photos: string;
    testResult: string;
    problems: string;
    nextSteps: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    back: string;
    search: string;
    filterByModule: string;
    filterByAuthor: string;
    all: string;
    chassis: string;
    gripper: string;
    catapult: string;
    lift: string;
    other: string;
    exportPDF: string;
    selectRecords: string;
    exportAll: string;
    exportSelected: string;
    download: string;
    preview: string;
    engineeringNotebook: string;
    structureModificationRecord: string;
    team: string;
    deleteConfirm: string;
    deleteMessage: string;
    yes: string;
    no: string;
    uploadPhotos: string;
    addPhoto: string;
    rating: string;
    milestone: string;
    milestoneLabel: string;
    statistics: string;
    totalRecords: string;
    moduleDistribution: string;
    authorDistribution: string;
    averageRating: string;
    searchPlaceholder: string;
  };
}
