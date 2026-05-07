// src/layouts/AdminLayout.jsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  UserCircleIcon,
  KeyIcon,
  FolderIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    toast.success("Đăng xuất thành công");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 lg:pl-64">
      {/* Sidebar mobile toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
        >
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div>
          <div className="p-6 border-b dark:border-gray-700">
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          </div>

          <nav className="mt-6 px-3 space-y-1">
            <Link
              to="/admin"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <HomeIcon className="h-6 w-6 mr-3" />
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <UsersIcon className="h-6 w-6 mr-3" />
              Người dùng
            </Link>
            <Link
              to="/admin/categories"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FolderIcon className="h-6 w-6 mr-3" />
              Danh mục
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <CubeIcon className="h-6 w-6 mr-3" />
              Sản phẩm
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ClipboardDocumentListIcon className="h-6 w-6 mr-3" />
              Đơn hàng
            </Link>
            <Link
              to="/admin/profile"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <UserCircleIcon className="h-6 w-6 mr-3" />
              Hồ sơ cá nhân
            </Link>
            <Link
              to="/admin/change-password"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <KeyIcon className="h-6 w-6 mr-3" />
              Đổi mật khẩu
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-center px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen">
        <main className="p-6 pt-20 lg:pt-6">
          <Outlet /> {/* Nội dung các trang admin sẽ render ở đây */}
        </main>
      </div>
    </div>
  );
}
