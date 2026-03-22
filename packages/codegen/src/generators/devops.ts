import type {
  ApiEndpointData, NestServiceData, ProjectSettings,
  CanvasNode,
} from '@block-builder/types'

// ─── package.json generator ──────────────────────────────────────────
export function generatePackageJson(
  nodes: CanvasNode[],
  settings: ProjectSettings,
  projectName: string
): string {
  const categories = new Set(nodes.map(n => n.data.category))
  const kinds = new Set(nodes.map(n => n.data.blockData.kind))

  const deps: Record<string, string> = {}
  const devDeps: Record<string, string> = {}

  // Base
  if (settings.framework === 'react') {
    Object.assign(deps, { react: '^18.3.0', 'react-dom': '^18.3.0' })
    Object.assign(devDeps, {
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.2.0',
      vite: '^5.2.0',
    })
  } else if (settings.framework === 'vue') {
    Object.assign(deps, { vue: '^3.4.0' })
    Object.assign(devDeps, { '@vitejs/plugin-vue': '^5.0.0', vite: '^5.2.0' })
  }

  // TypeScript always
  Object.assign(devDeps, { typescript: '^5.4.0', '@types/node': '^20.0.0' })

  // Tailwind
  Object.assign(devDeps, { tailwindcss: '^3.4.0', autoprefixer: '^10.4.0', postcss: '^8.4.0' })

  // API framework
  if (settings.apiFramework === 'hono') {
    Object.assign(deps, { hono: '^4.3.0', '@hono/node-server': '^1.11.0' })
    if (kinds.has('auth-guard') || nodes.some(n => (n.data.blockData as any).auth)) {
      deps['hono/jwt'] = '*'
    }
  } else if (settings.apiFramework === 'nestjs') {
    Object.assign(deps, {
      '@nestjs/core': '^10.0.0',
      '@nestjs/common': '^10.0.0',
      '@nestjs/platform-express': '^10.0.0',
      '@nestjs/jwt': '^10.0.0',
      '@nestjs/swagger': '^7.0.0',
      'reflect-metadata': '^0.2.0',
      rxjs: '^7.8.0',
    })
    Object.assign(devDeps, {
      '@nestjs/cli': '^10.0.0',
      '@nestjs/testing': '^10.0.0',
    })
  } else if (settings.apiFramework === 'express') {
    Object.assign(deps, { express: '^4.19.0', '@types/express': '^4.17.0' })
  }

  // Zod always
  deps['zod'] = '^3.23.0'

  // TanStack Query if hooks exist
  if (kinds.has('use-query') || kinds.has('use-mutation')) {
    deps['@tanstack/react-query'] = '^5.0.0'
    deps['@tanstack/react-query-devtools'] = '^5.0.0'
  }

  // Zustand if store exists
  if (kinds.has('store')) deps['zustand'] = '^4.5.0'

  // Prisma
  if (kinds.has('nest-repository') || categories.has('type')) {
    deps['@prisma/client'] = '^5.0.0'
    devDeps['prisma'] = '^5.0.0'
  }

  // Auth
  if (kinds.has('jwt')) {
    deps['jose'] = '^5.0.0'
    if (settings.apiFramework === 'nestjs') deps['passport-jwt'] = '^4.0.0'
  }

  // Infra
  if (kinds.has('cache')) deps['ioredis'] = '^5.3.0'
  if (kinds.has('email')) {
    const emailNode = nodes.find(n => n.data.blockData.kind === 'email')
    const provider = (emailNode?.data.blockData as any)?.provider
    if (provider === 'resend') deps['resend'] = '^3.0.0'
    else deps['nodemailer'] = '^6.9.0'
  }
  if (kinds.has('job')) {
    deps['bullmq'] = '^5.0.0'
    deps['node-cron'] = '^3.0.0'
  }
  if (kinds.has('websocket')) {
    deps['socket.io'] = '^4.7.0'
    deps['socket.io-client'] = '^4.7.0'
  }
  if (kinds.has('file-upload')) {
    deps['@aws-sdk/client-s3'] = '^3.0.0'
    deps['multer'] = '^1.4.0'
  }

  // UI libs
  if (kinds.has('chart')) deps['recharts'] = '^2.12.0'
  if (kinds.has('notification')) {
    const notifNode = nodes.find(n => n.data.blockData.kind === 'notification')
    const lib = (notifNode?.data.blockData as any)?.lib
    if (lib === 'sonner') deps['sonner'] = '^1.4.0'
    else deps['react-hot-toast'] = '^2.4.0'
  }
  if (kinds.has('form')) {
    deps['react-hook-form'] = '^7.51.0'
    deps['@hookform/resolvers'] = '^3.3.0'
  }
  if (kinds.has('navigation')) deps['react-router-dom'] = '^6.22.0'
  if (kinds.has('file-upload')) deps['react-dropzone'] = '^14.2.0'

  // Test
  Object.assign(devDeps, {
    vitest: '^1.5.0',
    '@vitest/coverage-v8': '^1.5.0',
    '@testing-library/react': '^15.0.0',
    '@testing-library/user-event': '^14.5.0',
    jsdom: '^24.0.0',
  })

  const name = projectName.toLowerCase().replace(/\s+/g, '-')
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: settings.apiFramework === 'nestjs' ? 'nest start --watch' : `${settings.apiFramework === 'hono' ? 'tsx watch src/index.ts' : 'vite'}`,
      build: settings.framework === 'react' ? 'tsc && vite build' : 'tsc',
      test: 'vitest run',
      'test:watch': 'vitest',
      'test:coverage': 'vitest run --coverage',
      lint: 'eslint src --ext ts,tsx',
      typecheck: 'tsc --noEmit',
      ...(deps['@prisma/client'] ? { 'db:generate': 'prisma generate', 'db:push': 'prisma db push', 'db:studio': 'prisma studio' } : {}),
    },
    dependencies: Object.fromEntries(Object.entries(deps).sort()),
    devDependencies: Object.fromEntries(Object.entries(devDeps).sort()),
    engines: { node: '>=20.0.0' },
  }

  return JSON.stringify(pkg, null, 2)
}

// ─── GitHub Actions CI ───────────────────────────────────────────────
export function generateGithubActions(settings: ProjectSettings): string {
  const pm = settings.packageManager
  const installCmd = pm === 'pnpm' ? 'pnpm install' : pm === 'yarn' ? 'yarn install' : 'npm ci'
  const runCmd = (script: string) =>
    pm === 'pnpm' ? `pnpm ${script}` : pm === 'yarn' ? `yarn ${script}` : `npm run ${script}`

  return `name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${pm}'

${pm === 'pnpm' ? `      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 10

` : ''}      - name: Install dependencies
        run: ${installCmd}

      - name: Type check
        run: ${runCmd('typecheck')}

      - name: Lint
        run: ${runCmd('lint')}

      - name: Test
        run: ${runCmd('test:coverage')}

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

      - name: Build
        run: ${runCmd('build')}

  ${settings.apiFramework === 'nestjs' ? `
  deploy:
    name: Deploy
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t app:latest .

      - name: Push to registry
        run: |
          echo "Add your deployment steps here"
          # docker push your-registry/app:latest
` : ''}
`
}

// ─── Dockerfile ─────────────────────────────────────────────────────
export function generateDockerfile(settings: ProjectSettings): string {
  const pm = settings.packageManager

  if (settings.apiFramework === 'nestjs') {
    return `# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

${pm === 'pnpm' ? 'RUN npm install -g pnpm\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile' :
  pm === 'yarn' ? 'COPY package.json yarn.lock ./\nRUN yarn install --frozen-lockfile' :
  'COPY package.json package-lock.json ./\nRUN npm ci'}

COPY . .
RUN ${pm === 'pnpm' ? 'pnpm build' : pm === 'yarn' ? 'yarn build' : 'npm run build'}

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

${pm === 'pnpm' ? 'RUN npm install -g pnpm\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile --prod' :
  pm === 'yarn' ? 'COPY package.json yarn.lock ./\nRUN yarn install --frozen-lockfile --production' :
  'COPY package.json package-lock.json ./\nRUN npm ci --only=production'}

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
`
  }

  return `FROM node:20-alpine
WORKDIR /app

${pm === 'pnpm' ? 'RUN npm install -g pnpm\nCOPY package.json pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile' :
  pm === 'yarn' ? 'COPY package.json yarn.lock ./\nRUN yarn install --frozen-lockfile' :
  'COPY package.json package-lock.json ./\nRUN npm ci'}

COPY . .
EXPOSE 3001
CMD [${pm === 'pnpm' ? '"pnpm"' : pm === 'yarn' ? '"yarn"' : '"npm"'}, "run", "dev"]
`
}

// ─── docker-compose.yml ──────────────────────────────────────────────
export function generateDockerCompose(nodes: CanvasNode[], settings: ProjectSettings): string {
  const kinds = new Set(nodes.map(n => n.data.blockData.kind))
  const hasRedis = kinds.has('cache') || kinds.has('job')
  const hasDb = nodes.some(n => n.data.category === 'type') || kinds.has('nest-repository')
  const hasWs = kinds.has('websocket')

  let services = `
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/app
      - JWT_SECRET=your-secret-key-change-in-production${hasRedis ? '\n      - REDIS_URL=redis://redis:6379' : ''}
    depends_on:${hasDb ? '\n      - db' : ''}${hasRedis ? '\n      - redis' : ''}
    volumes:
      - .:/app
      - /app/node_modules`

  if (hasDb) {
    services += `

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data`
  }

  if (hasRedis) {
    services += `

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data`
  }

  let volumes = '\nvolumes:'
  if (hasDb) volumes += '\n  postgres_data:'
  if (hasRedis) volumes += '\n  redis_data:'

  return `version: '3.9'

services:${services}
${volumes}
`
}

// ─── ESLint config ──────────────────────────────────────────────────
export function generateEslintConfig(settings: ProjectSettings): string {
  const isReact = settings.framework === 'react'
  return `import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
${isReact ? "import reactPlugin from 'eslint-plugin-react'\nimport reactHooks from 'eslint-plugin-react-hooks'" : ''}

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      ${isReact ? "'react': reactPlugin,\n      'react-hooks': reactHooks," : ''}
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ${isReact ? "...reactHooks.configs.recommended.rules," : ''}
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  },
]
`
}

// ─── Playwright E2E tests ─────────────────────────────────────────────
export function generatePlaywrightTest(endpoints: ApiEndpointData[]): string {
  const tests = endpoints.map(ep => {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method)
    const hasId = ep.path.includes(':id')
    return `
  test('${ep.method} ${ep.path} - ${ep.summary || 'should work'}', async ({ request }) => {
    ${ep.auth ? `// Note: add auth token to headers
    const headers = { Authorization: 'Bearer your-test-token' }
    ` : ''}
    const response = await request.${ep.method.toLowerCase()}(
      \`\${BASE_URL}${ep.path.replace(':id', 'test-id-123')}\`,
      {
        ${ep.auth ? 'headers,' : ''}
        ${hasBody ? `data: {
          // TODO: add valid test data for ${ep.bodyType ?? 'body'}
        },` : ''}
      }
    )

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  ${ep.auth ? `test('${ep.method} ${ep.path} - should return 401 without auth', async ({ request }) => {
    const response = await request.${ep.method.toLowerCase()}(
      \`\${BASE_URL}${ep.path.replace(':id', 'test-id-123')}\`
    )
    expect(response.status()).toBe(401)
  })
` : ''}`.trim()
  }).join('\n\n  ')

  return `import { test, expect } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3001'

test.describe('API Integration Tests', () => {
  ${tests}
})
`
}

// ─── Playwright config ────────────────────────────────────────────────
export function generatePlaywrightConfig(): string {
  return `import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
`
}

// ─── NestJS Swagger decorators (enhanced) ────────────────────────────
export function generateSwaggerDecorators(endpoint: ApiEndpointData): string {
  return `  @ApiOperation({
    summary: '${endpoint.summary || `${endpoint.method} ${endpoint.path}`}',
    description: 'TODO: Add detailed description',
    tags: ${JSON.stringify(endpoint.tags.length ? endpoint.tags : ['api'])},
  })
  @ApiResponse({ status: 200, description: 'Success', type: ${endpoint.responseType.replace('[]', '')} })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  ${endpoint.auth ? "@ApiResponse({ status: 401, description: 'Unauthorized' })\n  @ApiBearerAuth()" : ''}
  @ApiResponse({ status: 500, description: 'Internal Server Error' })`
}
