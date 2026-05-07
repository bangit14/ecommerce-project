const notifications = [
  {
    id: 1,
    title: "Đơn hàng #A1023 đã được xác nhận",
    time: "2 phút trước",
  },
  {
    id: 2,
    title: "Bạn có mã giảm giá mới 15%",
    time: "1 giờ trước",
  },
  {
    id: 3,
    title: "Sản phẩm trong wishlist đang giảm giá",
    time: "Hôm qua",
  },
];

export default function AccountNotificationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thông Báo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cập nhật mới nhất về đơn hàng, khuyến mãi và tài khoản.
        </p>
      </div>

      <ul className="space-y-2">
        {notifications.map((item) => (
          <li key={item.id} className="rounded-xl border border-gray-200 p-3">
            <p className="text-sm font-medium text-gray-800">{item.title}</p>
            <p className="mt-1 text-xs text-gray-500">{item.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
