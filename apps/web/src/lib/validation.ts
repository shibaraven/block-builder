import type { BlockData, CanvasNode } from '@block-builder/types'

export interface ValidationError {
  nodeId: string
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// ─── Per-kind validators ──────────────────────────────────────────────
function validateBlockData(nodeId: string, data: BlockData): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  const err = (field: string, message: string) => errors.push({ nodeId, field, message })
  const warn = (field: string, message: string) => warnings.push({ nodeId, field, message })

  switch (data.kind) {
    case 'interface': {
      if (!data.name?.trim()) err('name', 'Interface 名稱不能為空')
      else if (!/^[A-Z][a-zA-Z0-9]*$/.test(data.name)) err('name', 'Interface 名稱必須以大寫字母開頭，只能包含字母和數字')
      if (!data.fields?.length) warn('fields', 'Interface 沒有任何欄位')
      data.fields?.forEach((f, i) => {
        if (!f.name?.trim()) err('fields', `第 ${i + 1} 個欄位名稱不能為空`)
        if (!f.type?.trim()) err('fields', `欄位 "${f.name}" 的型別不能為空`)
      })
      break
    }
    case 'dto': {
      if (!data.name?.trim()) err('name', 'DTO 名稱不能為空')
      else if (!/^[A-Z][a-zA-Z0-9]*$/.test(data.name)) err('name', 'DTO 名稱必須以大寫字母開頭')
      if (!data.fields?.length) warn('fields', 'DTO 沒有任何欄位')
      data.fields?.forEach((f, i) => {
        if (!f.name?.trim()) err('fields', `第 ${i + 1} 個欄位名稱不能為空`)
        if (!f.type?.trim()) err('fields', `欄位 "${f.name}" 的型別不能為空`)
      })
      break
    }
    case 'enum': {
      if (!data.name?.trim()) err('name', 'Enum 名稱不能為空')
      if (!data.values?.length) err('values', 'Enum 至少需要一個值')
      data.values?.forEach((v, i) => {
        if (!v.key?.trim()) err('values', `第 ${i + 1} 個 Enum key 不能為空`)
        if (!/^[A-Z_][A-Z0-9_]*$/.test(v.key || '')) warn('values', `Enum key "${v.key}" 建議使用全大寫加底線`)
      })
      break
    }
    case 'api-endpoint': {
      if (!data.path?.trim()) err('path', 'API 路徑不能為空')
      else if (!data.path.startsWith('/')) err('path', 'API 路徑必須以 / 開頭')
      if (!data.responseType?.trim()) err('responseType', '回傳型別不能為空')
      if (!data.summary?.trim()) warn('summary', '建議填寫 API 說明（summary）')
      if ((data.method === 'POST' || data.method === 'PUT' || data.method === 'PATCH') && !data.bodyType?.trim()) {
        warn('bodyType', `${data.method} 端點建議設定 Body 型別`)
      }
      break
    }
    case 'use-query': {
      if (!data.hookName?.trim()) err('hookName', 'Hook 名稱不能為空')
      else if (!/^use[A-Z]/.test(data.hookName)) err('hookName', 'Hook 名稱必須以 "use" + 大寫字母開頭')
      if (!data.endpoint?.trim()) err('endpoint', 'API 端點不能為空')
      if (!data.responseType?.trim()) err('responseType', '回傳型別不能為空')
      if (data.staleTime < 0) err('staleTime', 'staleTime 不能為負數')
      break
    }
    case 'use-mutation': {
      if (!data.hookName?.trim()) err('hookName', 'Hook 名稱不能為空')
      else if (!/^use[A-Z]/.test(data.hookName)) err('hookName', 'Hook 名稱必須以 "use" + 大寫字母開頭')
      if (!data.endpoint?.trim()) err('endpoint', 'API 端點不能為空')
      if (!data.bodyType?.trim()) warn('bodyType', '建議設定 Body 型別')
      if (!data.responseType?.trim()) err('responseType', '回傳型別不能為空')
      break
    }
    case 'data-table': {
      if (!data.componentName?.trim()) err('componentName', '組件名稱不能為空')
      else if (!/^[A-Z][a-zA-Z0-9]*$/.test(data.componentName)) err('componentName', '組件名稱必須以大寫字母開頭')
      if (!data.dataType?.trim()) err('dataType', '資料型別不能為空')
      if (!data.columns?.length) warn('columns', '建議至少設定一個表格欄位')
      break
    }
    case 'form': {
      if (!data.componentName?.trim()) err('componentName', '組件名稱不能為空')
      if (!data.dtoType?.trim()) err('dtoType', 'DTO 型別不能為空')
      if (!data.fields?.length) warn('fields', '建議至少設定一個表單欄位')
      break
    }
    case 'nest-module': {
      if (!data.name?.trim()) err('name', 'Module 名稱不能為空')
      else if (!data.name.endsWith('Module')) warn('name', 'NestJS Module 名稱建議以 "Module" 結尾')
      break
    }
    case 'nest-service': {
      if (!data.name?.trim()) err('name', 'Service 名稱不能為空')
      else if (!data.name.endsWith('Service')) warn('name', 'NestJS Service 名稱建議以 "Service" 結尾')
      if (!data.methods?.length) warn('methods', '建議至少設定一個 Service 方法')
      break
    }
    case 'nest-repository': {
      if (!data.name?.trim()) err('name', 'Repository 名稱不能為空')
      if (!data.entity?.trim()) err('entity', 'Entity 名稱不能為空')
      if (!data.methods?.length) err('methods', '至少選擇一個 Repository 方法')
      break
    }
    case 'auth-guard': {
      if (!data.name?.trim()) err('name', 'Guard 名稱不能為空')
      break
    }
    case 'jwt': {
      if (!data.secret?.trim()) err('secret', 'JWT Secret 不能為空')
      if (!data.expiresIn?.trim()) err('expiresIn', '過期時間不能為空')
      if (!data.payload?.length) warn('payload', '建議設定 JWT Payload 欄位')
      break
    }
    case 'cache': {
      if (!data.name?.trim()) err('name', 'Cache 名稱不能為空')
      if (data.ttl <= 0) err('ttl', 'TTL 必須大於 0')
      break
    }
    case 'email': {
      if (!data.name?.trim()) err('name', 'Email Service 名稱不能為空')
      if (!data.templates?.length) warn('templates', '建議至少設定一個 Email 模板')
      break
    }
    case 'websocket': {
      if (!data.name?.trim()) err('name', 'WebSocket Gateway 名稱不能為空')
      if (!data.namespace?.trim()) err('namespace', 'Namespace 不能為空')
      if (!data.events?.length) warn('events', '建議至少設定一個 WebSocket 事件')
      break
    }
    case 'store': {
      if (!data.name?.trim()) err('name', 'Store 名稱不能為空')
      else if (!/^use[A-Z]/.test(data.name)) warn('name', 'Zustand Store 名稱建議以 "use" 開頭')
      if (!data.state?.length) warn('state', '建議至少設定一個 State 欄位')
      break
    }
    case 'chart': {
      if (!data.componentName?.trim()) err('componentName', '組件名稱不能為空')
      if (!data.dataType?.trim()) err('dataType', '資料型別不能為空')
      if (!data.xKey?.trim()) err('xKey', 'X 軸欄位不能為空')
      if (!data.yKey?.trim()) err('yKey', 'Y 軸欄位不能為空')
      break
    }
    case 'navigation': {
      if (!data.componentName?.trim()) err('componentName', '組件名稱不能為空')
      if (!data.items?.length) err('items', '導覽列至少需要一個選項')
      data.items?.forEach((item, i) => {
        if (!item.label?.trim()) err('items', `第 ${i + 1} 個導覽項目的標籤不能為空`)
        if (!item.path?.trim()) err('items', `第 ${i + 1} 個導覽項目的路徑不能為空`)
        else if (!item.path.startsWith('/')) warn('items', `導覽路徑 "${item.path}" 建議以 / 開頭`)
      })
      break
    }
  }

  return { errors, warnings }
}

// ─── Validate all nodes ───────────────────────────────────────────────
export function validateCanvas(nodes: CanvasNode[]): ValidationResult {
  const allErrors: ValidationError[] = []
  const allWarnings: ValidationError[] = []

  for (const node of nodes) {
    const { errors, warnings } = validateBlockData(node.id, node.data.blockData)
    allErrors.push(...errors)
    allWarnings.push(...warnings)
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

// ─── Validate single node ─────────────────────────────────────────────
export function validateNode(node: CanvasNode): ReturnType<typeof validateBlockData> {
  return validateBlockData(node.id, node.data.blockData)
}
