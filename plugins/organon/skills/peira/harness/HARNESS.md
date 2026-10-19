# Harness stage

Write the project's verification harness: the files that let an agent reading the
repository cold launch the system, judge whether a running instance is usable, drive
it the way its users do, capture evidence, and clean up. The harness is project fact,
kept under `docs/verify/` in the repository, and it is finished only after its own
instructions have run once end to end.

Use the repository's language for prose; keep commands, paths, selectors, and status
tokens verbatim. Secrets never enter the harness: name the configuration file or
environment variable that carries them.

## 1. Interview the repository

Establish each fact from source and configuration, with the file that states it:

- the primary surface: web UI, HTTP or RPC API, CLI or TUI, desktop, mobile, library,
  or a worker driven by queues or schedules. List secondary surfaces; draft recipes
  only for the primary one unless asked;
- how the system starts: build and run commands, the configuration profile a local
  run needs, ports, and every dependency the local run reaches (databases, caches,
  registries, brokers, third-party services, private artifact repositories);
- how an agent can drive it: the project's own harness first (test clients, scripts,
  fixtures, seed and migration tools), then generic recipes (HTTP client, browser
  automation, PTY, direct invocation);
- what evidence the surface yields: responses, stored state, logs, files,
  screenshots, exit codes;
- whether several instances can run side by side: ports, data directories,
  namespaces.

Fix a build the repository itself breaks before writing the harness; a recipe for
a build that does not compile documents nothing. A build that only the writing
environment cannot run (an unreachable artifact repository, a missing service) is a
blocker, not a reason to stop: record it with what would lift it, and continue. A
stand-in that lets the build or the start proceed (a stub artifact generated outside
the repository, a local service answering for an external one) is recorded with every
behaviour it removes, so a run on it never passes for a run on the real thing.

Read an existing `docs/verify/` before writing: refresh the entries the code has
outdated and keep the rest.

## 2. Write `docs/verify/HARNESS.md`

Five sections in this order, each giving a command or predicate an agent can execute
as written.

Status belongs to claims, not to sections. Every statement that something works,
fails, or is required carries its own status: `verified YYYY-MM-DD` when a run in
this task observed it, or `derived from source` with the file and line it rests on
and, where one exists, the blocker that kept it from running. A section heading may
summarize the claims under it, but it never vouches for a sentence the run did not
exercise, and prose outside any section still needs a status: a reader trusts the
nearest label, so an unlabelled or broadly labelled sentence reads as checked.
Requirements and failures read from configuration (a JVM flag, a version pin, a
default value) are the claims most easily written as fact; they stay derived until a
run shows them.

| Section | Content |
|---|---|
| Launch | Build and start commands for a local run from an empty data directory; the readiness predicate, which is an endpoint, log line, or file that appears only once the system can serve; teardown. Each dependency the local run reaches and how it is provided: a local service, a container, a declared double, or a blocker. |
| Doctor | Read-only checks that decide whether an already running instance is worth driving: identity (version, build, profile), reachability, dependency health. No writes. |
| Drive | One recipe per surface: how to reach it and send a request, action, or command, using identifiers from the repository (routes, selectors, test IDs, CLI flags). Doubles only at boundaries production already treats as replaceable. |
| Evidence | What to capture for a claim on this surface and the command that produces each item: responses, state reads, logs, screenshots. Evidence lands in the task's evidence directory, not in the repository. |
| Cleanup | What a run leaves behind and the command that removes only what the run created. Evidence survives cleanup. |

## 3. Write `docs/verify/features/`

`index.md` lists each feature file with one line on the outcome it covers. One file
per key feature, three to five at first, each with:

- **Reach:** the entry and preconditions, including the data the feature needs;
- **Drive:** the exact actions or requests, in order;
- **End state:** the observable result that shows the feature worked, read from
  where the system stores or reports it, never from the request alone;
- **Gotchas:** timing, ordering, environment, and data traps that make a correct run
  look wrong or a wrong run look right.

A feature file never weakens a journey to make it pass; a step that cannot run is
recorded as a gap.

## 4. Prove the harness

Run the harness as written, once, from a shell that carries no state from the
writing session: launch, doctor, drive one feature, capture its evidence, clean up,
and confirm the evidence still exists. Fix the harness where the run deviated and run
again. Keep the run's commands and output with the task's evidence; the harness
points to them.

A rejection path that ran is `verified` for that path and leaves the end state
`derived from source`. A feature left undriven names
the attempt that failed and where; a reason read from source alone is a guess, and
the first attempt often fails somewhere else. Anything run only against a
stand-in, or not run at all, stays `derived from source`. A harness whose Launch
could not run says so in its first line, with the blocker.

## 5. Deliver

Deliver the harness files, the proof run's result, which claims are `verified` and
which `derived from source`, and each blocker with what would lift it.
Name the conditions that call for harness mode again: a changed surface, startup,
or dependency.
