import ProfileUpdateForm from "../../features/account/components/ProfileUpdateForm";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ Của Tôi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý thông tin hồ sơ để bảo mật tài khoản.
        </p>
      </div>
      <ProfileUpdateForm />
    </div>
  );
}
