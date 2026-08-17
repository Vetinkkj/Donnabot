import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    storeId: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      storeId: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    storeId: string;
    role: string;
  }
}
