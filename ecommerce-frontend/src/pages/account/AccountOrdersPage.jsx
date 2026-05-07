const tabs = [
  "Tất cả",
  "Chờ thanh toán",
  "Vận chuyển",
  "Chờ giao hàng",
  "Hoàn thành",
  "Đã hủy",
  "Trả hàng/Hoàn tiền",
];

const orders = [
  {
    id: "#DH220501-001",
    shopName: "VINTECHPHARM",
    statusLabel: "Giao hàng thành công",
    statusTone: "text-emerald-600",
    statusBadge: "HOÀN THÀNH",
    total: 45000,
    ratingDeadline: "15-05-2026",
    items: [
      {
        id: 1,
        name: "Viên Sủi MultiVitamin bổ sung vitamin và khoáng chất, nhiều vị, nhiều mẫu - Hộp 20 viên",
        variant: "Cam",
        quantity: 1,
        price: 22500,
        originalPrice: 35000,
      },
      {
        id: 2,
        name: "Viên Sủi MultiVitamin bổ sung vitamin và khoáng chất, nhiều vị, nhiều mẫu - Hộp 20 viên",
        variant: "Việt Quất",
        quantity: 1,
        price: 22500,
        originalPrice: 35000,
      },
    ],
  },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export default function AccountOrdersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đơn Mua</h1>
        <p className="mt-1 text-sm text-gray-500">
          Theo dõi đơn hàng và trạng thái giao hàng của bạn.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap gap-4 px-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`py-3 text-sm font-medium transition-colors ${
                  tab === "Tất cả"
                    ? "text-orange-600 border-b-2 border-orange-500"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <svg
              className="h-4 w-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
              className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-gray-200 bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                  Yêu thích
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {order.shopName}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded bg-orange-500 px-2 py-1 text-xs font-semibold text-white"
                >
                  Chat
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700"
                >
                  Xem Shop
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`font-semibold ${order.statusTone}`}>
                  {order.statusLabel}
                </span>
                <span className="h-4 w-px bg-gray-200" />
                <span className="text-xs font-semibold text-orange-500">
                  {order.statusBadge}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs text-gray-400">
                      Ảnh
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Phân loại hàng: {item.variant}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        x{item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-right text-sm">
                    <span className="text-gray-300 line-through">
                      {formatPrice(item.originalPrice)}
                    </span>
                    <span className="text-orange-600">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-gray-50/60 px-4 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  Đánh giá sản phẩm trước {order.ratingDeadline}
                  <p className="text-xs text-orange-500">
                    Đánh giá ngay và nhận 200 Xu
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    Thành tiền:{" "}
                    <span className="text-xl font-semibold text-orange-600">
                      {formatPrice(order.total)}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Đánh Giá
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Liên Hệ Người Bán
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Mua Lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
