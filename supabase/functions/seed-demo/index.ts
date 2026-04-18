import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);

    const users = [
      { email: "admin@muslimacademy.com", password: "admin123", full_name: "Academy Admin", role: "admin" },
      { email: "teacher1@muslimacademy.com", password: "teacher123", full_name: "Aisha Khan", role: "teacher", subject: "Mathematics" },
      { email: "student1@muslimacademy.com", password: "student123", full_name: "Fatima Ali", role: "student", class: "10", section: "A", roll_number: "STU-001" },
    ];

    const results: any[] = [];
    for (const u of users) {
      // delete any stale auth user with this email
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const stale = list?.users?.find((x) => x.email?.toLowerCase() === u.email);
      if (stale) await admin.auth.admin.deleteUser(stale.id);

      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      });
      if (error) { results.push({ email: u.email, error: error.message }); continue; }
      const uid = data.user.id;

      await admin.from("profiles").upsert(
        { user_id: uid, full_name: u.full_name, role: u.role },
        { onConflict: "user_id" }
      );

      if (u.role === "teacher") {
        await admin.from("teachers").delete().eq("user_id", uid);
        await admin.from("teachers").insert({ user_id: uid, subject: (u as any).subject });
      } else if (u.role === "student") {
        await admin.from("students").delete().eq("user_id", uid);
        await admin.from("students").insert({
          user_id: uid,
          class: (u as any).class,
          section: (u as any).section,
          roll_number: (u as any).roll_number,
        });
      }
      results.push({ email: u.email, ok: true });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
