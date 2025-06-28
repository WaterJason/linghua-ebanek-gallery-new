"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: "bg-green-500",
    textColor: "text-white",
    borderColor: "border-green-600",
  },
  error: {
    icon: XCircleIcon,
    bgColor: "bg-red-500",
    textColor: "text-white",
    borderColor: "border-red-600",
  },
  warning: {
    icon: AlertTriangleIcon,
    bgColor: "bg-yellow-500",
    textColor: "text-white",
    borderColor: "border-yellow-600",
  },
  info: {
    icon: InfoIcon,
    bgColor: "bg-blue-500",
    textColor: "text-white",
    borderColor: "border-blue-600",
  },
}

function Toast({ message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const config = toastConfig[message.type]
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(message.id), 300) // 等待动画完成
    }, message.duration || 5000)

    return () => clearTimeout(timer)
  }, [message.id, message.duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(message.id), 300)
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-start space-x-3 transition-all duration-300 z-50 max-w-md",
        config.bgColor,
        config.textColor,
        config.borderColor,
        "border-l-4",
        isVisible 
          ? "opacity-100 translate-x-0" 
          : "opacity-0 translate-x-full"
      )}
    >
      <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{message.title}</h4>
        {message.description && (
          <p className="text-sm opacity-90 mt-1">{message.description}</p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-6 w-6 text-white opacity-75 hover:opacity-100 hover:bg-white/20 flex-shrink-0"
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-6 space-y-4">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(-${index * 80}px)`,
          }}
        >
          <Toast message={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}

// Toast管理Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (
    type: ToastType,
    title: string,
    description?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      id,
      type,
      title,
      description,
      duration,
    }

    setToasts((prev) => [...prev, newToast])
  }

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (title: string, description?: string, duration?: number) =>
    showToast("success", title, description, duration)

  const error = (title: string, description?: string, duration?: number) =>
    showToast("error", title, description, duration)

  const warning = (title: string, description?: string, duration?: number) =>
    showToast("warning", title, description, duration)

  const info = (title: string, description?: string, duration?: number) =>
    showToast("info", title, description, duration)

  return {
    toasts,
    showToast,
    closeToast,
    success,
    error,
    warning,
    info,
  }
}

// 全局Toast Provider
export function ModernToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, closeToast } = useToast()

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </>
  )
}
