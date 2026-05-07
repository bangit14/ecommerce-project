import { useEffect, useMemo, useState } from "react";
import {
  ClockIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const statusOptions = [
  "Chờ thanh toán",
  "Vận chuyển",
  "Chờ giao hàng",
  "Hoàn thành",
  "Đã hủy",
  "Trả hàng/Hoàn tiền",
];

const statusStyles = {
  "Chờ thanh toán": "bg-amber-50 text-amber-700 border-amber-200",
  "Vận chuyển": "bg-blue-50 text-blue-700 border-blue-200",
  "Chờ giao hàng": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Hoàn thành": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Đã hủy": "bg-rose-50 text-rose-700 border-rose-200",
  "Trả hàng/Hoàn tiền": "bg-purple-50 text-purple-700 border-purple-200",
};

const initialOrders = [
  {
    id: "DH220501-001",
    customerName: "Nguyễn Minh Anh",
    phone: "0901 234 567",
    address: "Quận 1, TP.HCM",
    paymentMethod: "COD",
    status: "Hoàn thành",
    total: 45000,
    updatedAt: "01/05/2026 10:35",
    note: "Khách cần giao giờ hành chính.",
    items: [
      {
        id: "SKU-2024-001",
        name: "Viên sủi MultiVitamin hộp 20 viên",
        quantity: 2,
      },
    ],
    history: [
      {
        id: "DH220501-001-H1",
        time: "01/05/2026 09:10",
        by: "Admin",
        action: "Tạo đơn hàng",
        note: "Đơn hàng được tạo từ web.",
      },
      {
        id: "DH220501-001-H2",
        time: "01/05/2026 10:35",
        by: "Admin",
        action: "Cập nhật trạng thái -> Hoàn thành",
        note: "Đã giao thành công.",
      },
    ],
  },
  {
    id: "DH220501-002",
    customerName: "Trần Khả Nhi",
    phone: "0932 888 999",
    address: "Thủ Đức, TP.HCM",
    paymentMethod: "VNPAY",
    status: "Chờ giao hàng",
    total: 128000,
    updatedAt: "01/05/2026 11:20",
    note: "Gọi trước 15 phút.",
    items: [
      {
        id: "SKU-2024-011",
        name: "Gel rửa mặt tinh chất trà xanh",
        quantity: 1,
      },
      {
        id: "SKU-2024-017",
        name: "Nước hoa hồng phục hồi",
        quantity: 1,
      },
    ],
    history: [
      {
        id: "DH220501-002-H1",
        time: "01/05/2026 10:05",
        by: "Admin",
        action: "Tạo đơn hàng",
        note: "Khách thanh toán VNPAY.",
      },
      {
        id: "DH220501-002-H2",
        time: "01/05/2026 11:20",
        by: "Admin",
        action: "Cập nhật trạng thái -> Chờ giao hàng",
        note: "Đang chờ đơn vị vận chuyển.",
      },
    ],
  },
];

const formatPrice = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

const createHistoryId = (orderId) =>
  `${orderId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function OrderManagement() {
  const [orders, setOrders] = useState(initialOrders);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [historyTarget, setHistoryTarget] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setStatusDrafts((prev) => {
      const next = { ...prev };
      orders.forEach((order) => {
        if (!next[order.id]) {
          next[order.id] = order.status;
        }
      });
      return next;
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "Tất cả" || order.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchable = [
        order.id,
        order.customerName,
        order.phone,
        order.items.map((item) => item.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(keyword);
    });
  }, [orders, search, statusFilter]);

  const totalSummary = useMemo(() => {
    return statusOptions.reduce((acc, status) => {
      acc[status] = orders.filter((order) => order.status === status).length;
      return acc;
    }, {});
  }, [orders]);

  const handleUpdateStatus = (orderId) => {
    const nextStatus = statusDrafts[orderId];
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId || order.status === nextStatus) {
          return order;
        }

        const time = new Date().toLocaleString("vi-VN");
        return {
          ...order,
          status: nextStatus,
          updatedAt: time,
          history: [
            ...order.history,
            {
              id: createHistoryId(order.id),
              time,
              by: "Admin",
              action: `Cập nhật trạng thái -> ${nextStatus}`,
              note: "",
            },
          ],
        };
      }),
    );
  };

  const openNoteEditor = (order) => {
    setNoteTarget(order);
    setNoteDraft(order.note || "");
  };

  const saveNote = () => {
    if (!noteTarget) {
      return;
    }

    const time = new Date().toLocaleString("vi-VN");
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== noteTarget.id) {
          return order;
        }

        return {
          ...order,
          note: noteDraft.trim(),
          updatedAt: time,
          history: [
            ...order.history,
            {
              id: createHistoryId(order.id),
              time,
              by: "Admin",
              action: "Cập nhật ghi chú",
              note: noteDraft.trim(),
            },
          ],
        };
      }),
    );

    setNoteTarget(null);
    setNoteDraft("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="mt-1 text-sm text-gray-500">
          Theo dõi danh sách đơn, cập nhật trạng thái và ghi chú xử lý.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusOptions.map((status) => (
          <div
            key={status}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-sm text-gray-500">{status}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {totalSummary[status] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã đơn, khách hàng, sản phẩm"
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mã đơn</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left font-semibold">Tổng tiền</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Cập nhật lúc
                </th>
                <th className="px-4 py-3 text-left font-semibold">Ghi chú</th>
                <th className="px-4 py-3 text-left font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="text-gray-700">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {order.id}
                    <p className="mt-1 text-xs text-gray-500">
                      {order.items.length} sản phẩm
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                    <p className="text-xs text-gray-500">{order.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.paymentMethod}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                        statusStyles[order.status] ||
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {order.status}
                    </span>
                    <div className="mt-2">
                      <select
                        value={statusDrafts[order.id] || order.status}
                        onChange={(event) =>
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [order.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {order.updatedAt}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {order.note ? order.note : "Chưa có ghi chú"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryTarget(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        <ClockIcon className="h-4 w-4" />
                        Lịch sử
                      </button>
                      <button
                        type="button"
                        onClick={() => openNoteEditor(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        Ghi chú
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Không tìm thấy đơn hàng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {historyTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Lịch sử đơn {historyTarget.id}
                </h3>
                <p className="text-xs text-gray-500">
                  {historyTarget.customerName} ·{" "}
                  {formatPrice(historyTarget.total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {historyTarget.history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-200 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      {entry.action}
                    </p>
                    <span className="text-xs text-gray-500">{entry.time}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Xử lý bởi: {entry.by}
                  </p>
                  {entry.note ? (
                    <p className="mt-2 text-xs text-gray-600">{entry.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {noteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold">Ghi chú đơn hàng</h3>
              <button
                type="button"
                onClick={() => setNoteTarget(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {noteTarget.id} · {noteTarget.customerName}
            </p>
            <textarea
              rows={4}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nhập ghi chú xử lý..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveNote}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
