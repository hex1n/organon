# Derived views

Read this before adding an interaction diagram to an API document. The diagram
shows caller-visible participants and the contract's observable order; it adds
no implementation detail the document itself excludes.

<!-- >>> shared-derived-views -->
For diagrams, separate overview from reference detail. Give each node one role,
state or action with a short, consistent label. Put field lists, predicates and
caveats in keyed adjacent notes; keep conditions that change a relationship with
that relationship. Make the reading path clear: choose grouping and direction
for the relationships, align related items, give them space and reduce crossing
or backtracking edges. If the overview is still dense, revise its abstraction or
split complementary views rather than shrink the text. Use restrained colour
with sufficient contrast; convey status and unknown relationships in text.

Check content and inspect the rendered view at its intended reading size,
including dense branches and long labels. Fix unreadable text, collisions,
clipping and connections that are hard to trace; a successful render alone is
insufficient. Revise grouping, layout or format when needed. Exercise the
interactions used in the explanation and state what remains unverified.
<!-- <<< shared-derived-views -->
