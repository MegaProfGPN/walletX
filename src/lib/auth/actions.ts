"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const emailSchema = z.email("Email tidak valid");
const passwordSchema = z.string().min(8, "Password minimal 8 karakter");
const nameSchema = z.string().min(1, "Nama wajib diisi").max(100);

const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi"),
});

const signUpSchema = z
  .object({
    full_name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Konfirmasi password tidak sama",
  });

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: read(formData, "email"),
    password: read(formData, "password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email atau password salah." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    full_name: read(formData, "full_name"),
    email: read(formData, "email"),
    password: read(formData, "password"),
    confirm: read(formData, "confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name } },
  });
  if (error) {
    return { error: "Pendaftaran gagal: " + error.message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return {
    message:
      "Pendaftaran berhasil. Cek email Anda untuk konfirmasi akun, lalu masuk kembali.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(read(formData, "email"));
  if (!parsed.success) return { error: "Email tidak valid" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm?next=/atur-ulang-password`,
  });

  // Selalu jawab sama, agar tidak membocorkan apakah email terdaftar.
  return {
    message: "Jika email Anda terdaftar, kami sudah mengirim tautan untuk mengatur ulang password.",
  };
}

export async function updatePassword(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = read(formData, "password");
  const confirm = read(formData, "confirm");
  if (!passwordSchema.safeParse(password).success) {
    return { error: "Password minimal 8 karakter" };
  }
  if (password !== confirm) {
    return { error: "Konfirmasi password tidak sama" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Gagal mengubah password: " + error.message };
  }

  redirect("/login?pesan=password-diperbarui");
}
