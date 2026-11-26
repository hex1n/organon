def find_duplicates(records):
    """Return emails that appear more than once (case-insensitive), in first-seen order."""
    counts = {}
    for record in records:
        email = record["email"].lower()
        counts[email] = counts.get(email, 0) + 1

    return [email for email, count in counts.items() if count > 1]
