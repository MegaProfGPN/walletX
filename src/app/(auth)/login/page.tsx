import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

const notices: Record<string, string> = {
  "password-diperbarui": "Password berhasil diperbarui. Silakan masuk.",
  "tautan-kedaluwarsa": "Tautan dari email sudah kedaluwarsa. Silakan minta tautan baru.",
  "tautan-tidak-valid": "Tautan tidak valid. Silakan minta tautan baru.",
  "email-dikonfirmasi": "Email berhasil dikonfirmasi. Silakan masuk.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ pesan?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { pesan } = await searchParams;

  return (
    <AuthForm
      action={signIn}
      title="Masuk"
      description="Masuk untuk mencatat pemasukan dan pengeluaran Anda."
      submitLabel="Masuk"
      notice={pesan ? notices[pesan] : undefined}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "current-password",
        },
      ]}
      footer={[
        { href: "/daftar", label: "Belum punya akun? Daftar" },
        { href: "/lupa-password", label: "Lupa password?" },
      ]}
    />
  );
}
