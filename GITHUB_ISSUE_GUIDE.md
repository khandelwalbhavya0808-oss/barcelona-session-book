# GitHub Issue Guide

Welcome to the **Barcelona Session Book** repository! We appreciate your interest in contributing and helping us make this project better. To ensure a smooth process for triaging and resolving issues, please follow these guidelines when opening issues on GitHub.

---

## 🔍 Before Opening an Issue

Before creating a new issue, please complete the following checklist:

1. **Search Existing Issues:** Check both [Open](https://github.com/your-username/barcelona-session-book/issues) and [Closed](https://github.com/your-username/barcelona-session-book/issues?q=is%3Aissue+is%3Aclosed) issues to see if someone has already reported the same bug or requested the same feature.
2. **Read the Docs:** Check our main [README.md](README.md) and database/Supabase guidelines to ensure it's not a setup or configuration issue.
3. **Verify Local Environment:** Make sure you are running the recommended versions (e.g., Docker, Bun/Node.js) and that your local database is up-to-date by running `supabase db reset`.

---

## 🐛 Reporting a Bug

To help us fix the issue as quickly as possible, please provide a clear and detailed description. A good bug report should include:

### 1. Title
Use a concise, descriptive title that starts with a category tag, e.g., `[Bug] Client role not upgrading on booking` or `[UI] Session calendar elements overlapping on mobile`.

### 2. Description
Explain the bug clearly. What is happening, and what did you expect to happen instead?

### 3. Steps to Reproduce
Provide step-by-step instructions to reproduce the issue:
1. Start the local server with `bun dev` (or `npm run dev`).
2. Navigate to `http://localhost:3000`.
3. Click on the "Book Session" CTA.
4. Try to book an overlapping time slot.
5. Observe the error response.

### 4. Logs and Error Messages
Include any relevant console logs, server-side stack traces, or Supabase migration logs:
*   **Browser Console Logs:** Right-click -> Inspect -> Console -> Copy errors.
*   **Server Terminal Logs:** Output from the TanStack Start / Vinxi server.
*   **Supabase Database/Docker Logs:** Run `supabase status` or inspect Docker Desktop container logs.

### 5. Environment Details
*   **OS:** (e.g., Windows 11, macOS Sequoia, Ubuntu 24.04)
*   **Package Manager / Runtime:** (e.g., Bun v1.1.x, Node.js v20.x, npm v10.x)
*   **Browser:** (e.g., Chrome v125, Safari v17, Firefox v126)
*   **Database:** Local Supabase (Docker) or Remote Production

---

## ✨ Proposing a Feature

If you have an idea to improve the Barcelona Session Book, we would love to hear it! When submitting a feature request, please structure it as follows:

1. **Problem Statement:** What pain point does this feature solve?
2. **Proposed Solution:** Describe how the feature should work. What does the UI look like? What new API endpoints or database changes (e.g., tables, triggers) are needed?
3. **Mockups/Screenshots (Optional):** If applicable, attach design sketches or diagrams to help visualize the proposal.
4. **Alternatives Considered:** Any other ways you thought about solving this problem?

---

## 🛠️ Security Disclosures

> [!WARNING]
> If you discover a critical security vulnerability (e.g., Row Level Security (RLS) bypass, private information leak, or authorization bypass), **do not** open a public GitHub issue. 
> Instead, please contact the maintainers directly at security@yourdomain.com to report the vulnerability responsibly.

---

## 🤝 Code of Conduct

When interacting with our community, please be respectful, collaborative, and constructive. All contributors are expected to adhere to standard open-source community guidelines.

Thank you for helping us maintain and improve **Barcelona Session Book**!
