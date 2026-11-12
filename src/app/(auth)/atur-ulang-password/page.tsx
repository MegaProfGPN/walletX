import { AuthForm } from "@/components/auth-form";
import { updatePassword } from "@/lib/auth/actions";

export default function ResetPasswordPage() {
  return (
    <AuthForm
      action={updatePassword}
      title="Atur ulang password"
      description="Masukkan password baru untuk akun Anda."
      submitLabel="Simpan password"
      fields={[
        {
          name: "password",
          label: "Password baru",
          type: "password",
          autoComplete: "new-password",
          placeholder: "Minimal 8 karakter",
        },
        {
          name: "confirm",
          label: "Ulangi password baru",
          type: "password",
          autoComplete: "new-password",
        },
      ]}
      footer={[{ href: "/login", label: "Kembali ke halaman masuk" }]}
    />
  );
}
