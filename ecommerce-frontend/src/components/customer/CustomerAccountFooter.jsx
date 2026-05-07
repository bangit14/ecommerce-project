/* eslint-disable react/prop-types */

import { Link } from "react-router-dom";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

const DEFAULT_FOOTER_SECTIONS = [
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

export default function CustomerAccountFooter({
  variant = "full",
  fixed = false,
  sections = DEFAULT_FOOTER_SECTIONS,
}) {
  if (variant === "compact") {
    return (
      <footer
        className={`${fixed ? "fixed bottom-0 inset-x-0 z-40" : ""} border-t border-gray-200 bg-white/95 backdrop-blur`}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <p className="text-xs text-gray-500">
            © 2026 BEcom. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Link to="/products" className="hover:text-red-600">
              Mua sắm
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/account/vouchers" className="hover:text-red-600">
              Voucher
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/account/profile" className="hover:text-red-600">
              Tài khoản
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto bg-gray-900 py-12 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white">
              <ShoppingBagIcon className="h-6 w-6" />
              BEcom
            </h3>
            <p className="text-sm">
              Nền tảng mua sắm trực tuyến hàng đầu với hàng triệu sản phẩm chất
              lượng cao.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.id}>
              <h4 className="mb-4 font-bold text-white">{section.title}</h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.label}`}>
                    <a href={link.href} className="transition hover:text-white">
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
  );
}
