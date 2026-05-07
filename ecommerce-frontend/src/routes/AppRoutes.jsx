import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import AdminLogin from "../pages/auth/AdminLogin";
import Register from "../pages/auth/Register";
import VerifyCode from "../pages/auth/VerifyCode";
import AdminDashboard from "../pages/admin/Dashboard";
import UsersManagement from "../pages/admin/UsersManagement";
import CategoryManagement from "../pages/admin/CategoryManagement";
import ProductManagement from "../pages/admin/ProductManagement";
import OrderManagement from "../pages/admin/OrderManagement";
import ProfilePage from "../pages/account/ProfilePage";
import ChangePasswordPage from "../pages/account/ChangePasswordPage";
import AccountLayout from "../pages/account/AccountLayout";
import AccountNotificationsPage from "../pages/account/AccountNotificationsPage";
import AccountAddressPage from "../pages/account/AccountAddressPage";
import AccountOrdersPage from "../pages/account/AccountOrdersPage";
import AccountVouchersPage from "../pages/account/AccountVouchersPage";
import CartPage from "../pages/customer/Cart";
import ProductsPage from "../pages/customer/Products";
import ProductDetailPage from "../pages/customer/ProductDetail";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />

      <Route element={<ProtectedRoute redirectTo="/login" />}>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="address" element={<AccountAddressPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="notifications" element={<AccountNotificationsPage />} />
          <Route path="orders" element={<AccountOrdersPage />} />
          <Route path="vouchers" element={<AccountVouchersPage />} />
        </Route>

        <Route
          path="/profile"
          element={<Navigate to="/account/profile" replace />}
        />
        <Route
          path="/change-password"
          element={<Navigate to="/account/change-password" replace />}
        />
        <Route
          path="/my-orders"
          element={<Navigate to="/account/orders" replace />}
        />
      </Route>

      <Route element={<ProtectedRoute redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route
            path="/admin/change-password"
            element={<ChangePasswordPage />}
          />

          <Route
            element={
              <ProtectedRoute requiredRole="ADMIN" redirectTo="/admin/login" />
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersManagement />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/orders" element={<OrderManagement />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
