"use client"

import { useSync } from "@/hooks/use-sync"
import { useOffline } from "@/hooks/use-offline"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function SyncStatus() {
  const { isOnline } = useOffline()
  const { isSyncing, syncError, performSync, getLastSyncTimeDisplay, needsSync } = useSync()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => performSync()}
            disabled={isSyncing || !isOnline}
          >
            {isSyncing ? (
              <Icons.loader className="h-5 w-5 animate-spin" />
            ) : syncError ? (
              <Icons.alertCircle className="h-5 w-5 text-red-500" />
            ) : !isOnline ? (
              <Icons.wifiOff className="h-5 w-5 text-gray-400" />
            ) : needsSync() ? (
              <div className="relative">
                <Icons.refresh className="h-5 w-5 text-yellow-500" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-500"></span>
              </div>
            ) : (
              <Icons.check className="h-5 w-5 text-green-500" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSyncing ? (
            <p>正在同步数据...</p>
          ) : syncError ? (
            <p>同步失败: {syncError}</p>
          ) : !isOnline ? (
            <p>离线模式</p>
          ) : needsSync() ? (
            <p>点击同步数据</p>
          ) : (
            <p>{getLastSyncTimeDisplay()}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
