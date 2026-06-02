# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Goals Page E2E Tests >> goals page renders
- Location: e2e/app.spec.ts:57:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected pattern: /目标/
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- paragraph: 应用加载失败
```

```
Error: write EPIPE
```