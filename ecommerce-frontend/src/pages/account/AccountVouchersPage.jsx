export default function AccountVouchersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kho Voucher</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý các voucher đã lưu và ưu đãi còn hiệu lực.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-600">Hiện chưa có voucher khả dụng.</p>
      </div>
    </div>
  );
}
