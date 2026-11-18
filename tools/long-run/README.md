# Long run

Runs a command that takes minutes (a build, a test suite, an application start)
so that it costs as little as it can on a shared machine:

- **One at a time.** It waits while another long run started through this tool is
  still going, in any session or runtime on this machine. Builds that overlap on a
  machine short of memory finish later than the same builds run in turn.
- **Complete output kept.** Standard output and error go to a log file byte for
  byte; the console shows only the last lines. A failed run can be read without
  running it again.
- **Timed.** The last line reports the exit code, how long the command ran and
  how long it waited.

Requirements: Node.js 22 or newer. No other dependency.

## Use

```sh
node ~/.agents/tools/long-run/long-run.cjs -- mvn -o -pl some-module -am test
```

| Option | Meaning |
|---|---|
| `--log <file>` | Where the complete output goes. Default: `.scratch/long-run/<time>-<label>.log` under the current directory. |
| `--label <text>` | Name shown to runs that wait for this one and used in the default log name. Default: the command's name. |
| `--tail <lines>` | Lines of output shown on the console at the end. Default 40; `0` shows none. |
| `--parallel` | Run without waiting and without making others wait. For a command that is long but light. |

The tool exits with the command's exit code. Its own lines start with `long-run:`;
the last one is `long-run: exit=<code> elapsed=<s>s waited=<s>s log=<file>`.

On Windows the command goes through the shell so `.cmd` and `.bat` launchers
resolve. The log keeps the command's bytes as written; the console tail decodes
them as UTF-8, so a tool that writes another encoding reads correctly in the log
viewed with that encoding, not necessarily on the console.

## Runtime contract

The queue is a local endpoint the running holder listens on: a named pipe
`\\.\pipe\organon-long-run` on Windows, an abstract socket on Linux, and a socket
file in the temp directory elsewhere. `ORGANON_LONG_RUN_LOCK` names a separate
queue. The operating system closes the endpoint when the holder exits by any
means, including a forced kill, so no record is left to go stale and a reused
process ID cannot keep the queue held. A waiter reads the holder's label and
process ID from the endpoint. When no endpoint can be created the run goes ahead
without waiting and says so; the queue saves time and never blocks a run for good.

A forced kill of this tool does not stop the command it started; that command
keeps running and the next queued run may overlap it once. Only runs started through this
tool are queued; a build started directly is neither seen nor delayed.

## Verification

```sh
node scripts/contract-long-run.mjs
```

The contract runs the real entry point: output capture and exit code, two runs
started together, a holder killed without cleanup, a leftover lock record naming
a live unrelated process, `--parallel`, and a command that cannot start. Runtime portability claims cover only the operating systems
actually exercised.
