# Instruction views

Use this reference when producing diagrams or interactive views while creating,
auditing or editing this repository's skills, agent instructions, prompts and
referenced rule documents. Writing and revision rules live in
[AGENTS.md](AGENTS.md#skill-changes).

## Source fidelity

Keep executable instructions and authoritative facts in their canonical text or
record. Each derived view identifies its source, scope and material uncertainties.
Separate observed behavior, assumptions and proposals. Preserve technical terms,
identifiers, permissions, rule strength, business intent and required dependencies.
Show order or guarantees only when the source establishes them. Explanation
quality does not substitute for evidence that required behavior and structure hold.

For visual explanations, prefer a suitable installed skill such as `show-me`
when available. Supply the source model, scope and unknowns. The originating
workflow retains factual correctness, required formats and visual acceptance,
and supplies the view directly when no suitable helper is available.

## Diagrams and images

Use diagrams when relationships, boundaries, order or state are easier to inspect
visually. Show the relevant subjects, rule owners and dependencies; mark unknown
relationships where they appear. Separate overview from reference detail. Each
node represents one role, state or action. Put field lists, predicates and caveats
in keyed adjacent notes; keep conditions that change a relationship with it.

Make the reading path clear. Choose grouping and direction for the relationships;
align related items, give them space and reduce crossing or backtracking edges.
If the overview is still dense, revise its abstraction or split complementary
views rather than shrink the text. Use restrained colour with sufficient
contrast; convey status in text too. Use short, consistent labels and annotations.

## Interactive HTML

Use interactive HTML when changing inputs, comparing alternatives or exploring
branches helps the reader understand a decision. Make inputs, assumptions and
resulting behavior visible. Check the interactions used in the explanation.

## Visual acceptance

Check content and inspect the rendered view at its intended reading size,
including dense branches and long labels. Fix unreadable text, collisions,
clipping and connections that are hard to trace; a successful render alone is
insufficient. Revise grouping, layout or format when needed. State what remains
unverified.
