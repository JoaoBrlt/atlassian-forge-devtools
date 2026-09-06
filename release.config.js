/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ["master"],
  plugins: [
    // Analyze the commits
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "build", release: "patch" },
          { type: "chore", release: "patch" },
          { type: "ci", release: "patch" },
          { type: "docs", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "refactor", release: "patch" },
          { type: "revert", release: "patch" },
          { type: "style", release: "patch" },
          { type: "test", release: "patch" },
        ],
      },
    ],

    // Generate the release notes
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: ":rocket: Features", hidden: false },
            { type: "fix", section: ":bug: Bug Fixes", hidden: false },
            { type: "build", section: ":package: Build", hidden: false },
            { type: "chore", section: ":wrench: Chores", hidden: false },
            { type: "ci", section: ":robot: CI", hidden: false },
            { type: "docs", section: ":memo: Documentation", hidden: false },
            { type: "perf", section: ":zap: Performance", hidden: false },
            { type: "refactor", section: ":recycle: Refactors", hidden: false },
            { type: "revert", section: ":rewind: Reverts", hidden: false },
            { type: "style", section: ":art: Style", hidden: false },
            { type: "test", section: ":test_tube: Tests", hidden: false },
          ],
        },
      },
    ],

    // Update the changelog
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],

    // Bump the version in the package.json
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],

    // Commit the changes
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]",
      },
    ],

    // Package the Chrome extension
    [
      "@semantic-release/exec",
      {
        prepareCmd: "pnpm run zip",
      },
    ],

    // Package the Firefox extension
    [
      "@semantic-release/exec",
      {
        prepareCmd: "pnpm run zip:firefox",
      },
    ],

    // Create a GitHub release
    [
      "@semantic-release/github",
      {
        assets: ["dist/*.zip"],
        successComment:
          ":tada: ${issue.pull_request ? 'This pull request has been released in' : 'This issue has been resolved in'} [v${nextRelease.version}](${releases.filter(r => r.url).map(r => r.url)[0]}).",
      },
    ],
  ],
};
