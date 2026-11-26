import random, time
from dedupe import find_duplicates

def make(n, seed=1):
    rnd = random.Random(seed)
    return [{"email": f"user{rnd.randrange(n)}@Example.com"} for _ in range(n)]

if __name__ == "__main__":
    import sys
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    data = make(n)
    t = time.perf_counter(); out = find_duplicates(data); dt = time.perf_counter() - t
    print(f"n={n} dups={len(out)} seconds={dt:.3f}")
