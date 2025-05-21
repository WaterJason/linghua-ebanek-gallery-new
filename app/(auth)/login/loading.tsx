export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          聆花掐丝珐琅馆
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          正在加载，请稍候...
        </p>
      </div>
    </div>
  )
}
