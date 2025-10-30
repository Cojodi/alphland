# NPM Package Setup Guide

This guide explains how to set up automatic publishing of the `@alphland/dapps` package.

## Prerequisites

1. **NPM Account**: You need an NPM account to publish packages
2. **Organization (Optional)**: Create an `@alphland` organization on NPM or use a different scope
3. **NPM Access Token**: Generate an automation token from NPM

## Setup Steps

### 1. Create NPM Access Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click on your profile avatar → "Access Tokens"
3. Click "Generate New Token"
4. Select "Automation" token type
5. Copy the generated token

### 2. Add NPM Token to GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your NPM access token
6. Click "Add secret"

### 3. Configure Package Scope (if needed)

If you don't have access to the `@alphland` scope on NPM, you can either:

**Option A: Use your own scope**
- Edit `packages/alphland-dapps/package.json`
- Change `"name": "@alphland/dapps"` to `"name": "@yourorg/dapps"`

**Option B: Remove scope (unscoped package)**
- Edit `packages/alphland-dapps/package.json`
- Change `"name": "@alphland/dapps"` to `"name": "alphland-dapps"`
- Remove the `"publishConfig"` section

### 4. Publish Workflow

The package will be automatically published when:

1. Changes are pushed to the `develop` branch
2. Files in `data/**` or `packages/alphland-dapps/**` are modified
3. The version in `package.json` is different from the published version

### 5. Manual Version Updates

To publish a new version:

```bash
cd packages/alphland-dapps

# Update version (choose one)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Commit and push
git add package.json
git commit -m "Bump package version to X.X.X"
git push origin develop
```

The GitHub Action will automatically:
- Build the package
- Publish to NPM
- Create a git tag

## Testing Locally

Before pushing, you can test the build locally:

```bash
cd packages/alphland-dapps
npm run build
```

Check the `dist/` directory to verify the output.

## Package Usage

After publishing, users can install the package:

```bash
npm install @alphland/dapps
```

And use it in their projects:

```typescript
import { dapps } from '@alphland/dapps';
```

## Troubleshooting

### "You do not have permission to publish"

- Make sure your NPM token has publish permissions
- Verify the package name/scope is available or you have access to it
- Check that the `NPM_TOKEN` secret is correctly set in GitHub

### "Version already exists"

- Update the version in `package.json` before pushing
- Use `npm version` commands to bump the version

### Build fails

- Ensure all JSON files in `data/` directory are valid
- Check that all required fields are present in dApp JSON files
- Run `npm run build` locally to debug

## Additional Resources

- [NPM Publishing Documentation](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
