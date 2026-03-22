import type { CanvasNode } from '@block-builder/types'

export interface AppPage {
  path: string
  title: string
  icon: string
  uiBlocks: CanvasNode[]
}

export interface AppPreviewConfig {
  pages: AppPage[]
  appName: string
  navType: 'sidebar' | 'navbar' | 'tabs'
  navItems: { label: string; path: string; icon?: string }[]
  hasAuth: boolean
  primaryColor: string
}

// ─── Analyse canvas and extract page structure ────────────────────────
export function analyseCanvas(nodes: CanvasNode[]): AppPreviewConfig {
  const navNode = nodes.find(n => n.data.blockData.kind === 'navigation')
  const pageNodes = nodes.filter(n => n.data.blockData.kind === 'page')
  const uiNodes = nodes.filter(n =>
    ['data-table', 'form', 'card', 'chart', 'search-bar', 'notification', 'modal'].includes(
      (n.data.blockData as any).kind
    )
  )
  const authNode = nodes.find(n =>
    ['jwt', 'auth-guard', 'oauth'].includes((n.data.blockData as any).kind)
  )

  const navData = navNode?.data.blockData as any
  const navItems: { label: string; path: string }[] = navData?.items ?? [
    { label: 'Dashboard', path: '/' },
    { label: 'Data', path: '/data' },
  ]

  // Build pages from Page blocks or Navigation items
  const pages: AppPage[] = []

  if (pageNodes.length > 0) {
    for (const pageNode of pageNodes) {
      const pd = pageNode.data.blockData as any
      pages.push({
        path: pd.path ?? '/',
        title: pd.title ?? pd.name ?? 'Page',
        icon: getPageIcon(pd.path ?? '/'),
        uiBlocks: uiNodes, // all UI blocks shown on each page for now
      })
    }
  } else {
    // Create pages from nav items
    for (const item of navItems) {
      pages.push({
        path: item.path,
        title: item.label,
        icon: getPageIcon(item.path),
        uiBlocks: uiNodes,
      })
    }
    // Always have at least one page
    if (pages.length === 0) {
      pages.push({ path: '/', title: 'Dashboard', icon: '📊', uiBlocks: uiNodes })
    }
  }

  return {
    pages,
    appName: navData?.componentName?.replace('App', '').replace('Navbar', '').replace('Nav', '') ?? 'My App',
    navType: navData?.type === 'sidebar' ? 'sidebar' : 'navbar',
    navItems,
    hasAuth: !!authNode,
    primaryColor: '#185FA5',
  }
}

function getPageIcon(path: string): string {
  const p = path.toLowerCase()
  if (p === '/' || p.includes('dashboard') || p.includes('home')) return '📊'
  if (p.includes('user') || p.includes('member')) return '👥'
  if (p.includes('order') || p.includes('sale')) return '🛒'
  if (p.includes('product') || p.includes('inventory')) return '📦'
  if (p.includes('setting') || p.includes('config')) return '⚙️'
  if (p.includes('report') || p.includes('analytic')) return '📈'
  if (p.includes('message') || p.includes('chat')) return '💬'
  if (p.includes('auth') || p.includes('login')) return '🔐'
  if (p.includes('task') || p.includes('todo')) return '✅'
  return '📄'
}

// ─── Generate UI section for a block ─────────────────────────────────
function generateBlockHTML(node: CanvasNode, idx: number): string {
  const d = node.data.blockData as any
  const title = node.data.label

  switch (d.kind) {
    case 'data-table':
      return generateTableHTML(d, title, idx)
    case 'form':
      return generateFormHTML(d, title, idx)
    case 'chart':
      return generateChartHTML(d, title, idx)
    case 'card':
      return generateCardHTML(d, title, idx)
    case 'search-bar':
      return generateSearchHTML(d, title, idx)
    case 'notification':
      return generateNotificationHTML(d, title, idx)
    default:
      return ''
  }
}

function generateTableHTML(d: any, title: string, idx: number): string {
  const cols: any[] = d.columns ?? [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]
  const thCells = cols.map(c =>
    `<th onclick="sortTable(${idx},'${c.key}')" style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #e5e7eb;cursor:pointer;user-select:none;white-space:nowrap">
      ${c.label} <span id="sort-${idx}-${c.key}" style="color:#9ca3af"></span>
    </th>`
  ).join('')

  const fakeRow = () => cols.map(c => {
    const k = c.key.toLowerCase()
    let v = ''
    if (k === 'id') v = Math.random().toString(36).slice(2, 10)
    else if (k === 'name' || k === 'fullname') v = ['Alice Chen', 'Bob Wang', 'Carol Liu', 'David Lin', 'Emma Ho', 'Frank Wu'][Math.floor(Math.random() * 6)]
    else if (k === 'email') v = ['alice@example.com', 'bob@test.com', 'carol@demo.com', 'david@app.com'][Math.floor(Math.random() * 4)]
    else if (k === 'role' || k === 'status' || c.type === 'badge') {
      const badges: Record<string, string> = { admin: '#1D9E75', user: '#185FA5', guest: '#BA7517', active: '#1D9E75', inactive: '#6b7280', pending: '#BA7517' }
      const vals = ['active', 'inactive', 'pending', 'admin', 'user']
      const val = vals[Math.floor(Math.random() * vals.length)]
      const color = badges[val] ?? '#6b7280'
      return `<td style="padding:10px 14px"><span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500;background:${color}20;color:${color}">${val}</span></td>`
    }
    else if (c.type === 'date' || k.includes('at') || k.includes('date')) {
      const d = new Date(Date.now() - Math.random() * 30 * 86400000)
      v = d.toLocaleDateString('zh-TW')
    }
    else if (c.type === 'number' || k.includes('count') || k.includes('total') || k.includes('price')) v = String(Math.floor(Math.random() * 1000))
    else v = ['Draft', 'Published', 'Active', 'Pending'][Math.floor(Math.random() * 4)]
    return `<td style="padding:10px 14px;font-size:13px;color:#374151">${v}</td>`
  }).join('')

  const rows = Array.from({ length: 6 }, () =>
    `<tr style="border-bottom:1px solid #f3f4f6;cursor:pointer" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">${fakeRow()}</tr>`
  ).join('')

  return `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:20px">
      <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between">
        <div>
          <h3 style="font-size:15px;font-weight:600;margin:0;color:#111">${title}</h3>
          <p style="font-size:12px;color:#9ca3af;margin:2px 0 0">6 筆資料</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${d.searchable ? `<input id="search-${idx}" oninput="filterTable(${idx},this.value)" placeholder="🔍 搜尋..." style="padding:7px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;outline:none;width:180px">` : ''}
          <button style="padding:7px 14px;background:#185FA5;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500">+ 新增</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table id="table-${idx}" style="width:100%;border-collapse:collapse">
          <thead style="background:#f9fafb"><tr>${thCells}</tr></thead>
          <tbody id="tbody-${idx}">${rows}</tbody>
        </table>
      </div>
      ${d.pagination ? `
      <div style="padding:12px 20px;border-top:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:13px;color:#6b7280">第 1 頁，共 3 頁（18 筆）</span>
        <div style="display:flex;gap:4px">
          <button style="padding:6px 12px;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:13px;background:white" onclick="">←</button>
          <button style="padding:6px 12px;border:1px solid #185FA5;border-radius:6px;cursor:pointer;font-size:13px;background:#185FA5;color:white">1</button>
          <button style="padding:6px 12px;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:13px;background:white">2</button>
          <button style="padding:6px 12px;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer;font-size:13px;background:white">→</button>
        </div>
      </div>` : ''}
    </div>`
}

function generateFormHTML(d: any, title: string, idx: number): string {
  const fields: any[] = d.fields ?? [{ name: 'name', label: 'Name', type: 'text', required: true }]
  const fieldHTML = fields.map(f => {
    const id = `form-${idx}-${f.name}`
    let input = ''
    if (f.type === 'textarea') {
      input = `<textarea id="${id}" rows="3" placeholder="${f.placeholder ?? ''}" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;outline:none;font-size:13px;resize:vertical;font-family:inherit" onfocus="this.style.borderColor='#185FA5'" onblur="this.style.borderColor='#e5e7eb'"></textarea>`
    } else if (f.type === 'select') {
      const opts = (f.options ?? []).map((o: any) => `<option value="${o.value}">${o.label}</option>`).join('')
      input = `<select id="${id}" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;outline:none;font-size:13px;background:white"><option value="">選擇...</option>${opts}</select>`
    } else if (f.type === 'checkbox') {
      input = `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="${id}" style="width:16px;height:16px;cursor:pointer"> <span style="font-size:13px;font-weight:400;color:#374151">${f.label}</span></label>`
    } else {
      input = `<input type="${f.type ?? 'text'}" id="${id}" placeholder="${f.placeholder ?? 'Enter ' + f.label.toLowerCase()}" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;outline:none;font-size:13px;box-sizing:border-box" onfocus="this.style.borderColor='#185FA5'" onblur="this.style.borderColor='#e5e7eb'">`
    }
    const req = f.required ? '<span style="color:#ef4444">*</span>' : ''
    return `
      <div style="margin-bottom:16px">
        ${f.type !== 'checkbox' ? `<label for="${id}" style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px">${f.label} ${req}</label>` : ''}
        ${input}
        <div id="err-${id}" style="font-size:12px;color:#ef4444;margin-top:4px;display:none"></div>
      </div>`
  }).join('')

  return `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:20px;max-width:520px">
      <h3 style="font-size:15px;font-weight:600;margin:0 0 20px;color:#111">${title}</h3>
      <div id="success-${idx}" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#166534">✅ 提交成功！</div>
      ${fieldHTML}
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
        <button onclick="this.closest('form,div').querySelectorAll('input,textarea,select').forEach(el=>el.value='')" style="padding:9px 20px;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;cursor:pointer;background:white;color:#374151">取消</button>
        <button onclick="document.getElementById('success-${idx}').style.display='block';setTimeout(()=>document.getElementById('success-${idx}').style.display='none',2500)" style="padding:9px 20px;background:#185FA5;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500">提交</button>
      </div>
    </div>`
}

function generateChartHTML(d: any, title: string, idx: number): string {
  const type = d.chartType ?? 'bar'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const values = months.map(() => Math.floor(Math.random() * 80) + 20)
  const maxVal = Math.max(...values)
  const w = 34, gap = 5, h = 130

  let svgContent = ''
  if (type === 'bar' || type === 'column') {
    svgContent = months.map((m, i) => {
      const bh = Math.round((values[i] / maxVal) * h)
      const x = i * (w + gap) + 30
      const y = h - bh + 20
      return `<rect x="${x}" y="${y}" width="${w}" height="${bh}" fill="#185FA5" rx="3" opacity="0.85" style="cursor:pointer" onmouseover="this.setAttribute('opacity','1')" onmouseout="this.setAttribute('opacity','0.85')"/><text x="${x + w / 2}" y="${h + 38}" text-anchor="middle" font-size="9" fill="#9ca3af">${m}</text>`
    }).join('')
  } else if (type === 'line' || type === 'area') {
    const pts = months.map((m, i) => `${i * (w + gap) + 30 + w / 2},${h - Math.round((values[i] / maxVal) * h) + 20}`).join(' ')
    const areaFill = type === 'area' ? `<polygon points="${pts} ${months.length * (w + gap) + 30},${h + 20} 30,${h + 20}" fill="#185FA5" opacity="0.1"/>` : ''
    const dots = months.map((m, i) => {
      const cx = i * (w + gap) + 30 + w / 2
      const cy = h - Math.round((values[i] / maxVal) * h) + 20
      return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#185FA5" style="cursor:pointer"/>`
    }).join('')
    const labels = months.map((m, i) => `<text x="${i * (w + gap) + 30 + w / 2}" y="${h + 38}" text-anchor="middle" font-size="9" fill="#9ca3af">${m}</text>`).join('')
    svgContent = `${areaFill}<polyline points="${pts}" fill="none" stroke="#185FA5" stroke-width="2.5"/>${dots}${labels}`
  } else if (type === 'pie' || type === 'donut') {
    const slices = [
      { pct: 0.4, color: '#185FA5', label: 'A' },
      { pct: 0.3, color: '#1D9E75', label: 'B' },
      { pct: 0.2, color: '#BA7517', label: 'C' },
      { pct: 0.1, color: '#D4537E', label: 'D' },
    ]
    let startAngle = -Math.PI / 2
    const cx = 100, cy = 90, r = type === 'donut' ? 60 : 70, inner = type === 'donut' ? 35 : 0
    svgContent = slices.map(s => {
      const endAngle = startAngle + s.pct * Math.PI * 2
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
      const large = s.pct > 0.5 ? 1 : 0
      const path = inner > 0
        ? `M ${cx + inner * Math.cos(startAngle)} ${cy + inner * Math.sin(startAngle)} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${cx + inner * Math.cos(endAngle)} ${cy + inner * Math.sin(endAngle)} A ${inner} ${inner} 0 ${large} 0 ${cx + inner * Math.cos(startAngle)} ${cy + inner * Math.sin(startAngle)} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
      const result = `<path d="${path}" fill="${s.color}" opacity="0.9" style="cursor:pointer" onmouseover="this.setAttribute('opacity','1')" onmouseout="this.setAttribute('opacity','0.9')"/>`
      startAngle = endAngle
      return result
    }).join('')
    const svgW = (months.length * (w + gap) + 60)
    return `
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
        <h3 style="font-size:15px;font-weight:600;margin:0 0 16px;color:#111">${title}</h3>
        <div style="display:flex;align-items:center;gap:20px">
          <svg width="200" height="180" viewBox="0 0 200 180">${svgContent}</svg>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${slices.map((s, i) => `<div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;border-radius:3px;background:${s.color}"></div><span style="font-size:13px;color:#374151">項目 ${s.label} (${Math.round(s.pct * 100)}%)</span></div>`).join('')}
          </div>
        </div>
      </div>`
  }

  const svgW = months.length * (w + gap) + 60
  return `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
      <h3 style="font-size:15px;font-weight:600;margin:0 0 16px;color:#111">${title}</h3>
      <svg width="100%" viewBox="0 0 ${svgW} 175" style="overflow:visible">${svgContent}</svg>
    </div>`
}

function generateCardHTML(d: any, title: string, idx: number): string {
  const fields: any[] = d.fields ?? [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }]
  const rows = fields.map(f => {
    let val = ''
    if (f.key === 'email' || f.type === 'email') val = 'user@example.com'
    else if (f.type === 'date' || f.key.includes('At') || f.key.includes('date')) val = new Date().toLocaleDateString('zh-TW')
    else if (f.type === 'number') val = '42'
    else val = 'Sample ' + f.label
    return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f3f4f6"><span style="font-size:13px;color:#6b7280">${f.label}</span><span style="font-size:13px;font-weight:500;color:#111">${val}</span></div>`
  }).join('')
  const actions: any[] = d.actions ?? [{ label: 'Edit', variant: 'secondary' }, { label: 'Delete', variant: 'danger' }]
  const btns = actions.map(a => {
    const bg = a.variant === 'primary' ? '#185FA5' : a.variant === 'danger' ? '#ef4444' : 'white'
    const color = a.variant === 'secondary' ? '#374151' : 'white'
    const border = a.variant === 'secondary' ? '1px solid #e5e7eb' : 'none'
    return `<button style="padding:8px 16px;background:${bg};color:${color};border:${border};border-radius:8px;font-size:13px;cursor:pointer;font-weight:500">${a.label}</button>`
  }).join('')
  return `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;max-width:400px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:48px;height:48px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#1d4ed8">${d.dataType?.charAt(0) ?? 'U'}</div>
        <div><div style="font-size:15px;font-weight:600;color:#111">Sample ${d.dataType ?? 'Item'}</div><div style="font-size:12px;color:#9ca3af">ID: abc-123</div></div>
      </div>
      ${rows}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">${btns}</div>
    </div>`
}

function generateSearchHTML(d: any, title: string, idx: number): string {
  const suggestions = ['User — john@example.com', 'Product — Premium Plan #1234', 'Order — #ORD-5678', 'Setting — Profile Configuration']
  const suggHTML = suggestions.map(s =>
    `<div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">› ${s}</div>`
  ).join('')
  return `
    <div style="margin-bottom:20px;max-width:480px">
      <div style="position:relative">
        <input id="srch-${idx}" type="text" placeholder="${d.placeholder ?? '🔍 搜尋...'}" oninput="document.getElementById('srch-res-${idx}').style.display=this.value?'block':'none'"
          style="width:100%;padding:10px 14px 10px 38px;border:1px solid #e5e7eb;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box"
          onfocus="this.style.borderColor='#185FA5';if(this.value)document.getElementById('srch-res-${idx}').style.display='block'"
          onblur="this.style.borderColor='#e5e7eb';setTimeout(()=>{let el=document.getElementById('srch-res-${idx}');if(el)el.style.display='none'},200)">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:16px">🔍</span>
        <div id="srch-res-${idx}" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;z-index:10;box-shadow:0 4px 12px rgba(0,0,0,.1)">
          ${suggHTML}
        </div>
      </div>
    </div>`
}

function generateNotificationHTML(d: any, title: string, idx: number): string {
  const types = [
    { type: 'success', bg: '#f0fdf4', border: '#86efac', icon: '✓', title: 'Success', msg: '操作已成功完成', color: '#166534' },
    { type: 'error', bg: '#fef2f2', border: '#fca5a5', icon: '✕', title: 'Error', msg: '發生錯誤，請再試一次', color: '#991b1b' },
    { type: 'warning', bg: '#fffbeb', border: '#fcd34d', icon: '⚠', title: 'Warning', msg: '此操作無法復原', color: '#92400e' },
    { type: 'info', bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ', title: 'Info', msg: '有新的更新可用', color: '#1e40af' },
  ]
  return `
    <div style="margin-bottom:20px;max-width:400px;display:flex;flex-direction:column;gap:10px">
      ${types.map(t => `
        <div style="background:${t.bg};border:1px solid ${t.border};border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:10px">
          <span style="color:${t.color};font-weight:700;flex-shrink:0;font-size:15px">${t.icon}</span>
          <div style="flex:1"><div style="font-size:13px;font-weight:600;color:${t.color}">${t.title}</div><div style="font-size:12px;color:#374151;margin-top:2px">${t.msg}</div></div>
          <span style="color:#9ca3af;cursor:pointer;font-size:16px" onclick="this.closest('div[style]').remove()">×</span>
        </div>`).join('')}
    </div>`
}

// ─── Stat card for dashboard pages ────────────────────────────────────
function generateStatCards(): string {
  const stats = [
    { label: '總使用者', value: '2,847', change: '+12.5%', icon: '👥', color: '#185FA5', bg: '#dbeafe' },
    { label: '本月訂單', value: '1,234', change: '+8.2%', icon: '🛒', color: '#1D9E75', bg: '#dcfce7' },
    { label: '總收入', value: 'NT$89,420', change: '+15.3%', icon: '💰', color: '#BA7517', bg: '#fef3c7' },
    { label: '活躍用戶', value: '574', change: '-2.1%', icon: '📊', color: '#7F77DD', bg: '#ede9fe' },
  ]
  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
    ${stats.map(s => `
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:13px;color:#6b7280;font-weight:500">${s.label}</span>
          <div style="width:36px;height:36px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;font-size:18px">${s.icon}</div>
        </div>
        <div style="font-size:24px;font-weight:700;color:#111;margin-bottom:4px">${s.value}</div>
        <div style="font-size:12px;color:${s.change.startsWith('+') ? '#1D9E75' : '#ef4444'}">${s.change} 較上月</div>
      </div>`).join('')}
  </div>`
}

// ─── Main HTML generator ──────────────────────────────────────────────
export function generateAppPreviewHTML(nodes: CanvasNode[]): string {
  const config = analyseCanvas(nodes)
  const { pages, appName, navType, navItems, hasAuth, primaryColor } = config

  // Page content generators
  const pageContents = pages.map((page, pi) => {
    const isDashboard = page.path === '/' || page.title.toLowerCase().includes('dashboard')
    const uiHTML = page.uiBlocks.map((n, i) => generateBlockHTML(n, pi * 100 + i)).join('')

    return `<div id="page-${pi}" class="page" style="display:${pi === 0 ? 'block' : 'none'};padding:24px;overflow-y:auto;height:100%">
      <div style="margin-bottom:20px">
        <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 4px">${page.icon} ${page.title}</h2>
        <p style="font-size:13px;color:#9ca3af;margin:0">${page.title} 管理頁面</p>
      </div>
      ${isDashboard ? generateStatCards() : ''}
      ${uiHTML}
      ${!uiHTML && !isDashboard ? `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#9ca3af"><div style="font-size:48px;margin-bottom:12px">${page.icon}</div><p style="font-size:15px;font-weight:500">${page.title} 頁面</p><p style="font-size:13px">此頁面尚無 UI 積木配置</p></div>` : ''}
    </div>`
  }).join('')

  // Sidebar navigation
  const sidebarNav = `
    <div style="width:220px;flex-shrink:0;background:white;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;height:100%">
      <div style="padding:20px 16px;border-bottom:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;background:#185FA5;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:white">⊞</div>
          <span style="font-size:15px;font-weight:700;color:#111">${appName}</span>
        </div>
      </div>
      <nav style="flex:1;padding:12px 8px;overflow-y:auto">
        ${pages.map((p, i) => `
          <button onclick="showPage(${i})" id="nav-${i}" style="width:100%;display:flex;align-items:center;gap:10px;padding:9px 12px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;text-align:left;margin-bottom:2px;background:${i === 0 ? '#eff6ff' : 'transparent'};color:${i === 0 ? '#185FA5' : '#374151'}" onmouseover="if(this.id!='nav-active')this.style.background='#f9fafb'" onmouseout="if(this.id!='nav-active')this.style.background='transparent'">
            <span style="font-size:16px">${p.icon}</span>
            ${p.title}
          </button>`).join('')}
      </nav>
      ${hasAuth ? `
      <div style="padding:12px;border-top:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:10px;padding:8px">
          <div style="width:32px;height:32px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#1d4ed8">U</div>
          <div><div style="font-size:13px;font-weight:500">User</div><div style="font-size:11px;color:#9ca3af">user@example.com</div></div>
        </div>
      </div>` : ''}
    </div>`

  // Top navbar
  const topNav = `
    <div style="height:56px;flex-shrink:0;background:white;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;padding:0 20px;gap:4px">
      <div style="display:flex;align-items:center;gap:10px;margin-right:24px">
        <div style="width:28px;height:28px;background:#185FA5;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white">⊞</div>
        <span style="font-size:15px;font-weight:700;color:#111">${appName}</span>
      </div>
      ${pages.map((p, i) => `
        <button onclick="showPage(${i})" id="nav-${i}" style="padding:7px 14px;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;background:${i === 0 ? '#eff6ff' : 'transparent'};color:${i === 0 ? '#185FA5' : '#374151'}">
          ${p.icon} ${p.title}
        </button>`).join('')}
      <div style="flex:1"></div>
      ${hasAuth ? `<div style="width:32px;height:32px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#1d4ed8;cursor:pointer">U</div>` : ''}
    </div>`

  const layout = navType === 'sidebar'
    ? `<div style="display:flex;height:100%">${sidebarNav}<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">${pageContents}</div></div>`
    : `<div style="display:flex;flex-direction:column;height:100%">${topNav}<div style="flex:1;overflow:hidden">${pageContents}</div></div>`

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${appName} Preview</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; background: #f9fafb; height: 100vh; overflow: hidden; }
.page { animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
button:focus { outline: none; } input:focus { outline: 2px solid #185FA5; outline-offset: 1px; }
</style>
</head><body>
<div style="height:100vh;overflow:hidden">${layout}</div>
<script>
let currentPage = 0;
function showPage(idx) {
  document.querySelectorAll('.page').forEach(el => el.style.display = 'none');
  const el = document.getElementById('page-' + idx);
  if (el) el.style.display = 'block';
  document.querySelectorAll('[id^="nav-"]').forEach((btn, i) => {
    btn.style.background = i === idx ? '#eff6ff' : 'transparent';
    btn.style.color = i === idx ? '#185FA5' : '#374151';
  });
  currentPage = idx;
}
function sortTable(tblIdx, key) {
  const tb = document.getElementById('tbody-' + tblIdx);
  if (!tb) return;
  const rows = Array.from(tb.querySelectorAll('tr'));
  rows.sort((a, b) => a.textContent.localeCompare(b.textContent));
  rows.forEach(r => tb.appendChild(r));
}
function filterTable(tblIdx, q) {
  const tb = document.getElementById('tbody-' + tblIdx);
  if (!tb) return;
  tb.querySelectorAll('tr').forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
</script>
</body></html>`
}
