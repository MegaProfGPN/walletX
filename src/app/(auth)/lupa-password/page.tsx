import { AuthForm } from "@/components/auth-form";
import { requestPasswordReset } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      action={requestPasswordReset}
      title="Lupa password"
      description="Masukkan email Anda. Kami akan mengirim tautan untuk mengatur ulang password."
      submitLabel="Kirim tautan"
      fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      footer={[{ href: "/login", label: "Kembali ke halaman masuk" }]}
    />
  );
}
