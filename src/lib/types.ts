// Tipe database ditulis tangan agar tidak bergantung pada generator.
// Jika skema berubah, perbarui file ini dan CONTEXT.md.
// Kolom audit (created_at, *_updated_at) diisi database, jadi opsional saat Insert.

export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";

type Audit = {
  created_at: string;
  client_updated_at: string;
  server_updated_at: string;
};

type AutoAudit = Partial<Pick<Audit, "client_updated_at">>;

export type Profile = Audit & {
  id: string;
  full_name: string | null;
  currency: string;
};

export type Wallet = Audit & {
  id: string;
  user_id: string;
  name: string;
  initial_balance: number;
  is_archived: boolean;
  is_deleted: boolean;
};

export type Category = Audit & {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
  is_archived: boolean;
  is_deleted: boolean;
};

export type Transaction = Audit & {
  id: string;
  user_id: string;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  transaction_date: string;
  is_deleted: boolean;
};

export type Budget = Audit & {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount_limit: number;
  is_deleted: boolean;
};

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, Omit<Profile, keyof Audit | "currency" | "full_name"> & AutoAudit & { full_name?: string | null; currency?: string }>;
      wallets: Table<
        Wallet,
        Omit<Wallet, keyof Audit | "initial_balance" | "is_archived" | "is_deleted"> &
          AutoAudit & { initial_balance?: number; is_archived?: boolean; is_deleted?: boolean }
      >;
      categories: Table<
        Category,
        Omit<Category, keyof Audit | "icon" | "is_archived" | "is_deleted"> &
          AutoAudit & { icon?: string | null; is_archived?: boolean; is_deleted?: boolean }
      >;
      transactions: Table<
        Transaction,
        Omit<Transaction, keyof Audit | "to_wallet_id" | "category_id" | "note" | "is_deleted"> &
          AutoAudit & { to_wallet_id?: string | null; category_id?: string | null; note?: string | null; is_deleted?: boolean }
      >;
      budgets: Table<
        Budget,
        Omit<Budget, keyof Audit | "is_deleted"> & AutoAudit & { is_deleted?: boolean }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}