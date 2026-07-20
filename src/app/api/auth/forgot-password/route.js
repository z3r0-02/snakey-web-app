import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { initDb } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { AUTH_ERROR_CODES } from "@/lib/validation";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const limited = enforceRateLimit(request, "forgot-password", { limit: 4, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: AUTH_ERROR_CODES.FORGOT_PASSWORD_MISSING_EMAIL }, { status: 400 });
    }

    const db = await initDb();

    // Look up user
    const result = await db.execute({
      sql: "SELECT id, first_name FROM users WHERE email = ?",
      args: [email],
    });

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Generate a secure random token
      const token = randomBytes(32).toString("hex");

      // Expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // Store token (invalidate any existing unused tokens for this user first)
      await db.execute({
        sql: "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0",
        args: [user.id],
      });

      await db.execute({
        sql: "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        args: [user.id, token, expiresAt],
      });

      // Build reset URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Send email via Resend
      await resend.emails.send({
        from: process.env.RESEND_FROM || "noreply@example.com",
        to: email,
        subject: "Reset your password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="font-size: 1.4rem; color: #0f172a; margin-bottom: 8px;">Reset your password</h2>
            <p style="color: #475569; margin-bottom: 24px;">
              Hi ${user.first_name},<br/><br/>
              We received a request to reset your password. Click the button below to choose a new one.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetUrl}"
               style="display: inline-block; padding: 12px 28px; background: #3ddc84; color: #0f1a12;
                      font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 0.95rem;">
              Reset Password
            </a>
            <p style="color: #94a3b8; font-size: 0.82rem; margin-top: 28px;">
              If you didn't request this, you can safely ignore this email.<br/>
              The link will expire automatically.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({}, { status: 200 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
