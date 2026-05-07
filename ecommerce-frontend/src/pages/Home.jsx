import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
  Smartphone,
  House,
  BookOpen,
  Sparkles,
  Shirt,
  Dumbbell,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CustomerAccountHeader from "../components/customer/CustomerAccountHeader";
import CustomerAccountFooter from "../components/customer/CustomerAccountFooter";
import { categoryService } from "../services/categoryService";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [brokenCategoryIconIds, setBrokenCategoryIconIds] = useState(
    () => new Set(),
  );
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false);
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] =
    useState(false);
  const categoryScrollerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategoryTree = async () => {
      setCategoriesLoading(true);
      try {
        const data = await categoryService.getCategoryTree();
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load category tree", error);
        if (isMounted) {
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategoryTree();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateCategoryScrollState = () => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) {
      setCanScrollCategoriesLeft(false);
      setCanScrollCategoriesRight(false);
      return;
    }

    setCanScrollCategoriesLeft(scroller.scrollLeft > 6);

    const remainingDistance =
      scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft;

    setCanScrollCategoriesRight(remainingDistance > 6);
  };

  useEffect(() => {
    updateCategoryScrollState();
  }, [categoriesLoading, categories]);

  useEffect(() => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) {
      return undefined;
    }

    const handleScroll = () => {
      updateCategoryScrollState();
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    handleScroll();

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [categoriesLoading, categories]);

  const featuredProducts = [
    {
      id: 1,
      name: "Sản phẩm Premium 1",
      price: "499.000₫",
      originalPrice: "799.000₫",
      rating: 4.8,
      reviews: 128,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      badge: "Hot",
    },
    {
      id: 2,
      name: "Sản phẩm Premium 2",
      price: "699.000₫",
      originalPrice: "999.000₫",
      rating: 4.9,
      reviews: 256,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      badge: "New",
    },
    {
      id: 3,
      name: "Sản phẩm Premium 3",
      price: "399.000₫",
      originalPrice: "599.000₫",
      rating: 4.7,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop",
      badge: "Sale",
    },
    {
      id: 4,
      name: "Sản phẩm Premium 4",
      price: "899.000₫",
      originalPrice: "1.299.000₫",
      rating: 5,
      reviews: 342,
      image:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
      badge: "Best",
    },
  ];

  const benefits = [
    {
      id: "shipping",
      icon: TruckIcon,
      title: "Giao hàng nhanh",
      description: "Miễn phí vận chuyển cho đơn hàng từ 300.000đ.",
    },
    {
      id: "secure",
      icon: ShieldCheckIcon,
      title: "Thanh toán an toàn",
      description: "Bảo mật thông tin với tiêu chuẩn thanh toán hiện đại.",
    },
    {
      id: "quality",
      icon: StarIcon,
      title: "Sản phẩm chất lượng",
      description: "Hàng chính hãng, đổi trả dễ dàng trong 7 ngày.",
    },
  ];

  const getCategoryIcon = (name = "", slug = "") => {
    const normalized = `${name} ${slug}`.toLowerCase();

    if (
      normalized.includes("điện") ||
      normalized.includes("electronics") ||
      normalized.includes("phone")
    ) {
      return Smartphone;
    }

    if (
      normalized.includes("nhà") ||
      normalized.includes("home") ||
      normalized.includes("nội thất")
    ) {
      return House;
    }

    if (normalized.includes("sách") || normalized.includes("book")) {
      return BookOpen;
    }

    if (
      normalized.includes("làm đẹp") ||
      normalized.includes("mỹ phẩm") ||
      normalized.includes("beauty")
    ) {
      return Sparkles;
    }

    if (
      normalized.includes("thể thao") ||
      normalized.includes("sport") ||
      normalized.includes("fitness")
    ) {
      return Dumbbell;
    }

    if (
      normalized.includes("thời trang") ||
      normalized.includes("fashion") ||
      normalized.includes("quần áo")
    ) {
      return Shirt;
    }

    return Package;
  };

  const handleCategoryIconError = (categoryId) => {
    setBrokenCategoryIconIds((prev) => {
      if (prev.has(categoryId)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
  };

  const handleScrollCategoriesRight = () => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) {
      return;
    }

    const scrollStep = Math.max(320, Math.floor(scroller.clientWidth * 0.82));
    scroller.scrollBy({ left: scrollStep, behavior: "smooth" });
  };

  const handleScrollCategoriesLeft = () => {
    const scroller = categoryScrollerRef.current;
    if (!scroller) {
      return;
    }

    const scrollStep = Math.max(320, Math.floor(scroller.clientWidth * 0.82));
    scroller.scrollBy({ left: -scrollStep, behavior: "smooth" });
  };

  const categorySkeletonKeys = [
    "skeleton-a",
    "skeleton-b",
    "skeleton-c",
    "skeleton-d",
    "skeleton-e",
    "skeleton-f",
  ];

  let categorySectionContent;
  if (categoriesLoading) {
    categorySectionContent = (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categorySkeletonKeys.map((key) => (
          <div
            key={key}
            className="h-36 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"
          />
        ))}
      </div>
    );
  } else if (categories.length > 0) {
    categorySectionContent = (
      <div className="relative">
        <div ref={categoryScrollerRef} className="overflow-x-auto pb-2">
          <div className="min-w-max grid grid-flow-col grid-rows-2 auto-cols-[150px] md:auto-cols-[165px] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            {categories.map((category) => {
              const CategoryIcon = getCategoryIcon(
                category.name,
                category.slug,
              );
              const showRemoteIcon =
                Boolean(category.iconUrl) &&
                !brokenCategoryIconIds.has(category.id);

              return (
                <Link
                  key={category.id}
                  to={`/products?categoryId=${category.id}`}
                  className="h-48 px-3 py-4 border-r border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/70 transition"
                >
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                    {showRemoteIcon ? (
                      <img
                        src={category.iconUrl}
                        alt={`Icon ${category.name}`}
                        className="h-10 w-10 object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => handleCategoryIconError(category.id)}
                      />
                    ) : (
                      <CategoryIcon
                        className="h-9 w-9 text-gray-700 dark:text-gray-100"
                        strokeWidth={2.1}
                      />
                    )}
                  </div>
                  <h3 className="text-base font-medium leading-snug text-gray-800 dark:text-gray-100 max-w-[135px] break-words">
                    {category.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>

        {canScrollCategoriesLeft && (
          <button
            type="button"
            onClick={handleScrollCategoriesLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition flex items-center justify-center"
            aria-label="Xem danh mục trước đó"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-100" />
          </button>
        )}

        {canScrollCategoriesRight && (
          <button
            type="button"
            onClick={handleScrollCategoriesRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition flex items-center justify-center"
            aria-label="Xem thêm danh mục"
          >
            <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-100" />
          </button>
        )}
      </div>
    );
  } else {
    categorySectionContent = (
      <div className="text-center py-10 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
        Chưa có danh mục để hiển thị.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <CustomerAccountHeader />

      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
                  Mua sắm thông minh, tiết kiệm tối đa
                </h1>
                <p className="text-xl mb-8 text-blue-100">
                  Khám phá hàng triệu sản phẩm chất lượng cao với giá tốt nhất.
                  Giao hàng nhanh, an toàn và tiện lợi.
                </p>
                <div className="flex gap-4 flex-col sm:flex-row">
                  <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2">
                    Mua sắm ngay
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                  <Link
                    to="/register"
                    className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition text-center"
                  >
                    Đăng ký tài khoản
                  </Link>
                </div>
              </div>

              <div className="relative h-96 bg-blue-700 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop"
                  alt="Shopping"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.id}
                    className="flex items-start gap-4 p-6 bg-white dark:bg-gray-700 rounded-xl"
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Danh mục sản phẩm
            </h2>

            {categorySectionContent}
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sản phẩm nổi bật
              </h2>
              <Link
                to="/products"
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                Xem tất cả
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition group"
                >
                  {/* Product Image */}
                  <div className="relative overflow-hidden h-64 bg-gray-200">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    {product.badge && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {product.badge}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex gap-0.5">
                        {new Array(5).fill(null).map((_, i) => (
                          <StarIcon
                            key={`star-${product.id}-${i}`}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {product.price}
                      </span>
                      <span className="text-sm line-through text-gray-500">
                        {product.originalPrice}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Nhận ưu đãi độc quyền từ BEcom
            </h2>
            <p className="mb-8 text-blue-100">
              Đăng ký nhận bản tin để có độc quyền các ưu đãi, mã giảm giá và
              các bài viết hay nhất
            </p>

            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-lg transition"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </section>
      </div>

      <CustomerAccountFooter />
    </div>
  );
}
