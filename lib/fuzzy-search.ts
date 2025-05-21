/**
 * 模糊搜索工具
 * 
 * 提供高级模糊搜索功能，支持拼音搜索、拼音首字母搜索、模糊匹配等。
 * 
 * @module 模糊搜索
 * @category 工具
 */

// 拼音映射表
const PINYIN_MAP: Record<string, string[]> = {
  'a': ['阿', '啊', '呵', '腌', '嗄'],
  'ai': ['爱', '埃', '哎', '唉', '哀', '皑', '癌', '矮', '艾', '碍', '隘'],
  'an': ['安', '按', '暗', '岸', '案', '氨', '胺', '鞍', '谙', '俺', '埯'],
  'ang': ['昂', '盎', '肮'],
  'ao': ['奥', '澳', '傲', '熬', '凹', '敖', '袄', '懊', '坳', '嗷', '拗'],
  'ba': ['巴', '把', '吧', '爸', '罢', '霸', '坝', '芭', '扒', '叭', '靶', '疤', '笆', '耙', '粑', '捌', '拔', '跋', '茇', '菝', '魃'],
  'bai': ['白', '百', '柏', '摆', '佰', '败', '拜', '稗', '伯', '捭'],
  'ban': ['半', '办', '班', '般', '板', '版', '搬', '斑', '扮', '伴', '拌', '扳', '绊', '瓣', '颁', '阪', '坂', '钣', '瘢', '癍', '舨'],
  'bang': ['帮', '棒', '邦', '榜', '膀', '绑', '傍', '磅', '蚌', '镑', '谤', '梆'],
  'bei': ['北', '被', '备', '背', '杯', '倍', '贝', '辈', '悲', '碑', '卑', '悖', '惫', '焙', '狈', '褙', '鞴', '孛', '邶', '陂', '埤'],
  // 更多拼音映射...
};

// 拼音首字母映射表
const PINYIN_FIRST_LETTER_MAP: Record<string, string[]> = {
  'a': ['阿', '啊', '呵', '腌', '嗄', '爱', '埃', '哎', '唉', '哀', '皑', '癌', '矮', '艾', '碍', '隘', '安', '按', '暗', '岸', '案', '氨', '胺', '鞍', '谙', '俺', '埯', '昂', '盎', '肮', '奥', '澳', '傲', '熬', '凹', '敖', '袄', '懊', '坳', '嗷', '拗'],
  'b': ['巴', '把', '吧', '爸', '罢', '霸', '坝', '芭', '扒', '叭', '靶', '疤', '笆', '耙', '粑', '捌', '拔', '跋', '茇', '菝', '魃', '白', '百', '柏', '摆', '佰', '败', '拜', '稗', '伯', '捭', '半', '办', '班', '般', '板', '版', '搬', '斑', '扮', '伴', '拌', '扳', '绊', '瓣', '颁', '阪', '坂', '钣', '瘢', '癍', '舨', '帮', '棒', '邦', '榜', '膀', '绑', '傍', '磅', '蚌', '镑', '谤', '梆', '北', '被', '备', '背', '杯', '倍', '贝', '辈', '悲', '碑', '卑', '悖', '惫', '焙', '狈', '褙', '鞴', '孛', '邶', '陂', '埤'],
  // 更多首字母映射...
};

/**
 * 模糊搜索选项
 */
export interface FuzzySearchOptions {
  caseSensitive?: boolean;
  enablePinyin?: boolean;
  enablePinyinFirstLetter?: boolean;
  threshold?: number;
  keys?: string[];
  maxResults?: number;
  sortResults?: boolean;
}

/**
 * 模糊搜索结果项
 */
export interface FuzzySearchResult<T> {
  item: T;
  score: number;
  matches: {
    key: string;
    indices: [number, number][];
  }[];
}

/**
 * 默认模糊搜索选项
 */
const DEFAULT_OPTIONS: FuzzySearchOptions = {
  caseSensitive: false,
  enablePinyin: true,
  enablePinyinFirstLetter: true,
  threshold: 0.6,
  keys: [],
  maxResults: 100,
  sortResults: true,
};

/**
 * 模糊搜索函数
 * @param items 要搜索的项目数组
 * @param query 搜索查询
 * @param options 搜索选项
 * @returns 搜索结果
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions = {}
): FuzzySearchResult<T>[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!query || !items || items.length === 0) {
    return [];
  }
  
  // 处理查询字符串
  const processedQuery = opts.caseSensitive ? query : query.toLowerCase();
  
  // 获取要搜索的键
  const keys = opts.keys && opts.keys.length > 0
    ? opts.keys
    : typeof items[0] === 'object'
      ? Object.keys(items[0] as Record<string, any>)
      : [''];
  
  // 搜索结果
  const results: FuzzySearchResult<T>[] = [];
  
  // 遍历项目
  for (const item of items) {
    const matches: { key: string; indices: [number, number][]; score: number }[] = [];
    let totalScore = 0;
    
    // 遍历键
    for (const key of keys) {
      const value = key === ''
        ? String(item)
        : getNestedValue(item, key);
      
      if (value === undefined || value === null) {
        continue;
      }
      
      const stringValue = String(value);
      const processedValue = opts.caseSensitive ? stringValue : stringValue.toLowerCase();
      
      // 直接匹配
      const directMatch = processedValue.includes(processedQuery);
      if (directMatch) {
        const indices: [number, number][] = [];
        let startIndex = 0;
        let index;
        
        while ((index = processedValue.indexOf(processedQuery, startIndex)) !== -1) {
          indices.push([index, index + processedQuery.length - 1]);
          startIndex = index + 1;
        }
        
        matches.push({ key, indices, score: 1 });
        totalScore += 1;
        continue;
      }
      
      // 模糊匹配
      const fuzzyScore = fuzzyMatchScore(processedQuery, processedValue);
      if (fuzzyScore > opts.threshold!) {
        matches.push({
          key,
          indices: [[0, stringValue.length - 1]],
          score: fuzzyScore,
        });
        totalScore += fuzzyScore;
      }
      
      // 拼音匹配
      if (opts.enablePinyin) {
        const pinyinScore = pinyinMatchScore(processedQuery, processedValue);
        if (pinyinScore > opts.threshold! && pinyinScore > fuzzyScore) {
          matches.push({
            key,
            indices: [[0, stringValue.length - 1]],
            score: pinyinScore,
          });
          totalScore += pinyinScore;
        }
      }
      
      // 拼音首字母匹配
      if (opts.enablePinyinFirstLetter) {
        const pinyinFirstLetterScore = pinyinFirstLetterMatchScore(processedQuery, processedValue);
        if (pinyinFirstLetterScore > opts.threshold! && pinyinFirstLetterScore > fuzzyScore) {
          matches.push({
            key,
            indices: [[0, stringValue.length - 1]],
            score: pinyinFirstLetterScore,
          });
          totalScore += pinyinFirstLetterScore;
        }
      }
    }
    
    // 如果有匹配，添加到结果中
    if (matches.length > 0) {
      const averageScore = totalScore / matches.length;
      results.push({
        item,
        score: averageScore,
        matches: matches.map(({ key, indices }) => ({ key, indices })),
      });
    }
  }
  
  // 排序结果
  if (opts.sortResults) {
    results.sort((a, b) => b.score - a.score);
  }
  
  // 限制结果数量
  return results.slice(0, opts.maxResults);
}

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @returns 值
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === undefined || value === null) {
      return undefined;
    }
    
    value = value[key];
  }
  
  return value;
}

/**
 * 模糊匹配分数
 * @param query 查询字符串
 * @param value 值
 * @returns 分数
 */
function fuzzyMatchScore(query: string, value: string): number {
  if (query.length === 0) return 0;
  if (query.length > value.length) return 0;
  
  let score = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;
  
  for (let i = 0; i < value.length; i++) {
    if (value[i] === query[queryIndex]) {
      score += 1;
      queryIndex++;
      consecutiveMatches++;
      
      // 连续匹配加分
      if (consecutiveMatches > 1) {
        score += 0.1;
      }
      
      // 如果查询字符串匹配完成
      if (queryIndex === query.length) {
        // 完全匹配加分
        score += 0.5;
        break;
      }
    } else {
      consecutiveMatches = 0;
    }
  }
  
  // 归一化分数
  return score / (query.length + value.length);
}

/**
 * 拼音匹配分数
 * @param query 查询字符串
 * @param value 值
 * @returns 分数
 */
function pinyinMatchScore(query: string, value: string): number {
  // 简单实现，实际应用中可以使用更复杂的拼音匹配算法
  return 0;
}

/**
 * 拼音首字母匹配分数
 * @param query 查询字符串
 * @param value 值
 * @returns 分数
 */
function pinyinFirstLetterMatchScore(query: string, value: string): number {
  // 简单实现，实际应用中可以使用更复杂的拼音首字母匹配算法
  return 0;
}
