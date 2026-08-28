# Architect Agent continuation — emit handoff, then stop

Paste this section into the **Listen to Architect Agent** Cursor automation (in addition to existing repo/PR rules).

This is how every future app gets a **new** platform pipeline without the coding agent deploying.

## After every Next.js scaffold or platform-relevant follow-up

1. Ensure `docs/devops-handoff.json` exists in **this app’s** repo (update it if `env_public` / secret key lists changed).
2. Post the **same JSON** in Slack `#ceo` as a fenced `json` block with `"type": "devops_handoff"`.
3. Point humans/n8n at `docs/N8N_DEVOPS_PROMPT.md` (copy-paste prompt for the provisioner).
4. **Stop.** Do not create Cloudflare records, Railway projects, Infisical secrets, or production databases. Do not merge PRs. Do not put real secrets in git or Slack.

The n8n **Provision App Pipeline** continues from that JSON:

- Subdomain `{project_key}.bitbirr.net` on Cloudflare
- Railway service + custom domain
- Database on `https://db.jigjigapay.com`
- Secrets generated and stored in Infisical (`https://secrets.jigjigapay.com`)
- Railway env synced from Infisical

## `project_key` rules

- Lowercase kebab-case, unique forever, DNS-safe.
- Must not be a reserved hostname (`www`, `n8n`, `db`, `secrets`, `mail`, `api`, `status`, `auth`, `vpn`).
- Usually matches the GitHub repo name (`bitbirr/invoice-creation-app` → `invoice-creation-app`).

## Non-Next apps

If `app_kind` is not `nextjs`, still emit `devops_handoff` with an honest `app_kind` and `db.migrate` (or omit migrate). Do not invent a second undocumented pipeline.
