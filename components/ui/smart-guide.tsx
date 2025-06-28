"use client"

import * as React from "react"
import { X, ChevronLeft, ChevronRight, Lightbulb, Target, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface GuideStep {
  id: string
  title: string
  content: string
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    text: string
    onClick: () => void
  }
}

interface SmartGuideProps {
  steps: GuideStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  title?: string
  className?: string
}

export const SmartGuide: React.FC<SmartGuideProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  title = "操作指南",
  className
}) => {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete?.()
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    handleNext()
  }

  const handleSkip = () => {
    onClose()
  }

  React.useEffect(() => {
    if (isOpen && steps[currentStep]?.target) {
      const element = document.querySelector(steps[currentStep].target!)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('guide-highlight')
      }
    }

    return () => {
      // 清理高亮
      document.querySelectorAll('.guide-highlight').forEach(el => {
        el.classList.remove('guide-highlight')
      })
    }
  }, [currentStep, isOpen, steps])

  if (!isOpen || steps.length === 0) return null

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* 引导卡片 */}
      <Card className={cn(
        "fixed z-50 w-96 max-w-[90vw] shadow-2xl",
        "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>步骤 {currentStep + 1} / {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 当前步骤内容 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium">{currentStepData.title}</h3>
              {completedSteps.has(currentStep) && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* 操作按钮 */}
          {currentStepData.action && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Button
                onClick={currentStepData.action.onClick}
                className="w-full"
                size="sm"
              >
                {currentStepData.action.text}
              </Button>
            </div>
          )}

          {/* 导航按钮 */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                上一步
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
              >
                跳过引导
              </Button>
            </div>
            
            <Button
              onClick={currentStepData.action ? handleStepComplete : handleNext}
              size="sm"
            >
              {currentStep === steps.length - 1 ? '完成' : '下一步'}
              {currentStep !== steps.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>

          {/* 步骤指示器 */}
          <div className="flex justify-center gap-2 pt-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentStep 
                    ? "bg-blue-500" 
                    : completedSteps.has(index)
                    ? "bg-green-500"
                    : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 高亮样式 */}
      <style jsx global>{`
        .guide-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 4px;
          animation: guide-pulse 2s infinite;
        }
        
        @keyframes guide-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  )
}

// Hook for managing guide state
export const useSmartGuide = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentGuide, setCurrentGuide] = React.useState<GuideStep[]>([])

  const startGuide = (steps: GuideStep[]) => {
    setCurrentGuide(steps)
    setIsOpen(true)
  }

  const closeGuide = () => {
    setIsOpen(false)
    setCurrentGuide([])
  }

  return {
    isOpen,
    currentGuide,
    startGuide,
    closeGuide
  }
}
