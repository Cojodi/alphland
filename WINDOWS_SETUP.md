# Windows Development Setup Guide

This guide helps Windows developers set up their environment to work with this project's Git hooks (Husky + lint-staged).

## Prerequisites

### 1. Install Git for Windows

Download and install [Git for Windows](https://git-scm.com/download/win) which includes Git Bash.

**Important**: During installation, make sure to select:
- "Git from the command line and also from 3rd-party software"
- "Use Windows' default console window" OR "Use MinTTY"

### 2. Install Node.js

Download and install [Node.js](https://nodejs.org/) (LTS version recommended).

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alphland
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically set up Husky hooks via the `prepare` script.

### 3. Configure Git (if needed)

If you encounter issues with line endings:

```bash
git config core.autocrlf true
```

### 4. Verify Husky Installation

Check if hooks are installed:

```bash
ls -la .husky/
```

You should see `pre-commit` and `commit-msg` files.

## Common Issues and Solutions

### Issue 1: "husky - command not found"

**Solution**: Reinstall husky hooks:
```bash
npm run prepare
```

### Issue 2: "sh: command not found" or ".husky.sh not found"

**Solution**: Make sure Git Bash is installed and available in your PATH:
```bash
where sh
# Should output: C:\Program Files\Git\bin\sh.exe (or similar)
```

### Issue 3: ESLint or Prettier errors during commit

**Solution**: Fix the linting errors before committing:
```bash
# Check for linting errors
npm run lint

# Format code
npm run format
```

**Do NOT use** `git commit --no-verify` unless absolutely necessary, as it bypasses important code quality checks.

### Issue 4: GitHub Desktop shows errors

**Potential causes**:
1. **Code quality issues**: Check the error message - it usually shows ESLint/Prettier errors
2. **Shell not found**: GitHub Desktop might not find Git Bash

**Solution for GitHub Desktop**:
1. Fix any ESLint/Prettier errors first
2. Make sure GitHub Desktop is using the correct Git installation:
   - File → Options → Git
   - Ensure it points to your Git for Windows installation

## Development Workflow

### Making a Commit

1. Stage your changes:
   ```bash
   git add <files>
   ```

2. Commit (hooks will run automatically):
   ```bash
   git commit -m "type: description"
   ```

### Commit Message Format

Commits must follow this format: `type: description`

Allowed types:
- `feat` - add a new feature
- `fix` - bug fix
- `chore` - tool, configuration changes
- `docs` - documentation update
- `refactor` - code changes, no new features
- `test` - add/update tests

Examples:
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login button styling"
git commit -m "chore: update dependencies"
```

## What Happens During a Commit?

1. **Pre-commit hook** runs:
   - ESLint checks and auto-fixes code
   - Prettier formats code
   - If errors can't be auto-fixed, commit is blocked

2. **Commit-msg hook** runs:
   - Validates commit message format
   - Blocks commit if format is invalid

## Need Help?

If you continue to experience issues:
1. Check if Node.js and Git are in your PATH: `node --version && git --version`
2. Try running hooks manually: `npm run precommit-hook`
3. Check the error messages carefully - they usually indicate the exact problem
4. Ask the team for help!

## Alternative: WSL (Windows Subsystem for Linux)

For the best experience on Windows, consider using WSL2:
1. Install WSL2: https://docs.microsoft.com/en-us/windows/wsl/install
2. Install Node.js in WSL
3. Clone and work with the project inside WSL
4. Use VS Code with the WSL extension
