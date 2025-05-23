// 为 Workbox 添加类型声明
interface WorkboxEventMap {
  waiting: Event;
  controlling: Event;
  activated: Event;
}

interface Workbox extends EventTarget {
  addEventListener<K extends keyof WorkboxEventMap>(
    type: K,
    listener: (this: Workbox, ev: WorkboxEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof WorkboxEventMap>(
    type: K,
    listener: (this: Workbox, ev: WorkboxEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  register(): Promise<void>;
  messageSkipWaiting(): void;
}

// 扩展 Window 接口以包含 Workbox
declare global {
  interface Window {
    workbox: Workbox;
  }
}

// 为 BeforeInstallPromptEvent 添加类型声明
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
