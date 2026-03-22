import type { NestModuleData, NestServiceData, NestRepositoryData, ApiEndpointData } from '@block-builder/types'

// ─── Full NestJS Module ────────────────────────────────────────────
export function generateNestModule(data: NestModuleData): string {
  return `import { Module } from '@nestjs/common'
${data.imports.map(i => `import { ${i} } from './${toKebab(i.replace('Module',''))}.module'`).join('\n')}
import { ${data.controllers[0]} } from './${toKebab(data.name.replace('Module',''))}.controller'
import { ${data.providers.join(', ')} } from './${toKebab(data.name.replace('Module',''))}.service'

@Module({
  imports: [${data.imports.join(', ')}],
  controllers: [${data.controllers.join(', ')}],
  providers: [${data.providers.join(', ')}],
  exports: [${data.exports.join(', ')}],
})
${data.global ? '@Global()\n' : ''}export class ${data.name} {}
`
}

// ─── Full NestJS Controller ────────────────────────────────────────
export function generateNestController(moduleName: string, endpoints: ApiEndpointData[]): string {
  const baseName = moduleName.replace('Module', '')
  const controllerPath = toKebab(baseName)
  const imports = new Set(['Controller', 'UseGuards'])
  const methods: string[] = []

  for (const ep of endpoints) {
    const method = cap(ep.method.toLowerCase())
    imports.add(method)
    if (ep.bodyType) imports.add('Body')
    if (ep.path.includes(':id')) imports.add('Param')
    if (ep.queryParams?.length) imports.add('Query')

    const params: string[] = []
    if (ep.path.includes(':id')) params.push(`@Param('id') id: string`)
    if (ep.bodyType) params.push(`@Body() body: ${ep.bodyType}`)
    if (ep.queryParams?.length) params.push(`@Query() query: Record<string, string>`)

    methods.push(`  /**
   * ${ep.summary}
   */
  @${method}('${subPath(ep.path)}')
  ${ep.auth ? '@UseGuards(JwtAuthGuard)\n  ' : ''}async ${methodName(ep.method, ep.path)}(${params.join(', ')}) {
    ${ep.bodyType ? `return this.${lcFirst(baseName)}Service.${crudMethod(ep.method, ep.path)}(${params.map(p => p.split(' ').pop() || '').join(', ')})` : `return this.${lcFirst(baseName)}Service.${crudMethod(ep.method, ep.path)}()`}
  }`)
  }

  return `import { ${[...imports].join(', ')} } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
${endpoints.filter(e => e.bodyType).map(e => `import { ${e.bodyType} } from './dto/${toKebab(e.bodyType!)}.dto'`).filter((v, i, a) => a.indexOf(v) === i).join('\n')}
import { ${baseName}Service } from './${controllerPath}.service'

@Controller('${controllerPath}')
export class ${baseName}Controller {
  constructor(private readonly ${lcFirst(baseName)}Service: ${baseName}Service) {}

${methods.join('\n\n')}
}
`
}

// ─── NestJS Service ────────────────────────────────────────────────
export function generateNestService(data: NestServiceData): string {
  const methods = data.methods.map(m => `  /**
   * ${m.description}
   */
  async ${m.name}(${m.params}): ${m.returnType} {
    // TODO: implement
    throw new Error('Not implemented: ${m.name}')
  }`).join('\n\n')

  const deps = data.dependencies.map(d => `private readonly ${lcFirst(d)}: ${d}`).join(',\n    ')

  return `import { Injectable } from '@nestjs/common'
${data.dependencies.map(d => `import { ${d} } from './${toKebab(d)}'`).join('\n')}

@Injectable()
export class ${data.name} {
  constructor(
    ${deps}
  ) {}

${methods}
}
`
}

// ─── Prisma Repository ────────────────────────────────────────────
export function generatePrismaRepository(data: NestRepositoryData): string {
  const entity = data.entity
  const lc = lcFirst(entity)
  const methodImpls: string[] = []

  if (data.methods.includes('findAll')) {
    methodImpls.push(`  async findAll(): Promise<${entity}[]> {
    return this.prisma.${lc}.findMany()
  }`)
  }
  if (data.methods.includes('findOne')) {
    methodImpls.push(`  async findOne(id: string): Promise<${entity} | null> {
    return this.prisma.${lc}.findUnique({ where: { id } })
  }`)
  }
  if (data.methods.includes('findMany')) {
    methodImpls.push(`  async findMany(where: Partial<${entity}>): Promise<${entity}[]> {
    return this.prisma.${lc}.findMany({ where })
  }`)
  }
  if (data.methods.includes('create')) {
    methodImpls.push(`  async create(data: Omit<${entity}, 'id' | 'createdAt' | 'updatedAt'>): Promise<${entity}> {
    return this.prisma.${lc}.create({ data })
  }`)
  }
  if (data.methods.includes('update')) {
    methodImpls.push(`  async update(id: string, data: Partial<${entity}>): Promise<${entity}> {
    return this.prisma.${lc}.update({ where: { id }, data })
  }`)
  }
  if (data.methods.includes('delete')) {
    methodImpls.push(`  async delete(id: string): Promise<void> {
    await this.prisma.${lc}.delete({ where: { id } })
  }`)
  }
  if (data.methods.includes('count')) {
    methodImpls.push(`  async count(where?: Partial<${entity}>): Promise<number> {
    return this.prisma.${lc}.count({ where })
  }`)
  }

  return `import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { ${entity} } from '@prisma/client'

@Injectable()
export class ${data.name} {
  constructor(private readonly prisma: PrismaService) {}

${methodImpls.join('\n\n')}
}
`
}

// ─── Helpers ──────────────────────────────────────────────────────
function toKebab(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function lcFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1) }
function subPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts.slice(1).join('/') || '/'
}
function methodName(method: string, path: string) {
  const hasId = path.includes(':id')
  const map: Record<string, string> = {
    GET: hasId ? 'findOne' : 'findAll',
    POST: 'create',
    PUT: 'update',
    PATCH: 'patch',
    DELETE: 'remove',
  }
  return map[method] ?? method.toLowerCase()
}
function crudMethod(method: string, path: string) {
  return methodName(method, path)
}
