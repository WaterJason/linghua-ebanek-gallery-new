      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            日历视图
          </TabsTrigger>
          <TabsTrigger value="list">
            <UsersIcon className="h-4 w-4 mr-2" />
            列表视图
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            排班统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="pt-4">
          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-5">
              <CardHeader>
                <CardTitle>排班日历</CardTitle>
                <CardDescription>查看和管理员工排班</CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleCalendar
                  key={scheduleAdded ? "updated" : "initial"}
                  schedules={schedules}
                  loading={isLoading}
                  onScheduleDeleted={handleScheduleDeleted}
                  onDateClick={handleDateClick}
                  selectedDates={selectedDates}
                  onDateSelect={handleDateSelect}
                />
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>日历</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScheduleDayCalendar
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    employees={employees}
                    schedules={schedules}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>当日值班</CardTitle>
                  <CardDescription>
                    {format(selectedDate, "yyyy年MM月dd日", { locale: zhCN })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TodaySchedule
                    employees={employees}
                    date={selectedDate}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>排班列表</CardTitle>
              <CardDescription>查看和管理员工排班</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">加载排班数据...</div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">暂无排班数据</div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => {
                    const employee = employees.find((e) => e.id === schedule.employeeId) || { name: "未知员工" }
                    return (
                      <div key={schedule.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            {employee.name.slice(0, 1)}
                          </div>
                          <div>
                            <div>{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(schedule.date), "yyyy-MM-dd")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">
                            {schedule.startTime}-{schedule.endTime}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm("确定要删除这个排班吗？")) {
                                // 使用服务器操作删除排班
                                try {
                                  await deleteSchedule(schedule.id)
                                  handleScheduleDeleted()
                                } catch (error) {
                                  console.error("Error deleting schedule:", error)
                                  toast({
                                    title: "删除失败",
                                    description: "无法删除排班",
                                    variant: "destructive",
                                  })
                                }
                              }
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
