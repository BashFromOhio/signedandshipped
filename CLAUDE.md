# signedandshipped

Signed & Shipped: a Mobile DevOps interview training game (static site on GitHub Pages) plus its reference repo.

- Game: `index.html` (layout + styles), `data.js` (all content), `app.js` (engine), `repo.js` (generated bundle of the reference repo for the in-game browser). No build step; open `index.html`.
- Reference repo: `reference/routeready-mobile-devops/`. Its `local/` scripts + `docs/local/` guides run real Android/iOS/React Native apps locally with a toolchain isolated in `.tools/`.
- After changing anything under `reference/routeready-mobile-devops/`, regenerate the bundle from the repo root: `node tools/bundle-repo.js reference/routeready-mobile-devops repo.js`.
- `main` is protected: work on a branch and open a PR.
- Never commit `.tools/`, `.secrets/`, `.drills/`, keystores or tokens.
- Verify the local kit end to end with the `/verify-local` command (`.claude/commands/verify-local.md`).
