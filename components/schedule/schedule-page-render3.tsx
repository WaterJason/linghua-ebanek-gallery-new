        <TabsContent value="stats" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>排班统计</CardTitle>
              <CardDescription>查看员工排班统计数据</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">加载统计数据...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">暂无排班数据</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{schedules.length}</div>
                        <p className="text-sm text-muted-foreground">总排班数</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {new Set(schedules.map(s => s.employeeId)).size}
                        </div>
                        <p className="text-sm text-muted-foreground">参与员工数</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {new Set(schedules.map(s => format(new Date(s.date), "yyyy-MM-dd"))).size}
                        </div>
                        <p className="text-sm text-muted-foreground">排班天数</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">员工排班统计</h3>
                    <div className="space-y-2">
                      {employees
                        .filter(employee => schedules.some(s => s.employeeId === employee.id))
                        .map(employee => {
                          const employeeSchedules = schedules.filter(s => s.employeeId === employee.id)
                          const totalHours = employeeSchedules.reduce((total, schedule) => {
                            const [startHour, startMin] = schedule.startTime.split(":").map(Number)
                            const [endHour, endMin] = schedule.endTime.split(":").map(Number)
                            const startMinutes = startHour * 60 + startMin
                            const endMinutes = endHour * 60 + endMin
                            return total + (endMinutes - startMinutes) / 60
                          }, 0)

                          return (
                            <div key={employee.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                  {employee.name.slice(0, 1)}
                                </div>
                                <span>{employee.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span>{employeeSchedules.length} 次排班</span>
                                <span>{totalHours.toFixed(1)} 小时</span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddScheduleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        employees={employees}
        onScheduleAdded={handleScheduleAdded}
        selectedDate={selectedDate}
      />

      <BatchScheduleDialog
        open={isBatchScheduleOpen}
        onOpenChange={(open) => {
          setIsBatchScheduleOpen(open)
          if (!open) {
            // 重置日历视图状态
            setBatchScheduleCalendarView(false)
          }
        }}
        employees={employees}
        templates={templates}
        selectedDates={selectedDates}
        onSchedulesAdded={handleBatchScheduleAdded}
        initialCalendarView={batchScheduleCalendarView}
      />

      <ScheduleTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={templates}
        employees={employees}
        onTemplateAdded={handleTemplateAdded}
      />
    </div>
  )
