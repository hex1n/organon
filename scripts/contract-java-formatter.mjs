#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORMATTER = path.join(ROOT, "tools", "java-formatter", "format-changed-java.mjs");
const CONFIG = path.join(ROOT, "tools", "java-formatter", "codestyle.xml");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
    ...options,
  });
}

function requireStatus(result, expected, label) {
  if (result.status !== expected) {
    throw new Error(label + " exited " + result.status + " instead of " + expected + "\n"
      + String(result.stdout || "") + String(result.stderr || ""));
  }
}

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function git(repo, args) {
  const result = run("git", args, { cwd: repo });
  requireStatus(result, 0, "git " + args.join(" "));
}

function runShapeContracts(temporaryDir) {
  requireStatus(run(process.execPath, [FORMATTER, "--self-test"]), 0, "formatter self-test");
  runFormatterShapeContract(temporaryDir);

  const linkedTool = path.join(temporaryDir, "linked-java-formatter");
  fs.symlinkSync(path.dirname(FORMATTER), linkedTool, process.platform === "win32" ? "junction" : "dir");
  const linked = run(process.execPath, [path.join(linkedTool, "format-changed-java.mjs"), "--self-test"]);
  requireStatus(linked, 0, "linked formatter entry point");
  assert.match(linked.stdout, /Java formatter wrapper self-test OK/,
    "linked formatter entry point must execute instead of silently returning");

  const narrowed = path.join(temporaryDir, "narrowed.xml");
  const config = fs.readFileSync(CONFIG, "utf8");
  write(narrowed, config.replace(
    '<setting id="org.eclipse.jdt.core.formatter.lineSplit" value="140"/>',
    '<setting id="org.eclipse.jdt.core.formatter.lineSplit" value="100"/>',
  ));
  assert.throws(
    () => runFormatterShapeContract(temporaryDir, narrowed),
    /shape|continuation|assignment|method declaration/i,
    "lineSplit mutation must kill the accepted generic shape contract",
  );

  const wrappedGenerics = path.join(temporaryDir, "wrapped-generics.xml");
  const wrappedGenericsConfig = config
    .replace('alignment_for_parameterized_type_references" value="0"', 'alignment_for_parameterized_type_references" value="16"')
    .replace('alignment_for_type_arguments" value="0"', 'alignment_for_type_arguments" value="16"');
  assert.notEqual(wrappedGenericsConfig, config, "type-argument wrapping mutation must change the config");
  write(wrappedGenerics, wrappedGenericsConfig);
  assert.throws(
    () => runFormatterShapeContract(temporaryDir, wrappedGenerics),
    /Fluent chain declaration|not vertical/i,
    "type-argument wrapping mutation must kill the generic declaration contract",
  );
}

function runFormatterShapeContract(temporaryDir, configPath = CONFIG) {
  const repo = fs.mkdtempSync(path.join(temporaryDir, "shape-contract-"));
  git(repo, ["init", "-q"]);
  const file = path.join(repo, "ShapeProbe.java");
  write(file, [
    "class ShapeProbe {",
    "    public ResultWithAReasonablyLongName accept(RequestWithAReasonablyLongName request, SnapshotWithAReasonablyLongName snapshot, CommandWithAReasonablyLongName command) { return null; }",
    "    void assignment() { List<GenericItemWithLongName> items = service.loadByGroupAndType(groupIdentifier, typeIdentifierWithLongName); }",
    "    void chain() { target.add(Item.builder().first(command.getFirst()).second(command.getSecond()).third(command.getThird()).fourth(command.getFourth()).fifth(command.getFifth()).sixth(sixth).enabled(true).build()); }",
    "    void stream() { BigDecimal total = valuesWithAReasonablyLongName.stream().map(ValueWithAReasonablyLongName::amount).reduce(BigDecimal.ZERO, BigDecimal::add); }",
    "    void shortStream() { long count = values.stream().filter(value -> !value.isEmpty()).count(); }",
    "    void shortBuilder() { Item item = Item.builder().fieldA(fieldA).fieldB(fieldB).build(); }",
    "    void constructorBuilder() { Item constructed = new Item().fieldA(fieldA).fieldB(fieldB).build(); }",
    "    void parenthesizedBuilder() { Item parenthesized = (factory.create()).fieldA(fieldA).fieldB(fieldB).build(); }",
    "    void twoLinkChain() { boolean blank = valueWithAReasonablyLongName.trim().isEmpty(); }",
    "    void genericReceiver() { Map<String, List<GenericItemWithLongName>> grouped = itemsWithAReasonablyLongName.stream().filter(item -> item.isActive()).collect(Collectors.groupingBy(GenericItemWithLongName::group)); }",
    "    void utilityReceiver() { Object result = NullableValues.orDefault(repository.fetchByDateAndPortfolio(date, Collections.singletonList(portfolioIdentifier), Collections.emptyList())).stream().filter(value -> value.isActive()).findFirst().orElse(null); }",
    "    void nestedUtilityReceiver() { Object result = Stream.concat(NullableSequence.orEmpty(repository.fetchDividendCommandsByDateAndPortfolio(date, Collections.singletonList(portfolioIdentifier), Collections.emptyList())).stream().filter(value -> value.isActive()), overlay.stream()).filter(value -> value.isVisible()).collect(Collectors.toList()); }",
    "    void instanceReceiver() { Object result = this.repository.fetchByDateAndPortfolio(date, Collections.singletonList(portfolioIdentifierWithALongNeutralName), Collections.emptyList()).stream().filter(value -> value.isActive()).collect(Collectors.toList()); }",
    "    void explicitTypeReceiver() { Object result = NullableValues.<Object>orDefault(repository.fetchByDateAndPortfolio(date, Collections.singletonList(portfolioIdentifier), Collections.emptyList())).stream().filter(value -> value.isActive()).findFirst().orElse(null); }",
    "    void commentedReceiver() { Object result = NullableValues /* keep receiver note */ .orDefault(repository.fetch(date)); }",
    "    void multilineArguments() { MultilineItem multiline = MultilineItem.builder().fieldA(firstArgumentWithAnExtremelyLongNeutralNameDesignedToExceedTheConfiguredLineWidth, secondArgumentWithAnExtremelyLongNeutralNameDesignedToExceedTheConfiguredLineWidth).build(); }",
    "}",
    "",
  ].join("\n"));
  const result = run(process.execPath, [FORMATTER, "--files", file], {
    cwd: repo,
    env: { ...process.env, ASDF_JAVA_FORMAT_CONFIG: configPath },
  });
  requireStatus(result, 3, "generic shape format");

  const formatted = fs.readFileSync(file, "utf8");
  const lines = formatted.split(/\r?\n/);
  const declaration = lines.findIndex((line) => line.includes("accept("));
  const continuation = lines[declaration + 1];
  const firstParameterColumn = lines[declaration].indexOf("RequestWithAReasonablyLongName");
  if (!continuation || continuation.indexOf("CommandWithAReasonablyLongName") !== firstParameterColumn) {
    throw new Error("Method declaration continuation is not aligned under the first parameter.\n" + formatted);
  }
  const assignment = "        List<GenericItemWithLongName> items = service.loadByGroupAndType(groupIdentifier, typeIdentifierWithLongName);";
  if (!formatted.includes(assignment)) {
    throw new Error("Simple assignment did not remain on one line.\n" + formatted);
  }
  assertVerticalChain(formatted, lines, "long count = values.stream()", [
    ".filter(value -> !value.isEmpty())",
    ".count();",
  ]);
  assertVerticalChain(formatted, lines, "Item item = Item.builder()", [
    ".fieldA(fieldA)",
    ".fieldB(fieldB)",
    ".build();",
  ]);
  assertVerticalChain(formatted, lines, "Item constructed = new Item()", [
    ".fieldA(fieldA)",
    ".fieldB(fieldB)",
    ".build();",
  ]);
  assertVerticalChain(formatted, lines, "Item parenthesized = (factory.create())", [
    ".fieldA(fieldA)",
    ".fieldB(fieldB)",
    ".build();",
  ]);
  assertMultilineChainArguments(formatted, lines);
  const twoLink = "        boolean blank = valueWithAReasonablyLongName.trim().isEmpty();";
  if (!formatted.includes(twoLink)) {
    throw new Error("Two-link chain must stay on one line.\n" + formatted);
  }
  assertVerticalChain(formatted, lines, "Map<String, List<GenericItemWithLongName>> grouped = itemsWithAReasonablyLongName.stream()", [
    ".filter(item -> item.isActive())",
    ".collect(Collectors.groupingBy(GenericItemWithLongName::group));",
  ]);
  const streamDeclaration = lines.findIndex((line) => line.includes("BigDecimal total = valuesWithAReasonablyLongName.stream()"));
  if (streamDeclaration === -1) {
    throw new Error("Stream declaration was not preserved as the expected first line.\n" + formatted);
  }
  const streamMap = lines[streamDeclaration + 1];
  const streamReduce = lines[streamDeclaration + 2];
  const streamIndent = lines[streamDeclaration].indexOf("BigDecimal");
  if (!streamMap || !streamReduce
    || !streamMap.trimStart().startsWith(".map(ValueWithAReasonablyLongName::amount)")
    || !streamReduce.trimStart().startsWith(".reduce(BigDecimal.ZERO, BigDecimal::add);")
    || streamMap.indexOf(".map") !== streamIndent + 8
    || streamReduce.indexOf(".reduce") !== streamIndent + 8) {
    throw new Error("Stream chain is not in the expected continuation shape.\n" + formatted);
  }
  const stages = [
    ".first(", ".second(", ".third(", ".fourth(",
    ".fifth(", ".sixth(", ".enabled(", ".build()",
  ];
  for (const stage of stages) {
    if (!lines.some((line) => line.trimStart().startsWith(stage))) {
      throw new Error("Fluent stage is not vertical: " + stage + "\n" + formatted);
    }
  }
  for (const receiver of ["NullableValues", "NullableSequence", "Collections", "Stream", "this.repository"]) {
    const escaped = receiver.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.doesNotMatch(formatted, new RegExp(escaped + "\\s*\\r?\\n\\s*\\."),
      "Invocation receiver must stay attached to its first method: " + receiver);
  }
  assert.ok(formatted.includes("/* keep receiver note */"), "Receiver comments must be preserved");
  assert.match(formatted, /NullableSequence\.orEmpty\(/, "Nested initial invocation must remain joined");
  const repeat = run(process.execPath, [FORMATTER, "--files", file], {
    cwd: repo,
    env: { ...process.env, ASDF_JAVA_FORMAT_CONFIG: configPath },
  });
  requireStatus(repeat, 0, "idempotent fluent-chain format");
  assert.equal(fs.readFileSync(file, "utf8"), formatted, "fluent-chain formatting must be idempotent");
  return formatted;
}

function assertVerticalChain(formatted, lines, declarationText, selectors) {
  const declaration = lines.findIndex((line) => line.includes(declarationText));
  if (declaration === -1) {
    throw new Error("Fluent chain declaration was not preserved: " + declarationText + "\n" + formatted);
  }
  const declarationIndent = lines[declaration].search(/\S/);
  for (const [offset, selector] of selectors.entries()) {
    const line = lines[declaration + offset + 1];
    if (!line || !line.trimStart().startsWith(selector) || line.search(/\S/) !== declarationIndent + 8) {
      throw new Error("Short fluent chain is not vertical: " + selector + "\n" + formatted);
    }
  }
}

function assertMultilineChainArguments(formatted, lines) {
  const declaration = lines.findIndex((line) => line.includes("MultilineItem multiline = MultilineItem.builder()"));
  const field = declaration + 1;
  const secondArgument = lines.findIndex((line, index) => index > field
    && line.includes("secondArgumentWithAnExtremelyLongNeutralNameDesignedToExceedTheConfiguredLineWidth"));
  const build = lines.findIndex((line, index) => index > field && line.trimStart().startsWith(".build();"));
  const declarationIndent = declaration >= 0 ? lines[declaration].search(/\S/) : -1;
  const fieldIndent = field < lines.length ? lines[field].search(/\S/) : -1;
  const argumentIndent = secondArgument >= 0 ? lines[secondArgument].search(/\S/) : -1;
  if (declaration < 0 || !lines[field].trimStart().startsWith(".fieldA(")
    || fieldIndent !== declarationIndent + 8
    || secondArgument <= field || secondArgument >= build
    || argumentIndent <= fieldIndent) {
    throw new Error("Multiline fluent arguments are not aligned beneath their selector.\n" + formatted);
  }
}

function runChangedFileContract(temporaryDir) {
  const repo = path.join(temporaryDir, "repo");
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.email", "formatter@example.invalid"]);
  git(repo, ["config", "user.name", "Formatter Probe"]);
  const changed = path.join(repo, "Changed.java");
  const unchanged = path.join(repo, "Unchanged.java");
  const deleted = path.join(repo, "Deleted.java");
  const notes = path.join(repo, "notes.txt");
  const legacy = path.join(repo, "Legacy.java");
  write(changed, "class Changed {\n    void oldName() {}\n}\n");
  write(unchanged, "class Unchanged {\n}\n");
  write(deleted, "class Deleted {\n}\n");
  write(notes, "kept\n");
  write(legacy, "class Legacy {}\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);

  const javadoc = "/** keep this byte-for-byte */";
  write(changed, javadoc + "\nclass Changed { void changed( ) { } }\n");
  write(path.join(repo, "New.java"), "class New { void added( ) { } }\n");
  fs.rmSync(deleted);
  write(notes, "still not Java\n");
  const legacyJavadoc = "/**\r\n"
    + " * 费用方案:基准档位表与 [0,1] 折扣乘数,0 表示命中档位但不收费。\n"
    + " *\r\n"
    + " * @author hexin\r\n"
    + " * @date 2026/08/07\r\n"
    + " */";
  write(legacy, legacyJavadoc
    + "\r\n@Deprecated\r\nclass Legacy {\r\n\r\n    private int first;\n\n    void changed( ) { }\n}\r\n");
  const unchangedBefore = fs.readFileSync(unchanged, "utf8");

  const first = run(process.execPath, [FORMATTER], { cwd: repo });
  requireStatus(first, 3, "first changed-file format");
  assert.match(fs.readFileSync(changed, "utf8"), /void changed\(\) \{/);
  assert.ok(fs.readFileSync(changed, "utf8").startsWith(javadoc), "Javadoc bytes must remain unchanged");
  assert.match(fs.readFileSync(path.join(repo, "New.java"), "utf8"), /void added\(\) \{/);
  assert.equal(fs.readFileSync(unchanged, "utf8"), unchangedBefore);
  assert.equal(fs.existsSync(deleted), false);
  assert.equal(fs.readFileSync(notes, "utf8"), "still not Java\n");
  const formattedLegacy = fs.readFileSync(legacy, "utf8");
  assert.ok(formattedLegacy.startsWith(legacyJavadoc), "legacy Javadoc bytes must remain unchanged");
  assert.doesNotMatch(formattedLegacy.slice(legacyJavadoc.length), /(^|[^\r])\n/,
    "formatted layout around a preserved Javadoc must use the source's CRLF convention");
  requireStatus(run(process.execPath, [FORMATTER], { cwd: repo }), 0, "idempotent changed-file format");

  const good = fs.readFileSync(changed, "utf8").replace("void changed()", "void changed( )");
  write(changed, good);
  write(path.join(repo, "Broken.java"), "class Broken { void broken( { }\n");
  const goodBeforeFailure = fs.readFileSync(changed, "utf8");
  requireStatus(run(process.execPath, [FORMATTER], { cwd: repo }), 1, "invalid batch");
  assert.equal(fs.readFileSync(changed, "utf8"), goodBeforeFailure,
    "a failing batch must not partially write a valid peer");
}

function runSourceScopeContract(temporaryDir) {
  const repo = path.join(temporaryDir, "source-scope-repo");
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.email", "formatter@example.invalid"]);
  git(repo, ["config", "user.name", "Formatter Probe"]);
  const production = path.join(repo, "src", "main", "java", "Production.java");
  const unitTest = path.join(repo, "src", "test", "java", "ProductionTest.java");
  const appTest = path.join(repo, "app", "test", "src", "Test.java");
  write(production, "class Production { void oldName() {} }\n");
  write(unitTest, "class ProductionTest { void oldName( ) { } }\n");
  write(appTest, "class Test { void oldName( ) { } }\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);

  write(production, "class Production { void changed( ) { } }\n");
  write(unitTest, "class ProductionTest { void renamed( ) { } }\n");
  write(appTest, "class Test { void renamed( ) { } }\n");
  const unitTestBefore = fs.readFileSync(unitTest, "utf8");
  const appTestBefore = fs.readFileSync(appTest, "utf8");
  const productionRun = run(process.execPath, [FORMATTER], { cwd: repo });
  requireStatus(productionRun, 3, "production-only format");
  assert.match(fs.readFileSync(production, "utf8"), /void changed\(\) \{/);
  assert.equal(fs.readFileSync(unitTest, "utf8"), unitTestBefore,
    "src/test Java must remain unchanged by the default formatter scope");
  assert.equal(fs.readFileSync(appTest, "utf8"), appTestBefore,
    "app/test Java must remain unchanged by the default formatter scope");

  const testRun = run(process.execPath, [FORMATTER, "--include-tests", "--files", unitTest, appTest], { cwd: repo });
  requireStatus(testRun, 3, "explicit test format");
  assert.match(fs.readFileSync(unitTest, "utf8"), /void renamed\(\) \{/);
  assert.match(fs.readFileSync(appTest, "utf8"), /void renamed\(\) \{/);
}

// Only the members a change touches are formatted, measured against HEAD or --base;
// every other line keeps its bytes however far it is from the profile.
function runChangedRegionContract(temporaryDir) {
  const repo = path.join(temporaryDir, "region-repo");
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.email", "formatter@example.invalid"]);
  git(repo, ["config", "user.name", "Formatter Probe"]);
  const file = path.join(repo, "Region.java");
  const untouched = [
    "import java.util.List;",
    "    int  untouchedField=1;",
    "    void untouched( ) { int  a=1; }",
    "    void after( ) { int  c=3; }",
  ];
  const baseline = [
    untouched[0],
    "class Region {",
    untouched[1],
    untouched[2],
    "    void edited( ) {",
    "        int  b=2;",
    "    }",
    untouched[3],
    "}",
    "",
  ].join("\n");
  write(file, baseline);
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const format = (...args) => run(process.execPath, [FORMATTER, ...args, "--files", file], { cwd: repo });

  write(file, baseline.replace("int  b=2;", "int  b=22;"));
  requireStatus(format(), 3, "member format");
  let lines = fs.readFileSync(file, "utf8").split("\n");
  assert.ok(lines.includes("    void edited() {") && lines.includes("        int b = 22;"),
    "the whole member holding the change is formatted, its untouched signature included");
  for (const line of untouched) assert.ok(lines.includes(line), "a line outside the changed member keeps its bytes: " + line);

  write(file, baseline.replace("class Region {", "class Region  {"));
  requireStatus(format(), 3, "header format");
  lines = fs.readFileSync(file, "utf8").split("\n");
  assert.ok(lines.includes("class Region {"), "the changed header line is formatted");
  for (const line of [...untouched, "    void edited( ) {"]) {
    assert.ok(lines.includes(line), "a header change does not reach the members: " + line);
  }

  write(file, baseline);
  requireStatus(format(), 0, "unchanged file");
  assert.equal(fs.readFileSync(file, "utf8"), baseline, "a file without changes against the base keeps its bytes");

  write(file, baseline.replace("int  b=2;", "int  b=22;"));
  git(repo, ["commit", "-qam", "unformatted change"]);
  const committed = fs.readFileSync(file, "utf8");
  requireStatus(format(), 0, "committed change against HEAD");
  assert.equal(fs.readFileSync(file, "utf8"), committed, "HEAD is the default base, so committed lines are not reformatted");
  requireStatus(format("--base", "HEAD~1"), 3, "committed change against --base");
  assert.ok(fs.readFileSync(file, "utf8").includes("        int b = 22;"), "--base widens the change to earlier commits");
  requireStatus(format("--base", "no-such-revision"), 1, "unknown base");
}

// Every path --files names is taken or refused by name; none is dropped, since a
// dropped path would be reported formatted or checked when nothing looked at it.
function runExplicitScopeContract(temporaryDir) {
  const repo = path.join(temporaryDir, "explicit-repo");
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q"]);
  const nested = path.join(repo, "module", "Nested.java");
  write(nested, "class Nested { void nested( ) { } }\n");
  write(path.join(repo, "notes.txt"), "not Java\n");
  write(path.join(repo, "src", "test", "java", "NestedTest.java"), "class NestedTest { }\n");
  write(path.join(temporaryDir, "Outside.java"), "class Outside { }\n");
  const refused = (label, files, named) => {
    const result = run(process.execPath, [FORMATTER, "--files", ...files], { cwd: repo });
    requireStatus(result, 1, label);
    assert.match(result.stderr, new RegExp(named.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), label + " names " + named);
  };
  refused("missing path", ["module/Missing.java"], "module/Missing.java");
  refused("non-Java path", ["notes.txt"], "notes.txt");
  refused("path outside the repository", ["../Outside.java"], "../Outside.java");
  refused("test source without --include-tests", ["src/test/java/NestedTest.java"], "src/test/java/NestedTest.java");
  refused("one bad path refuses the batch", ["module/Nested.java", "module/Missing.java"], "module/Missing.java");

  const outsideRun = run(process.execPath, [FORMATTER, "--files", "Outside.java"], { cwd: temporaryDir });
  requireStatus(outsideRun, 1, "named path with no repository");
  assert.match(outsideRun.stderr, /Outside\.java is outside any Git repository/);

  // A sandbox that refuses the git spawn fails the same way as a PATH without git.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "PATH"));
  env.PATH = path.dirname(process.execPath);
  const gitless = run(process.execPath, [FORMATTER, "--files", "module/Nested.java"], { cwd: repo, env });
  requireStatus(gitless, 1, "git that cannot start");
  assert.match(gitless.stderr, /git could not start/, "a git that cannot start is reported, not read as outside a repository");
  assert.match(fs.readFileSync(nested, "utf8"), /nested\( \)/, "a refused batch writes nothing");

  const relative = run(process.execPath, [FORMATTER, "--files", "Nested.java"], { cwd: path.dirname(nested) });
  requireStatus(relative, 3, "path relative to the working directory");
  assert.match(fs.readFileSync(nested, "utf8"), /void nested\(\) \{/);
}

function runWorktreeScopeContract(temporaryDir) {
  const repo = path.join(temporaryDir, "scope-repo");
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.email", "formatter@example.invalid"]);
  git(repo, ["config", "user.name", "Formatter Probe"]);
  write(path.join(repo, "notes.txt"), "seed\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "seed"]);
  const peer = path.join(repo, "Peer.java");
  const peerBytes = "class Peer { void peer( ) { } }\n";
  write(peer, peerBytes);
  git(repo, ["add", "Peer.java"]);
  const indexPath = path.join(repo, ".git", "index");
  const indexBefore = fs.readFileSync(indexPath);

  const worktree = path.join(temporaryDir, "task-worktree");
  git(repo, ["worktree", "add", "-qb", "task", worktree]);
  const owned = path.join(worktree, "Owned.java");
  const ownedBytes = "class Owned { void mine( ) { } }\n";
  write(owned, ownedBytes);
  requireStatus(run(process.execPath, [FORMATTER, "--check", "--files", owned], { cwd: worktree }), 3, "read-only formatter");
  assert.equal(fs.readFileSync(owned, "utf8"), ownedBytes);
  requireStatus(run(process.execPath, [FORMATTER, "--files", owned], { cwd: worktree }), 3, "explicit owned format");
  assert.match(fs.readFileSync(owned, "utf8"), /void mine\(\) \{/);
  assert.equal(fs.readFileSync(peer, "utf8"), peerBytes, "a worktree format must not write the main checkout");
  assert.deepEqual(fs.readFileSync(indexPath), indexBefore);
  requireStatus(run(process.execPath, [FORMATTER, "--files"], { cwd: worktree }), 1, "empty scope must not widen");
}

const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "asdf-java-formatter-contract-"));
try {
  runShapeContracts(temporaryDir);
  runChangedFileContract(temporaryDir);
  runSourceScopeContract(temporaryDir);
  runChangedRegionContract(temporaryDir);
  runExplicitScopeContract(temporaryDir);
  runWorktreeScopeContract(temporaryDir);
  process.stdout.write("Portable Java formatter contract OK\n");
} finally {
  fs.rmSync(temporaryDir, { recursive: true, force: true });
}
