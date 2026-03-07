# Smart Notes Email Hardening Guide

To ensure your emails from `smart@notes.biz.id` are delivered successfully and don't end up in spam, follow these two critical sections.

## 1. DNS Verification (Resend Side)

In your [Resend Dashboard](https://resend.com/domains), you must add your domain `notes.biz.id` and verify it by adding these types of records to your DNS provider (Cloudflare, Namecheap, etc.):

- **SPF (Sender Policy Framework)**: Tells other mail servers that Resend is allowed to send email for you.
- **DKIM (DomainKeys Identified Mail)**: Adds a digital signature to your emails.
- **DMARC**: A policy that tells servers what to do if SPF/DKIM fails. (Recommended: `v=DMARC1; p=none;`)

> [!IMPORTANT]
> Without these, your emails may be blocked by Gmail or Outlook.

---

## 2. Branded Email Templates (Supabase Side)

Go to **Supabase Dashboard -> Authentication -> Email Templates**. Update each template with the following branded HTML:

### A. Confirm Signup (Konfirmasi Pendaftaran)
**Subject**: `Konfirmasi Akun Smart Notes Anda`
[Get HTML from: email_templates/confirm_email.html](file:///Users/bayu/Documents/MyNotes/email_templates/confirm_email.html)

### B. Reset Password
**Subject**: `Reset Kata Sandi Smart Notes`
[Get HTML from: email_templates/reset_password.html](file:///Users/bayu/Documents/MyNotes/email_templates/reset_password.html)

### C. Magic Link (If Enabled)
**Subject**: `Masuk ke Smart Notes`
[Get HTML from: email_templates/magic_link.html](file:///Users/bayu/Documents/MyNotes/email_templates/magic_link.html)

---

## 3. Best Practices for "notes.biz.id"
- Keep the **Sender Name** as: `Smart Notes`
- Keep the **Sender Email** as: `smart@notes.biz.id`
- Ensure all links in the templates use the `{{ .ConfirmationURL }}` placeholder correctly.
