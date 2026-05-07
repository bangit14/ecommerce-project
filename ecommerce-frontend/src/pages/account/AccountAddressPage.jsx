import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { userService } from "../../services/userService";
import { getErrorMessage } from "../../utils/errorHandler";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  addressLine: "",
  ward: "",
  district: "",
  province: "",
  country: "Việt Nam",
  isDefault: false,
};

const normalizeAddress = (item, index) => {
  const rawServerId = item?.id ?? item?.addressId ?? item?.address_id;
  const parsedServerId = Number.parseInt(rawServerId, 10);
  const serverId = Number.isInteger(parsedServerId) ? parsedServerId : null;

  return {
    id: serverId || `address-${index}-${item?.phone || "unknown"}`,
    serverId,
    fullName: item?.fullName || "",
    phone: item?.phone || "",
    addressLine: item?.addressLine || item?.detail || "",
    ward: item?.ward || "",
    district: item?.district || "",
    province: item?.province || "",
    country: item?.country || "Việt Nam",
    isDefault: Boolean(item?.isDefault ?? item?.default),
  };
};

export default function AccountAddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingAddressId, setProcessingAddressId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const hasAddressesWithoutId = addresses.some((item) => !item.serverId);

  const loadAddresses = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await userService.getAddresses();
      const normalized = response.map((item, index) =>
        normalizeAddress(item, index),
      );
      setAddresses(normalized);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải danh sách địa chỉ."));
      setAddresses([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên người nhận.");
      return false;
    }

    if (!form.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại.");
      return false;
    }

    if (!form.addressLine.trim()) {
      toast.error("Vui lòng nhập địa chỉ cụ thể.");
      return false;
    }

    if (!form.ward.trim() || !form.district.trim() || !form.province.trim()) {
      toast.error(
        "Vui lòng nhập đầy đủ Phường/Xã, Quận/Huyện và Tỉnh/Thành phố.",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    const saveAddress = async () => {
      setSaving(true);

      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        addressLine: form.addressLine.trim(),
        ward: form.ward.trim(),
        district: form.district.trim(),
        province: form.province.trim(),
        country: form.country.trim() || "Việt Nam",
        default: Boolean(form.isDefault),
      };

      try {
        if (editingId) {
          await userService.updateAddress(editingId, payload);
          toast.success("Cập nhật địa chỉ thành công.");
        } else {
          await userService.addAddress(payload);
          toast.success("Thêm địa chỉ mới thành công.");
        }

        await loadAddresses({ silent: true });
        resetForm();
      } catch (error) {
        toast.error(getErrorMessage(error, "Lưu địa chỉ thất bại."));
      } finally {
        setSaving(false);
      }
    };

    saveAddress();
  };

  const handleEdit = (address) => {
    if (!address.serverId) {
      toast.error("Backend chưa trả addressId, chưa thể cập nhật địa chỉ này.");
      return;
    }

    setEditingId(address.serverId);
    setForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine: address.addressLine || "",
      ward: address.ward || "",
      district: address.district || "",
      province: address.province || "",
      country: address.country || "Việt Nam",
      isDefault: Boolean(address.isDefault),
    });
    setIsFormOpen(true);
  };

  const handleDelete = (address) => {
    if (!address.serverId) {
      toast.error("Backend chưa trả addressId, chưa thể xóa địa chỉ này.");
      return;
    }

    const confirmed = globalThis.confirm("Bạn có chắc muốn xóa địa chỉ này?");
    if (!confirmed) {
      return;
    }

    const removeAddress = async () => {
      setProcessingAddressId(address.id);
      try {
        await userService.deleteAddress(address.serverId);
        toast.success("Đã xóa địa chỉ.");
        await loadAddresses({ silent: true });
      } catch (error) {
        toast.error(getErrorMessage(error, "Xóa địa chỉ thất bại."));
      } finally {
        setProcessingAddressId(null);
      }
    };

    removeAddress();
  };

  const handleSetDefault = (address) => {
    if (!address.serverId) {
      toast.error(
        "Backend chưa trả addressId, chưa thể thiết lập mặc định cho địa chỉ này.",
      );
      return;
    }

    const setDefault = async () => {
      setProcessingAddressId(address.id);
      try {
        await userService.setDefaultAddress(address.serverId);
        toast.success("Đã thiết lập địa chỉ mặc định.");
        await loadAddresses({ silent: true });
      } catch (error) {
        toast.error(getErrorMessage(error, "Thiết lập mặc định thất bại."));
      } finally {
        setProcessingAddressId(null);
      }
    };

    setDefault();
  };

  const isAddressProcessing = (address) => processingAddressId === address.id;

  let submitButtonLabel = "Lưu địa chỉ";
  if (saving) {
    submitButtonLabel = "Đang lưu...";
  } else if (editingId) {
    submitButtonLabel = "Cập nhật địa chỉ";
  }

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      isDefault: addresses.length === 0,
    });
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-600">Đang tải danh sách địa chỉ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Địa Chỉ Của Tôi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý địa chỉ nhận hàng để đặt đơn nhanh hơn.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          + Thêm địa chỉ
        </button>
      </div>

      {hasAddressesWithoutId && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Một số địa chỉ chưa có addressId từ backend nên không thể Cập
          nhật/Xóa/ Đặt mặc định. Bạn nên thêm trường id vào AddressResponse.
        </div>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleFormChange}
              placeholder="Họ và tên người nhận"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              placeholder="Số điện thoại"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="province"
              value={form.province}
              onChange={handleFormChange}
              placeholder="Tỉnh/Thành phố"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="district"
              value={form.district}
              onChange={handleFormChange}
              placeholder="Quận/Huyện"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="ward"
              value={form.ward}
              onChange={handleFormChange}
              placeholder="Phường/Xã"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="country"
              value={form.country}
              onChange={handleFormChange}
              placeholder="Quốc gia"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <input
            name="addressLine"
            value={form.addressLine}
            onChange={handleFormChange}
            placeholder="Số nhà, tên đường"
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          />

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleFormChange}
              className="h-4 w-4 rounded border-gray-300 text-red-600"
            />
            <span>Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitButtonLabel}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">Bạn chưa lưu địa chỉ nào.</p>
          <Link
            to="/products"
            className="mt-3 inline-flex items-center rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-gray-900">
                      {address.fullName}
                    </p>
                    <span className="text-sm text-gray-400">|</span>
                    <p className="text-sm text-gray-700">{address.phone}</p>
                    {address.isDefault && (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                        Mặc định
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-700">
                    {address.addressLine}, {address.ward}, {address.district},{" "}
                    {address.province}, {address.country}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(address)}
                    disabled={!address.serverId || isAddressProcessing(address)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cập nhật
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(address)}
                    disabled={!address.serverId || isAddressProcessing(address)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xóa
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address)}
                      disabled={
                        !address.serverId || isAddressProcessing(address)
                      }
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
