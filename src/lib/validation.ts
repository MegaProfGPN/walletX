import { z } from "zod";

export const MAX_AMOUNT = 1_000_000_000_000;
export const MAX_NOTE_LENGTH = 500;

const uuid = z.uuid();

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

const amount = z
  .number()
  .int("Jumlah harus bilangan bulat")
  .positive("Jumlah harus lebih dari 0")
  .max(MAX_AMOUNT, "Jumlah terlalu besar");

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount,
    wallet_id: uuid,
    to_wallet_id: uuid.nullable().optional(),
    category_id: uuid.nullable().optional(),
    note: z.string().max(MAX_NOTE_LENGTH, "Catatan maksimal 500 karakter").nullable().optional(),
    transaction_date: dateOnly,
    is_deleted: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "transfer") {
      if (!value.to_wallet_id) {
        ctx.addIssue({ code: "custom", path: ["to_wallet_id"], message: "Dompet tujuan wajib dipilih" });
      }
      if (value.to_wallet_id === value.wallet_id) {
        ctx.addIssue({ code: "custom", path: ["to_wallet_id"], message: "Dompet tujuan tidak boleh sama" });
      }
      if (value.category_id) {
        ctx.addIssue({ code: "custom", path: ["category_id"], message: "Transfer tidak memakai kategori" });
      }
    } else {
      if (value.to_wallet_id) {
        ctx.addIssue({ code: "custom", path: ["to_wallet_id"], message: "Dompet tujuan hanya untuk transfer" });
      }
      if (!value.category_id) {
        ctx.addIssue({ code: "custom", path: ["category_id"], message: "Kategori wajib dipilih" });
      }
    }
  });

export type TransactionInput = z.infer<typeof transactionSchema>;

export const walletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi").max(100),
  initial_balance: z.number().int().min(-MAX_AMOUNT).max(MAX_AMOUNT).optional(),
  is_archived: z.boolean().optional(),
});

export type WalletInput = z.infer<typeof walletSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(100),
  type: z.enum(["income", "expense"]),
  icon: z.string().max(50).nullable().optional(),
  is_archived: z.boolean().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const budgetSchema = z.object({
  category_id: uuid,
  month: dateOnly,
  amount_limit: amount,
});

export type BudgetInput = z.infer<typeof budgetSchema>;
