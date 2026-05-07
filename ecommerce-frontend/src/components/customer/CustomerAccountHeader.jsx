/* eslint-disable react/prop-types */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { getCurrentRole } from "../../utils/authSession";

const POSITION_CLASS = {
  sticky: "sticky top-0",
  fixed: "fixed inset-x-0 top-0",
};

const DEFAULT_NOTIFICATIONS = [
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

export default function CustomerAccountHeader({
  position = "sticky",
  maxWidthClass = "max-w-7xl",
  showSearch = true,
  searchPlaceholder = "Tìm kiếm sản phẩm...",
  cartCount = 2,
  notifications = DEFAULT_NOTIFICATIONS,
}) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const token = localStorage.getItem("token");
  const role = getCurrentRole();
  const isCustomerLoggedIn =
    Boolean(token) && (role === "CUSTOMER" || role === "USER");

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/login", { replace: true });
  };

  return (
    <header
      className={`${POSITION_CLASS[position] || POSITION_CLASS.sticky} z-50 border-b border-gray-200 bg-white`}
    >
      <nav className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex h-16 items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="Về trang chủ"
          >
            <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">BEcom</span>
          </Link>

          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-3xl">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            {isCustomerLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/cart"
                  className="relative rounded-full p-2 hover:bg-gray-100"
                  aria-label="Giỏ hàng"
                >
                  <ShoppingCartIcon className="h-6 w-6 text-gray-700" />
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                    {cartCount}
                  </span>
                </Link>

                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen((prev) => !prev)}
                    className="relative rounded-full p-2 hover:bg-gray-100"
                    aria-label="Thông báo"
                  >
                    <BellIcon className="h-6 w-6 text-gray-700" />
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs text-white">
                      {notifications.length}
                    </span>
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
                      <h4 className="mb-2 font-semibold text-gray-900">
                        Thông báo
                      </h4>
                      <ul className="max-h-72 space-y-2 overflow-auto">
                        {notifications.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-lg p-2 hover:bg-gray-50"
                          >
                            <p className="text-sm text-gray-800">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
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
                    className="rounded-full p-2 hover:bg-gray-100"
                    aria-label="Tài khoản"
                  >
                    <UserCircleIcon className="h-7 w-7 text-gray-700" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                      <Link
                        to="/account/profile"
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Tài khoản của tôi
                      </Link>
                      <Link
                        to="/account/orders"
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Đơn hàng của tôi
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
