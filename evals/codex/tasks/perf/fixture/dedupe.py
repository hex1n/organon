def find_duplicates(records):
    """Return emails that appear more than once (case-insensitive), in first-seen order."""
    dups = []
    for i, r in enumerate(records):
        e = r["email"].lower()
        if e in dups:
            continue
        for other in records[i + 1:]:
            if other["email"].lower() == e:
                dups.append(e)
                break
    return dups
