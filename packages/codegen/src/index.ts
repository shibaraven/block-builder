import type {
  CanvasState, ProjectSettings, GeneratedCode, GeneratedFile,
  InterfaceData, DtoData, EnumData,
  ApiEndpointData, UseQueryData, UseMutationData, DataTableData, FormData,
  NestModuleData, NestServiceData, NestRepositoryData,
  MiddlewareData, CacheData, EmailData, JobData, WebSocketData,
  AuthGuardData, JwtData, StoreData, ChartData, CardData,
  NavigationData, SearchBarData, NotificationData, PaginationData,
} from '@block-builder/types'

import { generateInterface, generateDto, generateEnum } from './generators/types'
import { generateApiRoute, generateGlobalErrorHandler } from './generators/api'
import { generateNestModule, generateNestService, generatePrismaRepository, generateNestController } from './generators/nestjs'
import { generateQueryHook, generateMutationHook } from './generators/hooks'
import { generateDataTable, generateForm } from './generators/components'
import { generateOpenApiSpec } from './generators/openapi'
import {
  generateMiddleware, generateCache, generateEmail, generateJob,
  generateWebSocket, generateAuthGuard, generateJwt, generateStore,
  generateChart, generateCard, generateNavigation, generateSearchBar,
  generateNotification, generatePagination,
} from './generators/infra'
import { generatePrismaSchema } from './generators/prisma'
import { generateApiTest, generateNestServiceTest, generateQueryHookTest, generateMutationHookTest } from './generators/tests'
import {
  generatePackageJson, generateGithubActions, generateDockerfile,
  generateDockerCompose, generateEslintConfig, generatePlaywrightTest,
  generatePlaywrightConfig,
} from './generators/devops'
import {
  generatePageRoute, generateRouterConfig, generateOAuth,
  generateStripe, generateInfiniteScroll,
} from './generators/newblocks'
import { formatCode } from './formatter'
import { generateGraphQLSchema, generateGraphQLResolver, generateGraphQLModel } from './generators/graphql'
import { generateTrpcRouter, generateTrpcAppRouter, generateTrpcBase, generateTrpcClient } from './generators/trpc'

export async function generateFromCanvas(
  canvas: CanvasState,
  settings: ProjectSettings,
  projectName = 'My Project'
): Promise<GeneratedCode> {
  const files: GeneratedFile[] = []
  const summary = { totalFiles: 0, types: [] as string[], endpoints: [] as string[], components: [] as string[], hooks: [] as string[] }
  const nodes = canvas.nodes

  const push = async (path: string, content: string, language: GeneratedFile['language'], category: GeneratedFile['category'], name?: string) => {
    files.push({ path, content: await formatCode(content), language, category })
    if (name) {
      if (category === 'type') summary.types.push(name)
      else if (category === 'api') summary.endpoints.push(name)
      else if (category === 'component') summary.components.push(name)
      else if (category === 'hook') summary.hooks.push(name)
    }
  }

  // ─── Types ───────────────────────────────────────────────────────
  const interfaceNodes: InterfaceData[] = []
  for (const node of nodes.filter(n => n.data.category === 'type')) {
    const d = node.data.blockData
    if (d.kind === 'interface') {
      const data = d as InterfaceData
      interfaceNodes.push(data)
      await push(`src/types/${toKebab(data.name)}.ts`, generateInterface(data), 'typescript', 'type', data.name)
    } else if (d.kind === 'dto') {
      const data = d as DtoData
      await push(`src/types/${toKebab(data.name)}.ts`, generateDto(data), 'typescript', 'type', data.name)
    } else if (d.kind === 'enum') {
      const data = d as EnumData
      await push(`src/types/${toKebab(data.name)}.ts`, generateEnum(data), 'typescript', 'type', data.name)
    } else if (d.kind === 'pagination') {
      const data = d as PaginationData
      await push(`src/lib/${toKebab(data.name)}.ts`, generatePagination(data), 'typescript', 'type', data.name)
    }
  }

  // Prisma schema from Interface nodes
  if (interfaceNodes.length > 0) {
    await push('prisma/schema.prisma', generatePrismaSchema(interfaceNodes), 'prisma', 'infra')
  }

  // ─── API & NestJS ─────────────────────────────────────────────────
  const apiEndpoints: ApiEndpointData[] = []
  for (const node of nodes.filter(n => n.data.category === 'api')) {
    const d = node.data.blockData
    if (d.kind === 'api-endpoint') {
      const data = d as ApiEndpointData
      apiEndpoints.push(data)
      const routeName = pathToName(data.path)
      await push(`src/api/routes/${routeName}.ts`, generateApiRoute(data, settings.apiFramework), 'typescript', 'api', `${data.method} ${data.path}`)
      // Test for each API route
      await push(`src/api/routes/__tests__/${routeName}.test.ts`, generateApiTest(data, settings.apiFramework), 'typescript', 'test')
    } else if (d.kind === 'nest-module') {
      const data = d as NestModuleData
      const n = toKebab(data.name.replace('Module', ''))
      await push(`src/modules/${n}/${n}.module.ts`, generateNestModule(data), 'typescript', 'module', data.name)
      await push(`src/modules/${n}/${n}.controller.ts`, generateNestController(data.name, apiEndpoints), 'typescript', 'api', `${data.name}Controller`)
    } else if (d.kind === 'nest-service') {
      const data = d as NestServiceData
      const n = toKebab(data.name.replace('Service', ''))
      await push(`src/modules/${n}/${n}.service.ts`, generateNestService(data), 'typescript', 'service', data.name)
      // Test for NestJS service
      await push(`src/modules/${n}/__tests__/${n}.service.test.ts`, generateNestServiceTest(data), 'typescript', 'test')
    } else if (d.kind === 'nest-repository') {
      const data = d as NestRepositoryData
      const n = toKebab(data.name.replace('Repository', ''))
      await push(`src/modules/${n}/${n}.repository.ts`, generatePrismaRepository(data), 'typescript', 'service', data.name)
    }
  }

  if (apiEndpoints.length > 0) {
    await push('openapi.yaml', generateOpenApiSpec(apiEndpoints), 'yaml', 'spec')
  }

  // ─── Auth ─────────────────────────────────────────────────────────
  for (const node of nodes.filter(n => n.data.category === 'auth')) {
    const d = node.data.blockData
    if (d.kind === 'auth-guard') {
      const data = d as AuthGuardData
      await push(`src/auth/${toKebab(data.name)}.ts`, generateAuthGuard(data), 'typescript', 'service', data.name)
    } else if (d.kind === 'jwt') {
      const data = d as JwtData
      await push(`src/auth/jwt.ts`, generateJwt(data), 'typescript', 'service', data.name)
    }
  }

  // ─── Infrastructure ───────────────────────────────────────────────
  for (const node of nodes.filter(n => n.data.category === 'infra')) {
    const d = node.data.blockData
    if (d.kind === 'middleware') {
      await push(`src/middleware/${toKebab((d as MiddlewareData).name)}.ts`, generateMiddleware(d as MiddlewareData), 'typescript', 'infra')
    } else if (d.kind === 'cache') {
      await push(`src/lib/cache.ts`, generateCache(d as CacheData), 'typescript', 'infra')
    } else if (d.kind === 'email') {
      await push(`src/services/email.service.ts`, generateEmail(d as EmailData), 'typescript', 'service')
    } else if (d.kind === 'job') {
      await push(`src/jobs/${toKebab((d as JobData).name)}.ts`, generateJob(d as JobData), 'typescript', 'infra')
    } else if (d.kind === 'websocket') {
      await push(`src/gateways/${toKebab((d as WebSocketData).name)}.ts`, generateWebSocket(d as WebSocketData), 'typescript', 'infra')
    } else if (d.kind === 'file-upload') {
      const data = d as any
      if (data.componentName) {
        await push(`src/components/${toKebab(data.componentName)}.tsx`, generateFileUploadComponent(data), 'typescript', 'component', data.componentName)
        summary.components.push(data.componentName)
      }
    }
  }

  // ─── Logic (Hooks & Stores) ──────────────────────────────────────
  for (const node of nodes.filter(n => n.data.category === 'logic')) {
    const d = node.data.blockData
    if (d.kind === 'use-query') {
      const data = d as UseQueryData
      await push(`src/hooks/${toKebab(data.hookName)}.ts`, generateQueryHook(data), 'typescript', 'hook', data.hookName)
      await push(`src/hooks/__tests__/${toKebab(data.hookName)}.test.ts`, generateQueryHookTest(data), 'typescript', 'test')
    } else if (d.kind === 'use-mutation') {
      const data = d as UseMutationData
      await push(`src/hooks/${toKebab(data.hookName)}.ts`, generateMutationHook(data), 'typescript', 'hook', data.hookName)
      await push(`src/hooks/__tests__/${toKebab(data.hookName)}.test.ts`, generateMutationHookTest(data), 'typescript', 'test')
    } else if (d.kind === 'store') {
      const data = d as StoreData
      await push(`src/stores/${toKebab(data.name)}.ts`, generateStore(data), 'typescript', 'hook', data.name)
    }
  }

  // ─── UI Components ────────────────────────────────────────────────
  for (const node of nodes.filter(n => n.data.category === 'ui' || n.data.category === 'layout')) {
    const d = node.data.blockData
    if (d.kind === 'data-table') {
      const data = d as DataTableData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateDataTable(data), 'typescript', 'component', data.componentName)
    } else if (d.kind === 'form') {
      const data = d as FormData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateForm(data), 'typescript', 'component', data.componentName)
    } else if (d.kind === 'chart') {
      const data = d as ChartData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateChart(data), 'typescript', 'component', data.componentName)
    } else if (d.kind === 'card') {
      const data = d as CardData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateCard(data), 'typescript', 'component', data.componentName)
    } else if (d.kind === 'navigation') {
      const data = d as NavigationData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateNavigation(data), 'typescript', 'component', data.componentName)
    } else if (d.kind === 'search-bar') {
      const data = d as SearchBarData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateSearchBar(data), 'typescript', 'component', data.componentName)
    } else if (d.kind === 'notification') {
      const data = d as NotificationData
      await push(`src/components/${toKebab(data.componentName)}.tsx`, generateNotification(data), 'typescript', 'component', data.componentName)
    }
  }

  // ─── GraphQL / tRPC extra output ────────────────────────────────
  if (settings.apiFramework === 'graphql') {
    const interfaces = nodes.filter(n => n.data.blockData.kind === 'interface').map(n => n.data.blockData as any)
    const enums = nodes.filter(n => n.data.blockData.kind === 'enum').map(n => n.data.blockData as any)
    if (interfaces.length > 0 || apiEndpoints.length > 0) {
      await push('graphql/schema.graphql', generateGraphQLSchema(interfaces, enums, apiEndpoints), 'yaml', 'spec')
      for (const iface of interfaces) {
        const n = toKebab(iface.name)
        await push(`graphql/models/${n}.model.ts`, generateGraphQLModel(iface), 'typescript', 'type')
        await push(`graphql/resolvers/${n}.resolver.ts`, generateGraphQLResolver(iface, apiEndpoints), 'typescript', 'api')
      }
    }
  }

  if (settings.apiFramework === 'trpc') {
    const interfaces = nodes.filter(n => n.data.blockData.kind === 'interface').map(n => n.data.blockData as any)
    await push('src/server/trpc.ts', generateTrpcBase(), 'typescript', 'infra')
    await push('src/client/trpc.ts', generateTrpcClient(), 'typescript', 'hook')
    const routerNames: string[] = []
    for (const iface of interfaces) {
      const name = iface.name.charAt(0).toLowerCase() + iface.name.slice(1)
      await push(`src/server/routers/${name}.ts`, generateTrpcRouter(iface, apiEndpoints), 'typescript', 'api')
      routerNames.push(name)
    }
    if (routerNames.length > 0) {
      await push('src/server/routers/_app.ts', generateTrpcAppRouter(routerNames), 'typescript', 'api')
    }
  }

  // ─── New block types ────────────────────────────────────────────
  const pageNodes: any[] = []
  for (const node of nodes.filter(n => n.data.category === 'layout')) {
    const d = node.data.blockData as any
    if (d.kind === 'page') {
      pageNodes.push(d)
      await push(`src/pages/${d.name}.tsx`, generatePageRoute(d), 'typescript', 'component', d.name)
    }
  }
  if (pageNodes.length > 0) {
    await push('src/router.tsx', generateRouterConfig(pageNodes), 'typescript', 'component')
  }

  for (const node of nodes.filter(n => n.data.category === 'auth')) {
    const d = node.data.blockData as any
    if (d.kind === 'oauth') {
      await push('src/auth/oauth.ts', generateOAuth(d), 'typescript', 'service')
    }
  }

  for (const node of nodes.filter(n => n.data.category === 'infra')) {
    const d = node.data.blockData as any
    if (d.kind === 'stripe') {
      await push('src/services/stripe.ts', generateStripe(d), 'typescript', 'service')
    }
  }

  for (const node of nodes.filter(n => n.data.category === 'logic')) {
    const d = node.data.blockData as any
    if (d.kind === 'infinite-scroll') {
      await push(`src/hooks/${toKebab(d.hookName)}.ts`, generateInfiniteScroll(d), 'typescript', 'hook', d.hookName)
    }
  }

  // ─── DevOps files ─────────────────────────────────────────────────
  await push('package.json', generatePackageJson(nodes, settings, projectName), 'json', 'infra')
  await push('.github/workflows/ci.yml', generateGithubActions(settings), 'yaml', 'infra')
  await push('Dockerfile', generateDockerfile(settings), 'dockerfile', 'infra')
  await push('docker-compose.yml', generateDockerCompose(nodes, settings), 'yaml', 'infra')
  await push('eslint.config.js', generateEslintConfig(settings), 'typescript', 'infra')
  if (apiEndpoints.length > 0) {
    await push('e2e/api.spec.ts', generatePlaywrightTest(apiEndpoints), 'typescript', 'test')
    await push('playwright.config.ts', generatePlaywrightConfig(), 'typescript', 'infra')
  }

  // ─── Error handling utilities ────────────────────────────────────
  if (apiEndpoints.length > 0) {
    const errPath = settings.apiFramework === 'nestjs'
      ? 'src/common/filters/global-exception.filter.ts'
      : 'src/lib/error-handler.ts'
    await push(errPath, generateGlobalErrorHandler(settings.apiFramework), 'typescript', 'infra')
  }

  // ─── Barrel exports ───────────────────────────────────────────────
  if (summary.types.length > 0)
    await push('src/types/index.ts', summary.types.map(t => `export * from './${toKebab(t)}'`).join('\n'), 'typescript', 'type')
  if (summary.hooks.length > 0)
    await push('src/hooks/index.ts', summary.hooks.map(h => `export * from './${toKebab(h)}'`).join('\n'), 'typescript', 'hook')
  if (summary.components.length > 0)
    await push('src/components/index.ts', summary.components.map(c => `export * from './${toKebab(c)}'`).join('\n'), 'typescript', 'component')

  // Vitest config
  if (nodes.some(n => n.data.category === 'api' || n.data.category === 'logic')) {
    await push('vitest.config.ts', generateVitestConfig(), 'typescript', 'infra')
  }

  summary.totalFiles = files.length
  return { files, summary }
}

function generateFileUploadComponent(data: any): string {
  return `import React, { useCallback } from 'react'\nimport { useDropzone } from 'react-dropzone'\n\nexport function ${data.componentName}({ onUpload }: { onUpload?: (files: File[]) => void }) {\n  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({\n    accept: { ${data.accept.map((a: string) => `'${a}': []`).join(', ')} },\n    maxSize: ${data.maxSize} * 1024 * 1024,\n    multiple: ${data.multiple},\n    onDrop: (files) => onUpload?.(files),\n  })\n  return (\n    <div {...getRootProps()} className={\`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors \${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}\`}>\n      <input {...getInputProps()} />\n      <p className="text-gray-500 text-sm">{isDragActive ? 'Drop files here...' : 'Drag & drop or click to select'}</p>\n      <p className="text-xs text-gray-400 mt-1">Max: ${data.maxSize}MB</p>\n      {acceptedFiles.length > 0 && <ul className="mt-3 text-xs text-left space-y-1">{acceptedFiles.map((f, i) => <li key={i} className="text-green-600">{f.name}</li>)}</ul>}\n    </div>\n  )\n}\n`
}

function generateVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test-setup.ts'],
    },
  },
})
`
}

function toKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/\//g, '-')
}

function pathToName(path: string): string {
  return path.split('/').filter(Boolean).map(s => s.replace(/[^a-zA-Z0-9]/g, '')).join('-') || 'route'
}

export * from './generators/types'
export * from './generators/api'
export * from './generators/hooks'
export * from './generators/components'
export * from './generators/openapi'
export * from './generators/prisma'
export * from './generators/tests'
export { formatCode } from './formatter'
