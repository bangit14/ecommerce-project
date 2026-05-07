// src/pages/admin/Dashboard.jsx
export default function AdminDashboard() {
  const stats = [
    { title: 'Doanh thu hôm nay', value: '12.450.000 ₫', change: '+12.5%' },
    { title: 'Đơn hàng mới', value: '48', change: '+8%' },
    { title: 'Sản phẩm hết hàng', value: '7', change: '-2' },
    { title: 'Người dùng mới', value: '215', change: '+18%' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className={`mt-2 text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} so với hôm qua
            </p>
          </div>
        ))}
      </div>

      {/* Chart placeholder (sau này tích hợp Recharts hoặc Chart.js) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80">
          <h3 className="text-lg font-semibold mb-4">Doanh thu 7 ngày</h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            [Chart sẽ ở đây]
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80">
          <h3 className="text-lg font-semibold mb-4">Top sản phẩm bán chạy</h3>
          <ul className="space-y-4">
            <li className="flex justify-between">
              <span>Áo thun basic</span>
              <span className="font-medium">320 đơn</span>
            </li>
            {/* Thêm các item khác */}
          </ul>
        </div>
      </div>
    </div>
  );
}