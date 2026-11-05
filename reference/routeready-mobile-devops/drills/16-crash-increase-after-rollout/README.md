# Drill 16: Crash increase after rollout

**Lab:** Either · **Area:** Operate · **Interview priority**

> Like you're 10: The water slide is making kids bump their heads. Turn off the water (flag), stop the line (pause), fix the slide (new build). You can't un-slide the kids already at the bottom.

## 1. Inject (disposable branch only)
In a throwaway branch or sandbox, crashed a flagged code path for a disposable cohort.

## 2. Expected symptom
The new build's crash rate rises compared to baseline.

Example (redacted) output, crash dashboard · lab fixture:
```
release      phase        crash-free sessions   sessions
1.4.2        100%         99.6%                 n=18,400
1.5.0 (57)   day 2 (~2%)  97.1%                 n=640
top crash: ETAConfidenceView.render — 88% of 1.5.0 crashes
segment: eta_confidence_enabled=true cohort only
```

## 3. Diagnose
- Leading hypothesis: The new flagged code path crashes for the enabled cohort
- Next command: Segment by release, OS, device, flag cohort and sample size

## 4. Contain and fix
Turn off eta_confidence_enabled remotely and pause the phased release

## 5. Verify
Crash rate for the installed 1.5.0 population returns to baseline after the flag is off, and a fixed build with a higher number passes

## 6. Complication to rehearse
A variant crashes at launch, before flags are fetched. → The flag can't help: rely on safe cached defaults, pause/halt rollout, ship a replacement build (expedited review if needed), use a server mitigation if the crash comes from a response

## 7. Senior follow-up
**What if the crash occurs before feature flags can be fetched?**

<details><summary>Strong answer</summary>

Flags with server-side defaults won't reach it. Design safe defaults (new features off unless cached on), pause/halt distribution, and ship a replacement binary with a higher build number. If a server response triggers it, change the response.
</details>

## Reference files
- [docs/rollout.md](../../docs/rollout.md)
- [config/feature-flags.json](../../config/feature-flags.json)

## Evidence to save
- [ ] Failing run (link or log)
- [ ] Hypotheses you rejected
- [ ] Commands and their output
- [ ] Fix PR + passing run
- [ ] `incident.md` from [drills/_template/incident.md](../_template/incident.md)
