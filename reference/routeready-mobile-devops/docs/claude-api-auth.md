# Using Claude from this lab: API key or workload identity federation?

| Where the code runs | Use |
|---|---|
| The **Signed & Shipped** game artifact on claude.ai | Neither. The page asks Claude on the viewer's own Claude account; no key exists in the page. |
| A browser page you host yourself | **Never** put an API key in browser JavaScript; anyone can read it. Call your own small backend instead. |
| Your backend / a server you run | An API key from Claude Console stored in a secret manager, **or** workload identity federation if that server already gets OIDC tokens from a trusted issuer (cloud workload identity, Kubernetes). |
| GitHub Actions (e.g. AI PR review in this repo) | **Workload identity federation**: register GitHub's OIDC issuer in Claude Console → Keys & access → Workload identity, then add a rule scoped to this repository (and branch/environment). No long-lived key to leak or rotate. |

Why federation for CI: it's the same idea as cloud OIDC in `main.yml`. The job proves *who it is* with a short-lived token instead of holding a password. Scope the rule tightly (one repo, protected branch or environment) so a fork PR can't use it.

Remember the playbook rule: OIDC replaces long-lived cloud/API keys, not App Store Connect keys or signing keystores.

Check the current setup steps in the Claude docs (docs.claude.com) before wiring it up.
