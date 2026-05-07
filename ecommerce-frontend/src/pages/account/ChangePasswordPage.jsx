import ChangePasswordForm from "../../features/account/components/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Đổi Mật Khẩu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Thay đổi mật khẩu thường xuyên để tăng cường bảo mật.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
