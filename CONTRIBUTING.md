# Contributing to Hexperience Platform

Thank you for your interest in contributing to Hexperience Platform! This guide will help you get started.

## Development Workflow

### 1. Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/hexperience-platform.git
   cd hexperience-platform
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Build all packages:**
   ```bash
   pnpm build
   ```

4. **Run tests:**
   ```bash
   pnpm test
   ```

### 2. Development

1. **Create a branch:**
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```

2. **Make changes:**
   - Write code following our standards
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### 3. Pull Request

1. **Push your branch:**
   ```bash
   git push origin feat/my-feature
   ```

2. **Create a Pull Request:**
   - Use a clear title and description
   - Reference related issues
   - Ensure CI passes
   - Request review from maintainers

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for public APIs
- Use explicit return types for public functions
- Avoid `any` - use `unknown` when necessary
- Document public APIs with JSDoc

### Code Style

- **Formatting:** Biome.js (auto-formatted on commit)
- **Linting:** Biome.js (configured in `biome.json`)
- **Imports:** Use ES modules (`import`/`export`)
- **Naming:**
  - Files: `kebab-case.ts`
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`

### Testing

- Write tests for all new features
- Aim for >80% code coverage
- Use descriptive test names
- Group related tests with `describe` blocks
- Test both success and error cases

### Documentation

- Document public APIs with JSDoc
- Include examples in documentation
- Update README/docs when adding features
- Keep comments clear and concise

## Project Structure

```
hexperience-platform/
├── apps/
│   └── cli/              # CLI application
├── packages/
│   ├── catalog/          # Catalog resolver
│   ├── engine/           # Composer engine
│   ├── shared/           # Shared types/utils
│   └── validation/      # Validation system
├── templates/            # Template definitions
├── doc/                  # Documentation
└── ...
```

## Package Development

### Creating a New Package

1. **Create package structure:**
   ```bash
   pnpm create rslib@latest \
     --template node-esm-ts \
     --dir packages/my-package \
     --packageName @hexp/my-package
   ```

2. **Add to workspace:**
   - Package is automatically included in `pnpm-workspace.yaml`

3. **Add dependencies:**
   ```bash
   pnpm add @hexp/shared --workspace-root --filter @hexp/my-package
   ```

4. **Update root `package.json`** if needed

### Package Guidelines

- Each package should have a clear purpose
- Dependencies should be minimal
- Export only public APIs
- Include tests and documentation
- Follow the same code standards

## Template Development

### Creating Templates

1. **Create template directory:**
   ```
   templates/bases/base-my-template/
   ├── manifest.json
   ├── README.md
   └── template/
       └── ...
   ```

2. **Define manifest.json:**
   - See [Template Guide](./doc/TEMPLATE-GUIDE.md)

3. **Validate:**
   ```bash
   create-hexp validate
   ```

4. **Test:**
   ```bash
   create-hexp create --base base-my-template --name test --dry-run
   ```

### Template Guidelines

- Use semantic versioning
- Document capabilities clearly
- Provide sensible defaults
- Include README with usage
- Test with multiple scenarios

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

### Examples

```bash
feat: add validate command
fix: resolve template path resolution issue
docs: update user guide with new examples
refactor: simplify error handling
test: add tests for stats collector
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example:**
```
feat(cli): add statistics collection

- Track files created/modified
- Track operations executed
- Display summary with --stats flag

Closes #123
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code is linted and formatted
3. ✅ Type checking passes
4. ✅ Documentation updated
5. ✅ Commit messages follow conventions

### PR Checklist

- [ ] Clear title and description
- [ ] Related issues referenced
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CI passes
- [ ] No breaking changes (or documented)

### Review Process

1. Maintainers review PRs
2. Address feedback and suggestions
3. Update PR as needed
4. Once approved, maintainers merge

## Testing Requirements

### Unit Tests

- Test individual functions/classes
- Mock external dependencies
- Test edge cases and errors

### Integration Tests

- Test component interactions
- Test full workflows
- Use real file system when needed

### E2E Tests

- Test complete CLI workflows
- Generate actual projects
- Verify project structure

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm test --filter @hexp/cli

# Watch mode
pnpm test --watch

# Coverage
pnpm test:coverage
```

## Code Review Guidelines

### For Authors

- Keep PRs focused and small
- Respond to feedback promptly
- Be open to suggestions
- Update PR based on feedback

### For Reviewers

- Be constructive and respectful
- Focus on code quality
- Check tests and documentation
- Approve when satisfied

## Getting Help

- **Issues:** Open an issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions
- **Documentation:** Check [doc/](./doc/) directory

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Thank You!

Your contributions make this project better. Thank you for taking the time to contribute!