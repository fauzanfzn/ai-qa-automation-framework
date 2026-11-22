// Public demo accounts published on https://www.saucedemo.com (not secrets).
const PASSWORD = process.env.DEMO_PASSWORD ?? 'secret_sauce';

export const USERS = {
  standard: { username: 'standard_user', password: PASSWORD },
  locked: { username: 'locked_out_user', password: PASSWORD },
  problem: { username: 'problem_user', password: PASSWORD },
  glitch: { username: 'performance_glitch_user', password: PASSWORD },
};

/** Data-driven login cases: input -> expected outcome. */
export const LOGIN_CASES = [
  { name: 'standard user logs in', user: 'standard_user', pass: PASSWORD, expectError: null },
  { name: 'locked user is blocked', user: 'locked_out_user', pass: PASSWORD, expectError: 'Sorry, this user has been locked out.' },
  { name: 'wrong password is rejected', user: 'standard_user', pass: 'wrong_password', expectError: 'Username and password do not match' },
  { name: 'empty username is rejected', user: '', pass: PASSWORD, expectError: 'Username is required' },
  { name: 'empty password is rejected', user: 'standard_user', pass: '', expectError: 'Password is required' },
];
