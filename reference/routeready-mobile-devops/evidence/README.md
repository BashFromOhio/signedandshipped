# Evidence

Every claim in an interview should link to something here: a real command output, a CI run, a manifest.

| Claim | Evidence | Status |
|---|---|---|
| PR CI blocks a failing unit test | link to failing run + passing run | NOT STARTED |
| Breaking contract change blocked | `contract-check.txt` from the blocked PR | NOT STARTED |
| Signed iOS build | manifest + IPA checksum, or BLOCKED (no Apple account) | BLOCKED until account |
| Signed Android AAB | manifest + AAB checksum | NOT STARTED |
| Fork cannot read release secrets | canary drill run | NOT STARTED |

Statuses: **IMPLEMENTED** (code exists), **VERIFIED** (ran successfully, output saved), **SIMULATED** (fixture or dry run, says so), **BLOCKED** (missing prerequisite, named).
Never mark a build, signing operation, upload or deployment VERIFIED unless it actually ran.
