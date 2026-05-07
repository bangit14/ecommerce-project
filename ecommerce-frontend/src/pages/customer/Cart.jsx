import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { getCurrentRole } from "../../utils/authSession";
import { cartService } from "../../services/cartService";
import { getErrorMessage } from "../../utils/errorHandler";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const FOOTER_SECTIONS = [
  {
    id: "about",
    title: "Giới thiệu",
    links: [
      { label: "Giới thiệu", href: "/" },
      { label: "Tuyển dụng", href: "/" },
      { label: "Blog", href: "/" },
    ],
  },
  {
    id: "support",
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", href: "/" },
      { label: "Liên hệ", href: "/" },
      { label: "Khiếu nại", href: "/" },
    ],
  },
  {
    id: "policy",
    title: "Chính sách",
    links: [
      { label: "Điều khoản", href: "/" },
      { label: "Bảo mật", href: "/" },
      { label: "Vận chuyển", href: "/" },
    ],
  },
];

export default function CartPage() {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [selectedVariantIds, setSelectedVariantIds] = useState(new Set());
  const isMountedRef = useRef(true);

  const token = localStorage.getItem("token");
  const role = getCurrentRole();
  const isCustomerLoggedIn =
    Boolean(token) && (role === "CUSTOMER" || role === "USER");

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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCartItems = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      if (isMountedRef.current) {
        setCartItems([]);
        setCartLoading(false);
      }
      return;
    }

    setCartLoading(true);
    setCartError("");

    try {
      const items = await cartService.getCartItems(userId);
      if (!isMountedRef.current) {
        return;
      }

      setCartItems(Array.isArray(items) ? items : []);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setCartItems([]);
      setCartError(getErrorMessage(error, "Không thể tải giỏ hàng."));
    } finally {
      if (isMountedRef.current) {
        setCartLoading(false);
      }
    }
  };

  const handleUpdateQuantity = async (item, nextQuantity) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setCartError("Vui lòng đăng nhập để cập nhật giỏ hàng.");
      return;
    }

    if (!item?.variantId) {
      setCartError("Không tìm thấy biến thể để cập nhật.");
      return;
    }

    setCartError("");

    try {
      if (nextQuantity <= 0) {
        await cartService.removeCartItem({
          userId,
          variantId: item.variantId,
        });
      } else {
        await cartService.updateCartItem({
          userId,
          variantId: item.variantId,
          quantity: nextQuantity,
        });
      }

      await fetchCartItems();
    } catch (error) {
      setCartError(getErrorMessage(error, "Không thể cập nhật giỏ hàng."));
    }
  };

  const handleRemoveItem = async (item) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setCartError("Vui lòng đăng nhập để cập nhật giỏ hàng.");
      return;
    }

    if (!item?.variantId) {
      setCartError("Không tìm thấy biến thể để xoa.");
      return;
    }

    setCartError("");

    try {
      await cartService.removeCartItem({
        userId,
        variantId: item.variantId,
      });
      await fetchCartItems();
    } catch (error) {
      setCartError(getErrorMessage(error, "Không thể xoa sản phẩm."));
    }
  };


  const handleToggleItem = (variantId) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedVariantIds.size === cartItems.length && cartItems.length > 0) {
      setSelectedVariantIds(new Set());
    } else {
      setSelectedVariantIds(new Set(cartItems.map((item) => item.variantId)));
    }
  };

  const cartTotals = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        if (!selectedVariantIds.has(item.variantId)) return acc;
        const quantity = Number(item?.quantity) || 0;
        const price = Number(item?.price) || 0;
        const compareAt = Number(item?.compareAtPrice);

        acc.items += quantity;
        acc.subtotal += price * quantity;

        if (Number.isFinite(compareAt) && compareAt > price) {
          acc.compareAt += compareAt * quantity;
        }

        return acc;
      },
      { items: 0, subtotal: 0, compareAt: 0 },
    );
  }, [cartItems, selectedVariantIds]);

  const isAllSelected = cartItems.length > 0 && selectedVariantIds.size === cartItems.length;

  const totalDiscount = Math.max(0, cartTotals.compareAt - cartTotals.subtotal);


  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="Về trang chủ"
            >
              <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                BEcom
              </span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-3xl">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {isCustomerLoggedIn ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/cart"
                    className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                    aria-label="Giỏ hàng"
                  >
                    <ShoppingCartIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                  </Link>

                  <div className="relative" ref={notificationRef}>
                    <button
                      type="button"
                      onClick={() => setNotificationOpen((prev) => !prev)}
                      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Thông báo"
                    >
                      <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-5 px-1 text-xs rounded-full bg-amber-500 text-white">
                        {notifications.length}
                      </span>
                    </button>

                    {notificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 z-50">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Thông báo
                        </h4>
                        <ul className="space-y-2 max-h-72 overflow-auto">
                          {notifications.map((item) => (
                            <li
                              key={item.id}
                              className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <p className="text-sm text-gray-800 dark:text-gray-200">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.time}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Tài khoản"
                    >
                      <UserCircleIcon className="h-7 w-7 text-gray-700 dark:text-gray-200" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 z-50">
                        <Link
                          to="/profile"
                          className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Thông tin cá nhân
                        </Link>
                        <Link
                          to="/change-password"
                          className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Đổi mật khẩu
                        </Link>
                        <Link
                          to="/my-orders"
                          className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Đơn hàng của tôi
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 w-full bg-gray-100 dark:bg-gray-900 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {cartLoading ? (
            <div className="bg-white p-6 rounded shadow flex items-center justify-center text-gray-500">
              Đang tải giỏ hàng...
            </div>
          ) : cartError ? (
            <div className="bg-white p-6 rounded shadow text-red-500 text-center">
              {cartError}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white p-12 flex flex-col items-center justify-center rounded shadow">
              <ShoppingCartIcon className="w-24 h-24 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Giỏ hàng của bạn còn trống</p>
              <Link to="/" className="px-8 py-2 bg-red-500 hover:bg-red-600 text-white rounded">
                Mua ngay
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 bg-white p-4 rounded shadow shadow-gray-200 text-sm text-gray-500 items-center">
                <div className="col-span-5 flex items-center gap-4">
                  <input type="checkbox" className="w-4 h-4 text-red-500 rounded cursor-pointer border-gray-300 focus:ring-red-500" checked={isAllSelected} onChange={handleToggleAll} />
                  <span>Sản Phẩm</span>
                </div>
                <div className="col-span-2 text-center">Đơn Giá</div>
                <div className="col-span-2 text-center">Số Lượng</div>
                <div className="col-span-2 text-center">Số Tiền</div>
                <div className="col-span-1 text-center">Thao Tác</div>
              </div>

              {/* Items List */}
              {cartItems.map((item) => (
                <div key={item?.variantId || item?.productId} className="bg-white p-4 rounded shadow shadow-gray-200 border border-transparent hover:border-red-100 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 md:col-span-5 flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-red-500 cursor-pointer rounded border-gray-300 focus:ring-red-500 mt-1 sm:mt-0" 
                        checked={selectedVariantIds.has(item.variantId)} 
                        onChange={() => handleToggleItem(item.variantId)} 
                      />
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-50 border border-gray-100 rounded overflow-hidden">
                        {item?.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item?.productId}`} className="text-sm text-gray-800 hover:text-red-500 line-clamp-2 leading-tight mb-1">
                          {item?.productName || "Sản phẩm"}
                        </Link>
                        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded inline-flex gap-1 items-center cursor-pointer">
                          Phân loại hàng: {item?.variantAttributes || "Mặc định"}
                          {/* Mock dropdown icon */}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 text-left md:text-center text-sm font-medium text-gray-600 mt-2 md:mt-0 flex md:block items-center justify-between">
                       <span className="md:hidden">Đơn giá: </span>
                       {item?.compareAtPrice > item.price && <span className="line-through text-gray-400 mr-2 text-xs">{formatCurrency(item.compareAtPrice)}</span>}
                       {formatCurrency(item?.price)}
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center justify-start md:justify-center mt-2 md:mt-0">
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white">
                        <button type="button" onClick={() => handleUpdateQuantity(item, (Number(item?.quantity) || 0) - 1)} disabled={cartLoading} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50">
                          -
                        </button>
                        <input 
                           type="number" 
                           readOnly 
                           className="w-12 h-8 text-center text-sm font-medium border-0 focus:ring-0 appearance-none p-0 outline-none" 
                           value={item?.quantity || 0} 
                        />
                        <button type="button" onClick={() => handleUpdateQuantity(item, (Number(item?.quantity) || 0) + 1)} disabled={cartLoading} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 border-l border-gray-300 disabled:opacity-50">
                          +
                        </button>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 text-left md:text-center text-sm font-bold text-red-500 mt-2 md:mt-0 flex items-center justify-between md:block">
                       <span className="md:hidden text-gray-500 font-normal">Số tiền: </span>{formatCurrency((item?.price || 0) * (item?.quantity || 0))}
                    </div>
                    <div className="col-span-1 text-left md:text-center mt-2 md:mt-0">
                      <button type="button" onClick={() => handleRemoveItem(item)} disabled={cartLoading} className="text-sm font-medium text-gray-600 hover:text-red-500 px-2 py-1">
                        Xóa
                      </button>
                      <div className="text-red-500 text-xs font-semibold mt-1 hidden md:block cursor-pointer hover:underline">
                        Tìm sản phẩm <br/>tương tự
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Voucher Section Mock */}
              <div className="bg-white rounded shadow shadow-gray-200 mt-2 p-4 border border-dashed border-red-200">
                 <div className="flex justify-between items-center w-full">
                    <span className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                       <svg className="w-5 h-5 fill-current text-red-500" viewBox="0 0 24 24" fill="none"><path d="M21 11.2V5a1 1 0 00-1-1H4a1 1 0 00-1 1v6.2A1.8 1.8 0 014.8 13 1.8 1.8 0 013 14.8V21a1 1 0 001 1h16a1 1 0 001-1v-6.2A1.8 1.8 0 0119.2 13 1.8 1.8 0 0121 11.2z"></path></svg>
                       BEcom Voucher
                    </span>
                    <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">Chọn hoặc nhập mã</span>
                 </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="sticky bottom-0 z-40 bg-white rounded shadow-lg flex flex-col md:flex-row items-center justify-between p-4 border-t-2 border-red-500 mt-4 gap-4">
                 <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6 w-full md:w-auto text-sm text-gray-700 font-medium">
                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                       <input type="checkbox" className="w-4 h-4 text-red-500 rounded cursor-pointer border-gray-300 focus:ring-red-500" checked={isAllSelected} onChange={handleToggleAll} />
                       <span>Chọn Tất Cả ({cartItems.length})</span>
                    </label>
                    <button type="button" className="hover:text-red-500 hidden sm:block whitespace-nowrap" onClick={() => { /* Xóa hàng loạt */ }}>Xóa</button>
                    <button type="button" className="hover:text-red-500 text-gray-500 hidden md:block whitespace-nowrap">Bỏ sản phẩm không hoạt động</button>
                    <button type="button" className="hover:text-red-500 text-orange-500 hidden md:block whitespace-nowrap">Lưu vào mục Đã thích</button>
                 </div>
                 <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="text-right">
                       <div className="text-sm font-medium text-gray-700 flex items-center justify-end">
                          Tổng thanh toán ({selectedVariantIds.size} Sản phẩm): 
                          <span className="text-2xl font-bold text-red-500 ml-3">{formatCurrency(cartTotals.subtotal)}</span>
                       </div>
                       {totalDiscount > 0 && <div className="text-xs text-gray-500">Tiết kiệm {formatCurrency(totalDiscount)}</div>}
                    </div>
                    <button type="button" disabled={cartLoading || cartTotals.items === 0} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0">
                       Mua Hàng
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <ShoppingBagIcon className="h-6 w-6" />
                BEcom
              </h3>
              <p className="text-sm">
                Nền tảng mua sắm trực tuyến hàng đầu với hàng triệu sản phẩm
                chất lượng cao.
              </p>
            </div>

            {FOOTER_SECTIONS.map((section) => (
              <div key={section.id}>
                <h4 className="text-white font-bold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={`${section.id}-${link.label}`}>
                      <a
                        href={link.href}
                        className="hover:text-white transition"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 BEcom. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
