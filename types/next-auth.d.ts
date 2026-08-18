import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    storeId: string;
    role: string;
    isPlatformAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      storeId: string;
      role: string;
      isPlatformAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    storeId: string;
    role: string;
    isPlatformAdmin: boolean;
  }
}
