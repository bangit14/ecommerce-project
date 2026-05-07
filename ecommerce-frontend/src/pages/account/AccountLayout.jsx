import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BellIcon,
  ClipboardDocumentListIcon,
  GiftIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import CustomerAccountHeader from "../../components/customer/CustomerAccountHeader";
import CustomerAccountFooter from "../../components/customer/CustomerAccountFooter";
import { userService } from "../../services/userService";

const getNavClassName = ({ isActive }) => {
  if (isActive) {
    return "flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600";
  }

  return "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100";
};

const getSubNavClassName = ({ isActive }) => {
  if (isActive) {
    return "block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600";
  }

  return "block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100";
};

export default function AccountLayout() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const data = await userService.getUserProfile();
        if (isMounted) {
          setProfile(data || null);
        }
      } catch {
        if (isMounted) {
          setProfile(null);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName =
    profile?.fullName || profile?.username || "Tài khoản của tôi";

  return (
    <div className="min-h-screen bg-gray-100">
      <CustomerAccountHeader position="fixed" maxWidthClass="max-w-6xl" />

      <div className="px-4 py-6 pb-20 pt-24 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <UserCircleIcon className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {displayName}
                </p>
                <Link
                  to="/account/profile"
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Sửa Hồ Sơ
                </Link>
              </div>
            </div>

            <nav className="mt-4 space-y-2">
              <NavLink to="/account/notifications" className={getNavClassName}>
                <BellIcon className="h-5 w-5" />
                <span>Thông Báo</span>
              </NavLink>

              <div className="rounded-xl border border-gray-200 p-2">
                <div className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold text-gray-800">
                  <UserCircleIcon className="h-5 w-5 text-blue-600" />
                  <span>Tài Khoản Của Tôi</span>
                </div>

                <div className="space-y-1 pl-7">
                  <NavLink to="/account/profile" className={getSubNavClassName}>
                    Hồ Sơ
                  </NavLink>
                  <NavLink to="/account/address" className={getSubNavClassName}>
                    Địa Chỉ
                  </NavLink>
                  <NavLink
                    to="/account/change-password"
                    className={getSubNavClassName}
                  >
                    Đổi Mật Khẩu
                  </NavLink>
                </div>
              </div>

              <NavLink to="/account/orders" className={getNavClassName}>
                <ClipboardDocumentListIcon className="h-5 w-5" />
                <span>Đơn Mua</span>
              </NavLink>

              <NavLink to="/account/vouchers" className={getNavClassName}>
                <GiftIcon className="h-5 w-5" />
                <span>Kho Voucher</span>
              </NavLink>
            </nav>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <Outlet />
          </section>
        </div>
      </div>

      <CustomerAccountFooter variant="compact" fixed />
    </div>
  );
}
