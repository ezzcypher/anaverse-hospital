import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "@/app/admin/_components/login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">
        Anaverse
      </p>
      <h1 className="mt-3 font-display text-2xl font-medium tracking-tightest">
        Operator sign-in
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Restricted area. Appointment and message records are confidential.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
