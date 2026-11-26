# Guards

Establish each guard's real entry, owner and oracle:

- **Real entry:** the production path that delivers the illegal shape. A value
  that could theoretically be absent, or that a sample happens to lack, is not an
  entry; a model, database or upstream constraint may already exclude it.
- **Owner:** the database, model or constructor, input boundary or module that
  owns the invariant. Establish which operations the guard can reject or skip
  and which obligations remain on either branch. Reuse an invariant upstream
  already establishes. When a guard only keeps parallel maps, parameters or
  indexes consistent, merge them
  into one type so the contradiction cannot be expressed. Keep backfill,
  migration and repair equalities in SQL, deployment checks or a one-off gate,
  off the business path.
- **Oracle:** a production-reachable case whose test fails when the guard is
  removed or returns the wrong error code. Removing or relaxing a guard needs the
  inverse: the entry is gone or the owner enforces the rule, and the owning test
  still passes on the required behavior.

Remove a guard that lacks these answers, or reshape the interface instead.
Report the answers for each kept guard; one that can be neither justified nor
removed goes to the user's decision, including a guard the user asked for.
