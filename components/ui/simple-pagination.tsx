"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface SimplePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  maxPageButtons?: number
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  maxPageButtons = 5,
}: SimplePaginationProps) {
  // 如果只有一页，不显示分页
  if (totalPages <= 1) {
    return null
  }

  // 计算要显示的页码按钮
  const getPageNumbers = () => {
    // 如果总页数小于等于最大按钮数，显示所有页码
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // 计算显示的页码范围
    const halfMaxButtons = Math.floor(maxPageButtons / 2)
    let startPage = Math.max(1, currentPage - halfMaxButtons)
    let endPage = Math.min(totalPages, currentPage + halfMaxButtons)

    // 调整范围，确保显示的按钮数量正确
    if (endPage - startPage + 1 < maxPageButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPageButtons - 1)
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPageButtons + 1)
      }
    }

    return {
      pageNumbers: Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i),
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages,
    }
  }

  const { pageNumbers, showStartEllipsis, showEndEllipsis } = getPageNumbers()

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* 上一页按钮 */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) {
                onPageChange(currentPage - 1)
              }
            }}
            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>

        {/* 首页按钮 */}
        {showStartEllipsis && (
          <>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(1)
                }}
                isActive={currentPage === 1}
              >
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}

        {/* 页码按钮 */}
        {pageNumbers.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onPageChange(page)
              }}
              isActive={currentPage === page}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* 末页按钮 */}
        {showEndEllipsis && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(totalPages)
                }}
                isActive={currentPage === totalPages}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        {/* 下一页按钮 */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) {
                onPageChange(currentPage + 1)
              }
            }}
            className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
