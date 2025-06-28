  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">排班管理</h2>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAddSchedule}>
            <PlusIcon className="mr-2 h-4 w-4" />
            新建排班
          </Button>

          <Button variant="outline" onClick={() => setIsBatchScheduleOpen(true)}>
            <CopyIcon className="mr-2 h-4 w-4" />
            批量排班
          </Button>

          <Button
            variant={selectedDates.length > 0 ? "default" : "outline"}
            onClick={handleMultiDateSchedule}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            多选排班 {selectedDates.length > 0 && `(${selectedDates.length})`}
          </Button>

          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            排班模板
          </Button>

          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            导出排班
          </Button>

          <Button
            variant="destructive"
            onClick={handleClearAllSchedules}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            清除所有
          </Button>
        </div>
      </div>

      {selectedDates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span>已选择 <strong>{selectedDates.length}</strong> 个日期，按住Ctrl键点击日期可以多选</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedDates([])}>
                清除选择
              </Button>
              <Button size="sm" onClick={handleMultiDateSchedule}>
                为选中日期排班
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <Select
            value={format(selectedMonth, "yyyy-MM")}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="选择月份" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <Select
            value={selectedEmployee}
            onValueChange={setSelectedEmployee}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="选择员工" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部员工</SelectItem>
              {employees.map(employee => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 排班冲突警告 */}
      {scheduleConflicts.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangleIcon className="h-5 w-5 mr-2 text-amber-500" />
              发现排班冲突
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 mb-2">
              系统检测到 {scheduleConflicts.length} 个排班时间冲突，请检查并修正：
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
              {scheduleConflicts.slice(0, 3).map((conflict, index) => (
                <li key={index}>
                  {conflict.date} - {conflict.employee.name} 有重叠的排班时间
                </li>
              ))}
              {scheduleConflicts.length > 3 && (
                <li>还有 {scheduleConflicts.length - 3} 个冲突...</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
