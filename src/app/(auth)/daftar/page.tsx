import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthForm
      action={signUp}
      title="Daftar"
      description="Buat akun untuk mulai mencatat keuangan."
      submitLabel="Daftar"
      fields={[
        { name: "full_name", label: "Nama", type: "text", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
          placeholder: "Minimal 8 karakter",
        },
        {
          name: "confirm",
          label: "Ulangi password",
          type: "password",
          autoComplete: "new-password",
        },
      ]}
      footer={[{ href: "/login", label: "Sudah punya akun? Masuk" }]}
    />
  );
}
