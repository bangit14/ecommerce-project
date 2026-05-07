export default function MyOrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Đơn hàng của tôi
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Bạn chưa có đơn hàng nào.
          </p>
        </div>
      </div>
    </div>
  );
}
