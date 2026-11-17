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
- the targets verification can run against, cheapest first: the project's own
  test suites, a local slice holding only the parts under change, a local run of
  the whole system, a shared deployed environment;
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
the repository, a local service answering for an external one) and each effect
switched off for the run go into the target's row as behaviour it removes, so a run
on it never passes for a run on the real thing.

Read an existing `docs/verify/` before writing. Replace each entry the code or a
newer run has superseded with the current one and keep the entries that still
hold: the harness states how the system is verified now, while Git and the proof
runs keep its history.

## 2. Write `docs/verify/HARNESS.md`

A targets table, then five sections in this order, each giving a command or
predicate an agent can execute as written. The table has one row per target,
cheapest first: its entry address, how a caller authenticates, the identity and
tenant that login maps to, what runs as in production, what is replaced or left
out, what it touches that the run does not own, and what it costs (one start, and
each further scenario on that start). Plans cite these rows; a claim is checked
on the cheapest target where everything deciding its outcome is real. A target
serves every module when its parts come from the application's own configuration,
with the module to load as a parameter; one that lists parts by hand serves the
change it was cut for, and its row says so.

The reader is an agent looking up what to run next. Write each entry as the
command or predicate, the output that shows it worked, then its status, and place
it in the section whose question it answers. A section holds one current recipe
per target: Launch covers the targets an agent starts; Doctor, Drive, Evidence,
and Cleanup cover every target. What one run observed (process IDs, run
directories, timestamps, trace IDs, the diagnosis that led to the recipe) stays in
that run's record, linked from the entry's status.

A script a harness command runs is part of the harness: keep it under
`docs/verify/` or where the project keeps its tooling. A command whose script
exists only in a task directory is a blocker, recorded with where the script
needs to live.

Status belongs to claims, not to sections. Every statement that something works,
fails, or is required carries its own status: `verified YYYY-MM-DD` with the record
of the run that observed it on that date, or `derived from source` with the file
and line it rests on and, where one exists, the blocker that kept it from running.
A run in this task verifies with today's date; an entry kept from the earlier
harness keeps its date and record link while the recipe it describes is unchanged.
A section heading may
summarize the claims under it, but it never vouches for a sentence the run did not
exercise, and prose outside any section still needs a status: a reader trusts the
nearest label, so an unlabelled or broadly labelled sentence reads as checked.
Requirements and failures read from configuration (a JVM flag, a version pin, a
default value) are the claims most easily written as fact; they stay derived until a
run shows them.

| Section | Content |
|---|---|
| Launch | Build and start commands from an empty data directory; the readiness predicate, which is an endpoint, log line, or file that appears only once the system can serve; teardown. Each dependency the run reaches and how it is provided: a local service or container the run owns, a declared double, a shared service the user authorized, or a blocker. For a slice: how to name the parts it loads. Scenarios share one start, kept apart by their data, unless they need a different assembly. |
| Doctor | Read-only checks that decide whether an already running instance is worth driving: identity (version, build, profile), reachability, dependency health. No writes. |
| Drive | One recipe per surface, the same on every target that has it: how to reach it and send a request, action, or command, with the operation and its input as parameters and identifiers from the repository (routes, selectors, test IDs, CLI flags). Scenario files call this recipe and the state read under Evidence, so one file runs on every target. Doubles only where the target's row lists them. |
| Evidence | What to capture for a claim on this surface and the command that produces each item: responses, state reads, logs, screenshots. The state read takes its query as a parameter and is the same call on every target. Evidence lands in the task's evidence directory, not in the repository. |
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
and confirm the evidence still exists; the row's cost is what this run measured.
On a shared target, drive a read-only
feature unless the user authorizes writes; authorized writes follow
[business data and ownership](../run/EXECUTION.md#business-data-and-ownership).
Fix the harness where the run deviated and run again. Keep the run's commands and output with the task's evidence; the harness
points to them.

A rejection path that ran is `verified` for that path and leaves the end state
`derived from source`. A feature left undriven names
the attempt that failed and where; a reason read from source alone is a guess, and
the first attempt often fails somewhere else. Anything run only against a
stand-in, or never run under either status rule above, stays `derived from source`. A harness whose Launch
could not run says so in its first line, with the blocker.

## 5. Deliver

Deliver the harness files, the proof run's result, which claims are `verified` and
which `derived from source`, and each blocker with what would lift it.
Name the conditions that call for harness mode again: a changed surface, startup,
or dependency.
