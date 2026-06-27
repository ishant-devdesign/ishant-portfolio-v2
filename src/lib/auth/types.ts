export type AdminContext = {
  user: {
    id: string;
    email: string | undefined;
  } | null;
  isAllowedAdmin: boolean;
  authEnabled: boolean;
};

export type AdminViewMode = "public" | "admin";
