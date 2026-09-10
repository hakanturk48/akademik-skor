/* global __dirname */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const auth = require(path.join(__dirname, '../src/lib/auth.ts'));
const input = { name: 'Local Test', email: 'local-admin@example.com', password: 'Local-Only-Test-123!' };
let data;
beforeEach(() => {
  data = new Map();
  global.__DEV__ = true;
  global.window = { location: { hostname: 'localhost' }, localStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) } };
});

test('first local admin can be created, logged out and logged back in without claiming email verification', () => {
  assert.equal(auth.getLocalAdminSetupState().available, true);
  const created = auth.createLocalAdminAccount(input);
  assert.equal(created.ok, true);
  assert.equal(created.user.role, 'admin');
  assert.equal(created.user.emailVerified, false);
  assert.equal(created.user.passwordHash, undefined);
  assert.equal(created.user.localAdmin, undefined);
  assert.equal(auth.getLocalAdminSetupState().available, false);
  assert.equal(auth.createLocalAdminAccount({ ...input, email: 'second@example.com' }).ok, false);
  auth.logoutUser();
  assert.equal(auth.getCurrentUser(), null);
  assert.equal(auth.loginUser(input.email, 'wrong-password').ok, false);
  const login = auth.loginUser(input.email, input.password);
  assert.equal(login.ok, true);
  assert.equal(auth.getPostLoginRoute(login.user), '/admin');
});

test('bootstrap and local admin login are unavailable in production', () => {
  auth.createLocalAdminAccount(input);
  auth.logoutUser();
  global.__DEV__ = false;
  assert.equal(auth.getLocalAdminSetupState().available, false);
  assert.equal(auth.createLocalAdminAccount(input).ok, false);
  assert.equal(auth.loginUser(input.email, input.password).ok, false);
  assert.equal(auth.getCurrentUser(), null);
});

test('bootstrap is unavailable on non-loopback hosts', () => {
  global.window.location.hostname = 'example.com';
  assert.equal(auth.getLocalAdminSetupState().available, false);
  assert.equal(auth.createLocalAdminAccount(input).ok, false);
  assert.equal(data.size, 0);
});

test('regular registration cannot create admins; student registration still works', () => {
  assert.equal(auth.registerUser({ ...input, role: 'admin' }).ok, false);
  assert.equal(auth.registerUser({ ...input, role: 'unexpected' }).ok, false);
  const verification = auth.requestEmailVerification(input.email);
  assert.equal(verification.ok, true);
  assert.equal(auth.verifyEmailCode(input.email, verification.code).ok, true);
  const student = auth.registerUser({ ...input, role: 'student' });
  assert.equal(student.ok, true);
  assert.equal(auth.getPostLoginRoute(student.user), '/dashboard');
  assert.equal(auth.getPostLoginRoute(student.user, 'https://example.com'), '/dashboard');
  assert.equal(auth.getPostLoginRoute(student.user, '/admin'), '/admin');
  const before = data.get('akademik-skor.users');
  assert.equal(auth.createLocalAdminAccount(input).ok, false);
  assert.equal(data.get('akademik-skor.users'), before);
});

test('corrupt account data cannot be overwritten by setup', () => {
  data.set('akademik-skor.users', '{broken');
  assert.equal(auth.getLocalAdminSetupState().available, false);
  assert.equal(auth.createLocalAdminAccount(input).ok, false);
  assert.equal(data.get('akademik-skor.users'), '{broken');
});

test('setup validates input and reports failed persistence', () => {
  assert.equal(auth.createLocalAdminAccount({ ...input, password: 'short' }).ok, false);
  assert.equal(auth.createLocalAdminAccount({ ...input, email: 'invalid' }).ok, false);
  assert.equal(auth.createLocalAdminAccount({ ...input, name: '' }).ok, false);
  global.window.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(auth.createLocalAdminAccount(input).ok, false);
  assert.equal(data.size, 0);
});
