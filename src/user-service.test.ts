import * as fs from "fs";
import {
  createUser,
  login,
  getUserByEmail,
  deleteUser,
  searchUsers,
  updatePassword,
  User,
} from "./user-service";

// ---------------------------------------------------------------------------
// Mock the entire fs module so no real disk I/O happens.
// ---------------------------------------------------------------------------
jest.mock("fs");

const mockedFs = fs as jest.Mocked<typeof fs>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Serialize a user array exactly as saveUsers() does. */
function encode(users: User[]): string {
  return JSON.stringify(users);
}

/**
 * Configure the fs mock so that the in-memory store starts with `users`.
 * Each call to readFileSync returns the current serialized state.
 * writeFileSync updates that state, so successive reads within one test
 * see changes made by saveUsers().
 */
function seedFs(initial: User[]): void {
  let store = encode(initial);

  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockImplementation(() => store);
  mockedFs.writeFileSync.mockImplementation((_path, data) => {
    store = data as string;
  });
}

/** Make the db appear empty (file does not exist). */
function emptyFs(): void {
  mockedFs.existsSync.mockReturnValue(false);
  mockedFs.readFileSync.mockReturnValue("[]");
  mockedFs.writeFileSync.mockImplementation(() => undefined);
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: "alice",
    email: "alice@example.com",
    password: "pass123",
    role: "user",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------
describe("createUser", () => {
  it("creates a new user and returns it when the email is unique", () => {
    emptyFs();
    const user = createUser("alice", "alice@example.com", "pass123");

    expect(user.username).toBe("alice");
    expect(user.email).toBe("alice@example.com");
    expect(user.password).toBe("pass123");
    expect(user.role).toBe("user");
    expect(user.id).toBe(1); // first user in empty db
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  it("throws when the email already exists", () => {
    const existing = makeUser({ email: "alice@example.com" });
    seedFs([existing]);

    expect(() => createUser("alice2", "alice@example.com", "other")).toThrow(
      "Email already exists"
    );
    // No write should have occurred.
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
describe("login", () => {
  const alice = makeUser({ email: "alice@example.com", password: "correct" });

  it("returns a non-empty token string on correct credentials", () => {
    seedFs([alice]);
    const token = login("alice@example.com", "correct");

    expect(typeof token).toBe("string");
    expect(token).not.toBeNull();
    expect((token as string).length).toBeGreaterThan(0);
  });

  it("returns null when the password is wrong", () => {
    seedFs([alice]);
    expect(login("alice@example.com", "wrong")).toBeNull();
  });

  it("returns null when the email does not exist", () => {
    seedFs([alice]);
    expect(login("nobody@example.com", "correct")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getUserByEmail
// ---------------------------------------------------------------------------
describe("getUserByEmail", () => {
  it("returns the matching user when found", () => {
    const alice = makeUser();
    seedFs([alice]);

    const result = getUserByEmail("alice@example.com");
    expect(result).not.toBeNull();
    expect(result!.username).toBe("alice");
  });

  it("returns undefined when no user matches the email", () => {
    seedFs([makeUser()]);
    const result = getUserByEmail("nobody@example.com");
    // filter()[0] is undefined when nothing matches
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------
describe("deleteUser", () => {
  const admin = makeUser({ id: 1, role: "admin", email: "admin@example.com" });
  const regularUser = makeUser({ id: 2, role: "user", email: "bob@example.com" });

  it("removes the target user when the requester is an admin", () => {
    seedFs([admin, regularUser]);

    expect(() => deleteUser(regularUser.id, admin.id)).not.toThrow();
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);

    // Verify the written payload no longer contains regularUser.
    const written = JSON.parse(
      (mockedFs.writeFileSync.mock.calls[0][1] as string)
    ) as User[];
    expect(written.find((u) => u.id === regularUser.id)).toBeUndefined();
  });

  it("throws when the requester is not an admin", () => {
    seedFs([admin, regularUser]);

    expect(() => deleteUser(admin.id, regularUser.id)).toThrow("Not authorized");
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// searchUsers
// ---------------------------------------------------------------------------
describe("searchUsers", () => {
  const users: User[] = [
    makeUser({ id: 1, username: "alice", email: "alice@example.com" }),
    makeUser({ id: 2, username: "bob", email: "bob@work.com" }),
    makeUser({ id: 3, username: "charlie", email: "charlie@example.com" }),
  ];

  beforeEach(() => seedFs(users));

  it("matches users by username substring", () => {
    const results = searchUsers("bob");
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("bob");
  });

  it("matches users by email substring", () => {
    const results = searchUsers("work.com");
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe("bob");
  });

  it("is case-insensitive", () => {
    expect(searchUsers("ALICE")).toHaveLength(1);
    expect(searchUsers("EXAMPLE.COM")).toHaveLength(2);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchUsers("zzz_no_match")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// updatePassword
// ---------------------------------------------------------------------------
describe("updatePassword", () => {
  const alice = makeUser({ id: 1, password: "oldPass" });

  it("updates the password and returns true on success", () => {
    seedFs([alice]);

    const result = updatePassword(1, "oldPass", "newPass");

    expect(result).toBe(true);
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(
      mockedFs.writeFileSync.mock.calls[0][1] as string
    ) as User[];
    expect(saved[0].password).toBe("newPass");
  });

  it("returns false when the old password does not match", () => {
    seedFs([alice]);
    expect(updatePassword(1, "wrongPass", "newPass")).toBe(false);
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("returns false when the user does not exist", () => {
    seedFs([alice]);
    expect(updatePassword(999, "oldPass", "newPass")).toBe(false);
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });
});
