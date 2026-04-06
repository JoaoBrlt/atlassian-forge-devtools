/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ["master"],
  plugins: [
    // Analyze the commits
    "@semantic-release/commit-analyzer",

    // Generate the release notes
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: ":rocket: Features" },
            { type: "fix", section: ":bug: Bug Fixes" },
            { type: "build", section: ":package: Build", hidden: true },
            { type: "chore", section: ":wrench: Chores", hidden: true },
            { type: "ci", section: ":robot: CI", hidden: true },
            { type: "docs", section: ":memo: Documentation", hidden: true },
            { type: "perf", section: ":zap: Performance", hidden: true },
            { type: "refactor", section: ":recycle: Refactors", hidden: true },
            { type: "revert", section: ":rewind: Reverts", hidden: true },
            { type: "style", section: ":art: Style", hidden: true },
            { type: "test", section: ":test_tube: Tests", hidden: true },
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
