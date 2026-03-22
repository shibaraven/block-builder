import type { InterfaceData, EnumData, ApiEndpointData } from '@block-builder/types'

// ─── TS → GraphQL scalar ──────────────────────────────────────────────
function tsToGql(ts: string): string {
  const clean = ts.replace('[]', '').replace('| null', '').replace('| undefined', '').replace('?', '').trim()
  const map: Record<string, string> = {
    string: 'String', number: 'Float', int: 'Int', boolean: 'Boolean',
    Date: 'DateTime', ID: 'ID', any: 'JSON', unknown: 'JSON',
  }
  if (ts.endsWith('[]')) return `[${map[clean] ?? clean}!]`
  return map[clean] ?? clean
}

// ─── GraphQL Schema ───────────────────────────────────────────────────
export function generateGraphQLSchema(
  interfaces: InterfaceData[],
  enums: EnumData[],
  endpoints: ApiEndpointData[]
): string {
  const scalars = `scalar DateTime\nscalar JSON\n`

  const gqlEnums = enums.map(e => `enum ${e.name} {\n${e.values.map(v => `  ${v.key}`).join('\n')}\n}`).join('\n\n')

  const types = interfaces.map(i => {
    const fields = i.fields.map(f => {
      const gqlType = tsToGql(f.type)
      const nullable = f.optional ? '' : '!'
      return `  ${f.name}: ${gqlType}${nullable}`
    }).join('\n')
    return `type ${i.name} {\n${fields}\n}`
  }).join('\n\n')

  // Group endpoints by resource
  const queries: string[] = []
  const mutations: string[] = []

  for (const ep of endpoints) {
    const name = endpointToGqlName(ep)
    const returnType = tsToGql(ep.responseType)
    const args = ep.bodyType ? `(input: ${ep.bodyType}Input!)` : ep.path.includes(':id') ? '(id: ID!)' : ''

    if (ep.method === 'GET') {
      queries.push(`  ${name}${args}: ${returnType}`)
    } else {
      mutations.push(`  ${name}${args}: ${returnType}!`)
    }
  }

  // Input types from interfaces
  const inputs = interfaces.map(i => {
    const fields = i.fields
      .filter(f => !['id', 'createdAt', 'updatedAt'].includes(f.name))
      .map(f => `  ${f.name}: ${tsToGql(f.type)}${f.optional ? '' : '!'}`)
      .join('\n')
    return `input ${i.name}Input {\n${fields}\n}`
  }).join('\n\n')

  const queryType = queries.length > 0 ? `type Query {\n${queries.join('\n')}\n}` : ''
  const mutationType = mutations.length > 0 ? `type Mutation {\n${mutations.join('\n')}\n}` : ''

  return [scalars, gqlEnums, types, inputs, queryType, mutationType]
    .filter(Boolean).join('\n\n')
}

function endpointToGqlName(ep: ApiEndpointData): string {
  const parts = ep.path.split('/').filter(p => p && !p.startsWith(':'))
  const resource = parts[parts.length - 1] ?? 'resource'
  const hasId = ep.path.includes(':id')

  const verbMap: Record<string, string> = {
    GET: hasId ? 'get' : 'list',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }
  const verb = verbMap[ep.method] ?? ep.method.toLowerCase()
  const name = resource.charAt(0).toUpperCase() + resource.slice(1)
  return `${verb}${name}`
}

// ─── NestJS GraphQL Resolver ──────────────────────────────────────────
export function generateGraphQLResolver(iface: InterfaceData, endpoints: ApiEndpointData[]): string {
  const queries = endpoints.filter(e => e.method === 'GET')
  const mutations = endpoints.filter(e => e.method !== 'GET')

  const queryResolvers = queries.map(ep => {
    const name = endpointToGqlName(ep)
    const hasId = ep.path.includes(':id')
    return `  @Query(() => ${ep.responseType.replace('[]', '')})
  async ${name}(${hasId ? '@Args("id") id: string' : ''}) {
    return this.${lcFirst(iface.name)}Service.${hasId ? 'findOne(id)' : 'findAll()'}
  }`
  }).join('\n\n')

  const mutationResolvers = mutations.map(ep => {
    const name = endpointToGqlName(ep)
    return `  @Mutation(() => ${ep.responseType})
  async ${name}(@Args("input") input: ${ep.bodyType ?? 'any'}) {
    return this.${lcFirst(iface.name)}Service.${ep.method === 'POST' ? 'create' : ep.method === 'DELETE' ? 'remove' : 'update'}(input)
  }`
  }).join('\n\n')

  return `import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { ${iface.name}Service } from './${toKebab(iface.name)}.service'
import { ${iface.name} } from './${toKebab(iface.name)}.model'

@Resolver(() => ${iface.name})
export class ${iface.name}Resolver {
  constructor(private readonly ${lcFirst(iface.name)}Service: ${iface.name}Service) {}

${queryResolvers}

${mutationResolvers}
}
`
}

// ─── GraphQL Model (ObjectType) ───────────────────────────────────────
export function generateGraphQLModel(iface: InterfaceData): string {
  const fields = iface.fields.map(f => {
    const gqlType = tsToGql(f.type)
    return `  @Field(() => ${gqlType}${f.optional ? ', { nullable: true }' : ''})
  ${f.name}${f.optional ? '?' : '!'}: ${f.type}`
  }).join('\n\n')

  return `import { ObjectType, Field, ID } from '@nestjs/graphql'

@ObjectType()
export class ${iface.name} {
${fields}
}
`
}

function lcFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1) }
function toKebab(s: string) { return s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') }
