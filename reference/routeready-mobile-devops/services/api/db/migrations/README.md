# Database changes: expand → backfill → transition → contract

Every running server version must work against the schema during a rolling deploy (drill 14).

| Step | Example | Ships with |
|---|---|---|
| Expand | `ALTER TABLE route_status ADD COLUMN eta_confidence numeric NULL;` | backend N |
| Backfill | batch job fills the new column | backend N |
| Transition | readers move to the new column; old column still written | backend N+1 |
| Contract | drop the old column **only** when no running version reads it | backend N+2, after the overlap window |

Rolling back an application image does not roll back a schema. Fix forward with a new migration.
