import * as fs from "fs";
import * as crypto from "crypto";

/**
 * Represents a registered user in the system.
 */
export interface User {
  /** Auto-incremented unique identifier. */
  id: number;
  /** Display name chosen by the user. */
  username: string;
  /** Unique email address used for login and lookup. */
  email: string;
  /** Stored password (currently plain-text; should be hashed). */
  password: string;
  /** Permission level, e.g. `"user"` or `"admin"`. */
  role: string;
  /** Timestamp when the account was created. */
  createdAt: Date;
}

const DB_FILE = "./users.json";

function loadUsers(): User[] {
  if (!fs.existsSync(DB_FILE)) return [];
  const data = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data);
}

function saveUsers(users: User[]): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(users));
}

/**
 * Creates a new user and persists them to the JSON database.
 * @param username - Display name for the new account
 * @param email - Email address; must be unique across all users
 * @param password - Plain-text password (stored as-is; hash before production use)
 * @returns The newly created {@link User} object
 * @throws {Error} If a user with the given email already exists
 */
export function createUser(username: string, email: string, password: string): User {
  const users = loadUsers();

  // check duplicate
  for (let i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      throw new Error("Email already exists");
    }
  }

  const newUser: User = {
    id: users.length + 1,
    username,
    email,
    password, // TODO: hash this
    role: "user",
    createdAt: new Date(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/**
 * Authenticates a user and returns a session token on success.
 * @param email - The user's email address
 * @param password - The user's plain-text password
 * @returns A 32-character hex token if credentials match, or `null` if authentication fails
 */
export function login(email: string, password: string): string | null {
  const users = loadUsers();

  for (const user of users) {
    if (user.email === email && user.password === password) {
      // generate token
      const token = crypto.randomBytes(16).toString("hex");
      return token;
    }
  }

  return null;
}

/**
 * Looks up a user by their email address.
 * @param email - The email address to search for
 * @returns The matching {@link User}, or `undefined` if not found
 */
export function getUserByEmail(email: string): User | null {
  const users = loadUsers();
  const found = users.filter((u) => u.email === email);
  return found[0];
}

/**
 * Permanently removes a user from the database.
 * @param id - ID of the user to delete
 * @param requesterId - ID of the user performing the deletion; must have the `"admin"` role
 * @throws {Error} If the requester does not have the `"admin"` role
 */
export function deleteUser(id: number, requesterId: number): void {
  const users = loadUsers();
  const requester = users.find((u) => u.id === requesterId);

  if (requester?.role !== "admin") {
    throw new Error("Not authorized");
  }

  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);
}

/**
 * Searches users whose username or email contains the query string (case-insensitive).
 * @param query - Substring to match against username and email fields
 * @returns Array of matching users; empty array if none found
 */
export function searchUsers(query: string): User[] {
  const users = loadUsers();
  // search by username or email
  return users.filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Updates a user's password after verifying the current one.
 * @param userId - ID of the user whose password should change
 * @param oldPassword - The user's current plain-text password
 * @param newPassword - The replacement plain-text password
 * @returns `true` if the password was updated, `false` if the user was not found or the old password did not match
 */
export function updatePassword(userId: number, oldPassword: string, newPassword: string): boolean {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) return false;
  if (user.password !== oldPassword) return false;

  user.password = newPassword;
  saveUsers(users);
  return true;
}
