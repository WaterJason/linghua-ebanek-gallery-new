/**
 * 键盘快捷键管理器
 * 
 * 提供全局键盘快捷键管理功能，包括注册、移除、触发快捷键等。
 * 
 * @module 键盘快捷键
 * @category 工具
 */

// 快捷键处理函数类型
export type ShortcutHandler = (event: KeyboardEvent) => void;

// 快捷键配置类型
export interface ShortcutConfig {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  group: string;
  handler: ShortcutHandler;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

// 快捷键组类型
export interface ShortcutGroup {
  name: string;
  description: string;
  shortcuts: ShortcutConfig[];
}

// 全局快捷键存储
const shortcuts: ShortcutConfig[] = [];

// 是否已初始化
let isInitialized = false;

/**
 * 初始化键盘快捷键管理器
 */
export function initKeyboardShortcuts(): void {
  if (isInitialized || typeof window === 'undefined') return;
  
  // 添加全局键盘事件监听器
  window.addEventListener('keydown', handleKeyDown);
  
  isInitialized = true;
  console.log('Keyboard shortcuts initialized');
}

/**
 * 处理键盘事件
 * @param event 键盘事件
 */
function handleKeyDown(event: KeyboardEvent): void {
  // 如果当前焦点在输入框、文本区域或编辑器中，不触发快捷键
  if (isInputElement(event.target as HTMLElement)) return;
  
  // 查找匹配的快捷键
  const matchedShortcut = findMatchingShortcut(event);
  
  if (matchedShortcut && !matchedShortcut.disabled) {
    // 阻止默认行为和事件传播
    if (matchedShortcut.preventDefault !== false) {
      event.preventDefault();
    }
    
    if (matchedShortcut.stopPropagation !== false) {
      event.stopPropagation();
    }
    
    // 触发快捷键处理函数
    matchedShortcut.handler(event);
  }
}

/**
 * 检查元素是否为输入元素
 * @param element HTML元素
 * @returns 是否为输入元素
 */
function isInputElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const isContentEditable = element.isContentEditable;
  
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * 查找匹配的快捷键
 * @param event 键盘事件
 * @returns 匹配的快捷键配置
 */
function findMatchingShortcut(event: KeyboardEvent): ShortcutConfig | undefined {
  return shortcuts.find(shortcut => {
    const keyMatches = (
      shortcut.key.toLowerCase() === event.key.toLowerCase() ||
      (shortcut.key === 'Escape' && event.key === 'Esc')
    );
    
    const modifiersMatch = (
      (shortcut.alt === undefined || shortcut.alt === event.altKey) &&
      (shortcut.ctrl === undefined || shortcut.ctrl === event.ctrlKey) &&
      (shortcut.shift === undefined || shortcut.shift === event.shiftKey) &&
      (shortcut.meta === undefined || shortcut.meta === event.metaKey)
    );
    
    return keyMatches && modifiersMatch;
  });
}

/**
 * 注册快捷键
 * @param config 快捷键配置
 * @returns 快捷键ID
 */
export function registerShortcut(config: ShortcutConfig): string {
  // 确保已初始化
  if (!isInitialized && typeof window !== 'undefined') {
    initKeyboardShortcuts();
  }
  
  // 生成快捷键ID
  const id = generateShortcutId(config);
  
  // 检查是否已存在相同的快捷键
  const existingIndex = shortcuts.findIndex(s => generateShortcutId(s) === id);
  
  if (existingIndex !== -1) {
    // 替换现有快捷键
    shortcuts[existingIndex] = config;
  } else {
    // 添加新快捷键
    shortcuts.push(config);
  }
  
  return id;
}

/**
 * 移除快捷键
 * @param id 快捷键ID
 * @returns 是否成功移除
 */
export function unregisterShortcut(id: string): boolean {
  const index = shortcuts.findIndex(s => generateShortcutId(s) === id);
  
  if (index !== -1) {
    shortcuts.splice(index, 1);
    return true;
  }
  
  return false;
}

/**
 * 禁用快捷键
 * @param id 快捷键ID
 * @returns 是否成功禁用
 */
export function disableShortcut(id: string): boolean {
  const shortcut = shortcuts.find(s => generateShortcutId(s) === id);
  
  if (shortcut) {
    shortcut.disabled = true;
    return true;
  }
  
  return false;
}

/**
 * 启用快捷键
 * @param id 快捷键ID
 * @returns 是否成功启用
 */
export function enableShortcut(id: string): boolean {
  const shortcut = shortcuts.find(s => generateShortcutId(s) === id);
  
  if (shortcut) {
    shortcut.disabled = false;
    return true;
  }
  
  return false;
}

/**
 * 生成快捷键ID
 * @param config 快捷键配置
 * @returns 快捷键ID
 */
function generateShortcutId(config: ShortcutConfig): string {
  const modifiers = [
    config.alt ? 'alt' : '',
    config.ctrl ? 'ctrl' : '',
    config.shift ? 'shift' : '',
    config.meta ? 'meta' : ''
  ].filter(Boolean).join('+');
  
  return modifiers ? `${modifiers}+${config.key}` : config.key;
}

/**
 * 获取所有快捷键
 * @returns 所有快捷键配置
 */
export function getAllShortcuts(): ShortcutConfig[] {
  return [...shortcuts];
}

/**
 * 获取快捷键组
 * @returns 快捷键组
 */
export function getShortcutGroups(): ShortcutGroup[] {
  const groups: Record<string, ShortcutGroup> = {};
  
  shortcuts.forEach(shortcut => {
    if (!groups[shortcut.group]) {
      groups[shortcut.group] = {
        name: shortcut.group,
        description: '',
        shortcuts: []
      };
    }
    
    groups[shortcut.group].shortcuts.push(shortcut);
  });
  
  return Object.values(groups);
}

/**
 * 格式化快捷键为可读字符串
 * @param config 快捷键配置
 * @returns 格式化后的快捷键字符串
 */
export function formatShortcut(config: ShortcutConfig): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const modifiers = [
    config.ctrl ? (isMac ? '⌃' : 'Ctrl') : '',
    config.alt ? (isMac ? '⌥' : 'Alt') : '',
    config.shift ? (isMac ? '⇧' : 'Shift') : '',
    config.meta ? (isMac ? '⌘' : 'Win') : ''
  ].filter(Boolean);
  
  // 格式化特殊键
  let key = config.key;
  switch (key) {
    case 'ArrowUp': key = '↑'; break;
    case 'ArrowDown': key = '↓'; break;
    case 'ArrowLeft': key = '←'; break;
    case 'ArrowRight': key = '→'; break;
    case 'Escape': key = 'Esc'; break;
    case ' ': key = 'Space'; break;
    default:
      // 如果是单个字符，转为大写
      if (key.length === 1) {
        key = key.toUpperCase();
      }
  }
  
  return [...modifiers, key].join(isMac ? '' : '+');
}

/**
 * 注册常用快捷键
 */
export function registerCommonShortcuts(): void {
  // 导航快捷键
  registerShortcut({
    key: 'g',
    alt: true,
    description: '返回首页',
    group: '导航',
    handler: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  });
  
  registerShortcut({
    key: 'p',
    alt: true,
    description: '产品管理',
    group: '导航',
    handler: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/products';
      }
    }
  });
  
  registerShortcut({
    key: 'i',
    alt: true,
    description: '库存管理',
    group: '导航',
    handler: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/inventory';
      }
    }
  });
  
  registerShortcut({
    key: 'o',
    alt: true,
    description: '订单管理',
    group: '导航',
    handler: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/orders';
      }
    }
  });
  
  // 通用操作快捷键
  registerShortcut({
    key: 'n',
    alt: true,
    description: '新建',
    group: '通用操作',
    handler: () => {
      const newButton = document.querySelector('button[data-shortcut="new"]') as HTMLButtonElement;
      if (newButton) {
        newButton.click();
      }
    }
  });
  
  registerShortcut({
    key: 's',
    alt: true,
    description: '保存',
    group: '通用操作',
    handler: () => {
      const saveButton = document.querySelector('button[data-shortcut="save"]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.click();
      }
    }
  });
  
  registerShortcut({
    key: 'Escape',
    description: '关闭/取消',
    group: '通用操作',
    handler: () => {
      const cancelButton = document.querySelector('button[data-shortcut="cancel"]') as HTMLButtonElement;
      if (cancelButton) {
        cancelButton.click();
      }
    }
  });
  
  registerShortcut({
    key: '/',
    description: '搜索',
    group: '通用操作',
    handler: () => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  });
  
  // 初始化键盘快捷键管理器
  initKeyboardShortcuts();
}

// 在浏览器环境中自动初始化
if (typeof window !== 'undefined') {
  initKeyboardShortcuts();
}
