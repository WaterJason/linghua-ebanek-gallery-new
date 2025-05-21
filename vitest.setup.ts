import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

// 扩展Vitest的expect方法
expect.extend(matchers)

// 在每个测试后运行清理
afterEach(() => {
  cleanup()
})

// 模拟window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  
  callback: IntersectionObserverCallback
  elements = new Set()
  
  observe(element: Element) {
    this.elements.add(element)
  }
  
  unobserve(element: Element) {
    this.elements.delete(element)
  }
  
  disconnect() {
    this.elements.clear()
  }
  
  trigger(isIntersecting: boolean) {
    const entries: IntersectionObserverEntry[] = []
    
    this.elements.forEach(element => {
      entries.push({
        isIntersecting,
        target: element,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRatio: isIntersecting ? 1 : 0,
        intersectionRect: isIntersecting ? element.getBoundingClientRect() : new DOMRectReadOnly(),
        rootBounds: null,
        time: Date.now(),
      } as IntersectionObserverEntry)
    })
    
    this.callback(entries, this)
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// 模拟ResizeObserver
class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  
  callback: ResizeObserverCallback
  elements = new Set<Element>()
  
  observe(element: Element) {
    this.elements.add(element)
  }
  
  unobserve(element: Element) {
    this.elements.delete(element)
  }
  
  disconnect() {
    this.elements.clear()
  }
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
})
