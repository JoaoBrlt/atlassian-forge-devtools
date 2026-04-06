/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{js,jsx,ts,tsx,css,scss,html,json,yml,yaml,md}": "prettier --write",
};
