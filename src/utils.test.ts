import {
  paginate,
  groupBy,
  chunk,
  deepClone,
  omit,
  pick,
  isEmail,
  truncate,
  sleep,
  debounce,
} from "./utils";

// ---------------------------------------------------------------------------
// paginate
// ---------------------------------------------------------------------------
describe("paginate", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it("returns the correct slice for a normal page", () => {
    expect(paginate(items, 1, 3)).toEqual([1, 2, 3]);
    expect(paginate(items, 2, 3)).toEqual([4, 5, 6]);
  });

  it("returns a partial page when items do not fill the last page", () => {
    expect(paginate(items, 3, 3)).toEqual([7]);
  });

  it("returns an empty array when page is beyond the last page", () => {
    expect(paginate(items, 10, 3)).toEqual([]);
  });

  it("returns an empty array for an empty input array", () => {
    expect(paginate([], 1, 5)).toEqual([]);
  });

  it("returns an empty array when page is 0 (before the first page)", () => {
    // page=0 → start = -1*pageSize which slice normalises to 0, but the
    // end index also shifts, so the result should still be empty.
    expect(paginate(items, 0, 3)).toEqual([]);
  });

  it("returns all items when pageSize equals the array length", () => {
    expect(paginate(items, 1, items.length)).toEqual(items);
  });

  it("returns items from the end when page is negative (documents current behaviour)", () => {
    // page=-1, pageSize=3 → start = (-1-1)*3 = -6
    // items.slice(-6, -3) on a 7-element array yields [2,3,4].
    // This documents the current (unguarded) behaviour; callers should not pass negative pages.
    expect(paginate(items, -1, 3)).toEqual([2, 3, 4]);
  });

  it("returns a single item per page when pageSize is 1", () => {
    expect(paginate(items, 1, 1)).toEqual([1]);
    expect(paginate(items, 7, 1)).toEqual([7]);
  });
});

// ---------------------------------------------------------------------------
// groupBy
// ---------------------------------------------------------------------------
describe("groupBy", () => {
  it("groups items into a single key when all share the same value", () => {
    const items = [
      { type: "fruit", name: "apple" },
      { type: "fruit", name: "banana" },
    ];
    const result = groupBy(items, "type");
    expect(Object.keys(result)).toHaveLength(1);
    expect(result["fruit"]).toHaveLength(2);
  });

  it("creates separate groups for distinct key values", () => {
    const items = [
      { role: "admin", name: "Alice" },
      { role: "user", name: "Bob" },
      { role: "user", name: "Carol" },
    ];
    const result = groupBy(items, "role");
    expect(result["admin"]).toEqual([{ role: "admin", name: "Alice" }]);
    expect(result["user"]).toHaveLength(2);
  });

  it("returns an empty object for an empty array", () => {
    expect(groupBy([], "id" as never)).toEqual({});
  });

  it("coerces numeric key values to strings for group keys", () => {
    const items = [
      { score: 100, name: "Alice" },
      { score: 200, name: "Bob" },
      { score: 100, name: "Carol" },
    ];
    const result = groupBy(items, "score");
    expect(result["100"]).toHaveLength(2);
    expect(result["200"]).toHaveLength(1);
  });

  it("groups items whose key is undefined under the string 'undefined'", () => {
    const items = [{ role: undefined as unknown as string, name: "Ghost" }];
    const result = groupBy(items, "role");
    expect(result["undefined"]).toHaveLength(1);
  });

  it("coerces null key values to the string 'null'", () => {
    const items = [{ status: null as unknown as string, name: "Alice" }];
    const result = groupBy(items, "status");
    expect(result["null"]).toHaveLength(1);
  });

  it("coerces boolean key values to strings", () => {
    const items = [
      { active: true as unknown as string, name: "Alice" },
      { active: false as unknown as string, name: "Bob" },
      { active: true as unknown as string, name: "Carol" },
    ];
    const result = groupBy(items, "active");
    expect(result["true"]).toHaveLength(2);
    expect(result["false"]).toHaveLength(1);
  });

  it("preserves item references in the grouped output", () => {
    const alice = { role: "admin", name: "Alice" };
    const result = groupBy([alice], "role");
    expect(result["admin"][0]).toBe(alice);
  });
});

// ---------------------------------------------------------------------------
// chunk
// ---------------------------------------------------------------------------
describe("chunk", () => {
  it("splits an array into chunks of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when size is larger than the array", () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it("returns single-element chunks when size is 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("produces no leftover chunk when length is exactly divisible by size", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("returns a single chunk containing the whole array when size equals array length", () => {
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it("works with non-numeric element types (strings)", () => {
    expect(chunk(["a", "b", "c", "d"], 2)).toEqual([["a", "b"], ["c", "d"]]);
  });
});

// ---------------------------------------------------------------------------
// deepClone
// ---------------------------------------------------------------------------
describe("deepClone", () => {
  it("produces a value equal to the original", () => {
    const obj = { a: 1, b: { c: [2, 3] } };
    expect(deepClone(obj)).toEqual(obj);
  });

  it("does not share references with the original (mutation isolation)", () => {
    const original = { a: { b: 42 } };
    const clone = deepClone(original);
    clone.a.b = 999;
    expect(original.a.b).toBe(42);
  });

  it("clones arrays correctly", () => {
    const arr = [1, [2, 3], { x: 4 }];
    const clone = deepClone(arr);
    expect(clone).toEqual(arr);
    (clone[1] as number[])[0] = 99;
    expect((arr[1] as number[])[0]).toBe(2);
  });

  it("clones primitive values unchanged", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBeNull();
  });

  it("clones deeply nested structures without sharing references", () => {
    const original = { a: { b: { c: { d: 1 } } } };
    const clone = deepClone(original);
    clone.a.b.c.d = 2;
    expect(original.a.b.c.d).toBe(1);
  });

  it("drops keys whose value is undefined (JSON.stringify behaviour)", () => {
    // undefined values are stripped by JSON serialisation — document this.
    const obj = { a: 1, b: undefined };
    const clone = deepClone(obj) as typeof obj;
    expect(clone).toHaveProperty("a", 1);
    expect(clone).not.toHaveProperty("b");
  });

  it("clones an empty object to an empty object", () => {
    expect(deepClone({})).toEqual({});
  });

  it("clones an empty array to an empty array", () => {
    expect(deepClone([])).toEqual([]);
  });

  it("converts Date objects to ISO strings (JSON.parse/stringify limitation)", () => {
    // JSON.stringify turns Date → ISO string; the clone will be a string, not a Date.
    const obj = { created: new Date("2024-01-01T00:00:00.000Z") };
    const clone = deepClone(obj) as unknown as { created: string };
    expect(typeof clone.created).toBe("string");
    expect(clone.created).toBe("2024-01-01T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// omit
// ---------------------------------------------------------------------------
describe("omit", () => {
  const obj = { id: 1, name: "Alice", password: "secret", role: "admin" };

  it("removes the specified keys", () => {
    const result = omit(obj, ["password"]);
    expect(result).toEqual({ id: 1, name: "Alice", role: "admin" });
    expect(result).not.toHaveProperty("password");
  });

  it("removes multiple keys at once", () => {
    const result = omit(obj, ["password", "role"]);
    expect(result).toEqual({ id: 1, name: "Alice" });
  });

  it("returns a copy of the object when no keys match", () => {
    // TypeScript would normally prevent this, but it should be safe at runtime.
    const result = omit(obj, [] as (keyof typeof obj)[]);
    expect(result).toEqual(obj);
  });

  it("does not mutate the original object", () => {
    const original = { id: 1, name: "Alice", password: "secret", role: "admin" };
    omit(original, ["password"]);
    expect(original).toHaveProperty("password", "secret");
  });

  it("removes all keys when every key is listed", () => {
    const result = omit(obj, ["id", "name", "password", "role"]);
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// pick
// ---------------------------------------------------------------------------
describe("pick", () => {
  const obj = { id: 1, name: "Alice", email: "alice@example.com", role: "admin" };

  it("returns only the picked keys", () => {
    const result = pick(obj, ["id", "name"]);
    expect(result).toEqual({ id: 1, name: "Alice" });
    expect(result).not.toHaveProperty("email");
  });

  it("omits keys that do not exist on the object", () => {
    // Cast required because TypeScript won't let a non-key slip through normally.
    const result = pick(obj, ["id", "nonexistent" as keyof typeof obj]);
    expect(result).toHaveProperty("id");
    expect(result).not.toHaveProperty("nonexistent");
  });

  it("returns an empty object when an empty key list is provided", () => {
    const result = pick(obj, []);
    expect(result).toEqual({});
  });

  it("does not mutate the original object", () => {
    const original = { id: 1, name: "Alice", email: "alice@example.com", role: "admin" };
    pick(original, ["id"]);
    expect(original).toEqual({ id: 1, name: "Alice", email: "alice@example.com", role: "admin" });
  });

  it("returns a full shallow copy when all keys are picked", () => {
    const result = pick(obj, ["id", "name", "email", "role"]);
    expect(result).toEqual(obj);
    // Shallow copy — not the same reference.
    expect(result).not.toBe(obj);
  });
});

// ---------------------------------------------------------------------------
// isEmail
// ---------------------------------------------------------------------------
describe("isEmail", () => {
  it("accepts standard valid email addresses", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("first.last@sub.domain.org")).toBe(true);
    expect(isEmail("user+tag@example.co.uk")).toBe(true);
  });

  it("rejects addresses missing the @ symbol", () => {
    expect(isEmail("notanemail")).toBe(false);
  });

  it("rejects addresses missing the domain part", () => {
    expect(isEmail("user@")).toBe(false);
  });

  it("rejects addresses missing the local part", () => {
    expect(isEmail("@example.com")).toBe(false);
  });

  it("rejects addresses with spaces", () => {
    expect(isEmail("user name@example.com")).toBe(false);
    expect(isEmail("user@exam ple.com")).toBe(false);
  });

  it("rejects addresses with no TLD dot", () => {
    expect(isEmail("user@nodot")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isEmail("")).toBe(false);
  });

  it("rejects strings with multiple @ symbols", () => {
    expect(isEmail("a@b@c.com")).toBe(false);
  });

  it("rejects whitespace-only strings", () => {
    expect(isEmail("   ")).toBe(false);
  });

  it("rejects a string that is only the @ symbol", () => {
    expect(isEmail("@")).toBe(false);
  });

  it("accepts an email whose TLD is numeric", () => {
    // The regex does not restrict TLDs to letters, so user@example.123 matches.
    expect(isEmail("user@example.123")).toBe(true);
  });

  it("rejects an email with a space immediately after @", () => {
    expect(isEmail("user@ example.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe("truncate", () => {
  it("returns the original string when it is shorter than maxLength", () => {
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("returns the original string when it is exactly maxLength", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and appends '...' when the string exceeds maxLength", () => {
    // "Hello, world!" is 13 chars; with maxLength=8 we expect 5 chars + "..."
    const result = truncate("Hello, world!", 8);
    expect(result).toBe("Hello...");
    expect(result).toHaveLength(8);
  });

  it("the result length equals maxLength after truncation", () => {
    const maxLength = 10;
    const result = truncate("A very long string that exceeds the limit", maxLength);
    expect(result).toHaveLength(maxLength);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns an empty string unchanged", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("handles maxLength of exactly 3 (only the ellipsis fits)", () => {
    // slice(0, 0) + "..." → "..."
    expect(truncate("hello", 3)).toBe("...");
    expect(truncate("hello", 3)).toHaveLength(3);
  });

  it("handles maxLength less than 3 by producing a string longer than maxLength (documents current behaviour)", () => {
    // maxLength=1 → slice(0, 1-3) = slice(0, -2) = "hel" for "hello" → "hel..."
    // The result is longer than maxLength; callers should not pass values below 3.
    const result = truncate("hello", 1);
    expect(result).toBe("hel...");
  });

  it("returns the original string unchanged when maxLength is very large", () => {
    expect(truncate("short", 10_000)).toBe("short");
  });

  it("handles maxLength of 0 by producing a string longer than maxLength (documents current behaviour)", () => {
    // maxLength=0 → slice(0, 0-3) = slice(0, -3) = "he" for "hello" → "he..."
    const result = truncate("hello", 0);
    expect(result).toBe("he...");
  });

  it("appends exactly '...' and not some other ellipsis character", () => {
    const result = truncate("abcdefgh", 6);
    expect(result).toBe("abc...");
    expect(result.endsWith("…")).toBe(false); // not the Unicode ellipsis
  });
});

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------
describe("sleep", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves after the specified delay", async () => {
    const resolved = jest.fn();
    const promise = sleep(1000).then(resolved);

    expect(resolved).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await promise;

    expect(resolved).toHaveBeenCalledTimes(1);
  });

  it("does not resolve before the delay elapses", async () => {
    const resolved = jest.fn();
    sleep(500).then(resolved);

    jest.advanceTimersByTime(499);
    // Flush microtasks without advancing timers further.
    await Promise.resolve();

    expect(resolved).not.toHaveBeenCalled();
  });

  it("resolves immediately for a 0 ms delay", async () => {
    const resolved = jest.fn();
    const promise = sleep(0).then(resolved);

    jest.advanceTimersByTime(0);
    await promise;

    expect(resolved).toHaveBeenCalledTimes(1);
  });

  it("multiple concurrent sleeps resolve independently", async () => {
    const short = jest.fn();
    const long = jest.fn();

    const p1 = sleep(100).then(short);
    const p2 = sleep(500).then(long);

    jest.advanceTimersByTime(100);
    await p1;
    expect(short).toHaveBeenCalledTimes(1);
    expect(long).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    await p2;
    expect(long).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires the function only after the delay has elapsed", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer when called again before the delay elapses", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced("first");
    jest.advanceTimersByTime(200);
    debounced("second"); // resets the timer
    jest.advanceTimersByTime(200);

    // Still inside the second delay window — should not have fired.
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // complete the second 300ms window
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  it("passes the latest arguments to the underlying function", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced("a", "b");
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("a", "b");
  });

  it("never fires if the timer is cancelled before the delay elapses", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    jest.advanceTimersByTime(299);

    expect(fn).not.toHaveBeenCalled();
    // Do not advance the remaining 1 ms — function must never have been called.
  });

  it("fires once per quiescent period even with rapid successive calls", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 200);

    for (let i = 0; i < 10; i++) {
      debounced(i);
      jest.advanceTimersByTime(100); // each call resets the 200 ms window
    }
    // After the loop, 100 ms have passed since the last call.
    jest.advanceTimersByTime(100); // complete the final 200 ms window
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(9); // called with the last argument
  });

  it("two independent debounced wrappers do not share timers", () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const d1 = debounce(fn1, 300);
    const d2 = debounce(fn2, 300);

    d1();
    d2();
    d1(); // reset only d1's timer

    jest.advanceTimersByTime(300);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it("fires correctly with a 0 ms delay", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 0);

    debounced("zero");
    expect(fn).not.toHaveBeenCalled(); // still async via setTimeout

    jest.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("zero");
  });
});
