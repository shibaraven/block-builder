import type { BlockData } from '@block-builder/types'

// ─── Build full HTML for iframe srcdoc ───────────────────────────────
function html(body: string, extra = ''): string {
  return [
    '<!DOCTYPE html><html><head><meta charset="utf-8">',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/faker.js/6.6.6/faker.min.js"></script>',
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@3/base.css">',
    '<style>',
    '* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; font-size: 13px; }',
    'body { padding: 16px; background: #fafafa; }',
    'table { width: 100%; border-collapse: collapse; }',
    'th { background: #f9fafb; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e5e7eb; }',
    'td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }',
    'tr:hover td { background: #f9fafb; }',
    'input, select, textarea { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; margin-bottom: 4px; }',
    'input:focus, select:focus, textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }',
    'label { font-size: 12px; font-weight: 500; color: #374151; display: block; margin-bottom: 4px; }',
    '.field { margin-bottom: 14px; }',
    '.err { color: #dc2626; font-size: 11px; margin-top: 3px; display: none; }',
    '.err.show { display: block; }',
    '.btn { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; font-size: 13px; }',
    '.btn-primary { background: #2563eb; color: white; }',
    '.btn-primary:hover { background: #1d4ed8; }',
    '.btn-secondary { background: #f3f4f6; color: #374151; margin-right: 8px; }',
    '.badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }',
    '.badge-green { background: #dcfce7; color: #166534; }',
    '.badge-red { background: #fee2e2; color: #991b1b; }',
    '.badge-blue { background: #dbeafe; color: #1e40af; }',
    '.badge-gray { background: #f3f4f6; color: #374151; }',
    '.sort-btn { cursor: pointer; user-select: none; }',
    '.sort-btn:hover { color: #111; }',
    '.search { padding: 7px 12px; border: 1px solid #e5e7eb; border-radius: 8px; width: 100%; margin-bottom: 12px; outline: none; }',
    '.search:focus { border-color: #3b82f6; }',
    '.pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; color: #6b7280; font-size: 12px; }',
    '.page-btn { padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; background: white; }',
    '.page-btn:disabled { opacity: 0.4; cursor: default; }',
    extra,
    '</style></head><body>',
    body,
    '</body></html>',
  ].join('\n')
}

// ─── DataTable with real faker data + sort + search + pagination ──────
function dataTableHtml(data: any): string {
  const cols: string[] = data.columns ?? []
  const searchable: boolean = data.searchable ?? false
  const paginated: boolean = data.pagination ?? false
  const dataType: string = data.dataType ?? 'Item'

  const thCells = cols.map((c: any) =>
    '<th class="sort-btn" onclick="sort(\'' + c.key + '\')">' + c.label + ' <span id="sort-' + c.key + '"></span></th>'
  ).join('')

  const fakerRow = cols.map((c: any) => {
    const k: string = c.key
    let val: string
    if (k === 'id') val = 'faker.datatype.uuid().slice(0,8)'
    else if (k === 'email') val = 'faker.internet.email()'
    else if (k === 'name') val = 'faker.name.fullName()'
    else if (k === 'firstName') val = 'faker.name.firstName()'
    else if (k === 'lastName') val = 'faker.name.lastName()'
    else if (k === 'phone') val = 'faker.phone.number()'
    else if (k === 'address') val = 'faker.address.streetAddress()'
    else if (k === 'city') val = 'faker.address.city()'
    else if (c.type === 'number') val = 'faker.datatype.number({min:1,max:100})'
    else if (c.type === 'date') val = 'faker.date.recent(30).toLocaleDateString()'
    else if (c.type === 'badge') val = 'faker.helpers.arrayElement(["Active","Inactive","Pending"])'
    else val = 'faker.lorem.words(2)'
    return k + ': ' + val
  }).join(', ')

  const tdCells = cols.map((c: any) => {
    if (c.type === 'badge') {
      return '<td><span class="badge badge-' +
        '" id="badge-' + c.key + '" data-key="' + c.key + '"></span></td>'
    }
    return '<td data-key="' + c.key + '"></td>'
  }).join('')

  const script = [
    '<script>',
    'var allData = [], filtered = [], sortKey = null, sortDir = 1, page = 1, pageSize = 8;',
    'function genData() {',
    '  allData = Array.from({length:24}, () => ({' + fakerRow + '}));',
    '  filtered = [...allData]; render();',
    '}',
    'function render() {',
    '  var start = (page-1)*pageSize, end = start+pageSize;',
    '  var rows = filtered.slice(start, end);',
    '  var tbody = document.getElementById("tbody");',
    '  tbody.innerHTML = rows.map(row => "<tr>' + tdCells.replace(/'/g, "\\'") + '</tr>").join("");',
    '  tbody.querySelectorAll("[data-key]").forEach(function(el) {',
    '    var v = row = null;',
    '    var tr = el.closest("tr");',
    '    var idx = Array.from(tbody.querySelectorAll("tr")).indexOf(tr);',
    '    var d = rows[idx];',
    '    if (d) el.textContent = d[el.dataset.key] ?? "";',
    '  });',
    // simpler render approach
    '  tbody.innerHTML = "";',
    '  rows.forEach(function(row) {',
    '    var tr = document.createElement("tr");',
    '    tr.innerHTML = ' + JSON.stringify(tdCells) + ';',
    '    tr.querySelectorAll("[data-key]").forEach(function(td) {',
    '      var v = row[td.dataset.key] ?? "";',
    '      if (td.querySelector(".badge")) {',
    '        var b = td.querySelector(".badge");',
    '        b.textContent = v;',
    '        b.className = "badge " + (v==="Active"?"badge-green":v==="Inactive"?"badge-red":"badge-blue");',
    '      } else { td.textContent = v; }',
    '    });',
    '    tbody.appendChild(tr);',
    '  });',
    '  var info = document.getElementById("page-info");',
    '  if (info) info.textContent = "第 "+page+" 頁，共 "+Math.ceil(filtered.length/pageSize)+" 頁（"+filtered.length+" 筆）";',
    '  document.getElementById("btn-prev") && (document.getElementById("btn-prev").disabled = page<=1);',
    '  document.getElementById("btn-next") && (document.getElementById("btn-next").disabled = page>=Math.ceil(filtered.length/pageSize));',
    '}',
    'function sort(k) {',
    '  if (sortKey===k) sortDir*=-1; else { sortKey=k; sortDir=1; }',
    '  filtered.sort(function(a,b){ return String(a[k]).localeCompare(String(b[k]))*sortDir; });',
    '  document.querySelectorAll("[id^=sort-]").forEach(function(el){ el.textContent=""; });',
    '  var el = document.getElementById("sort-"+k);',
    '  if (el) el.textContent = sortDir===1?" ↑":" ↓";',
    '  page=1; render();',
    '}',
    searchable ? [
      'document.getElementById("search").addEventListener("input", function(e) {',
      '  var q = e.target.value.toLowerCase();',
      '  filtered = allData.filter(function(row) {',
      '    return Object.values(row).some(function(v){ return String(v).toLowerCase().includes(q); });',
      '  });',
      '  page=1; render();',
      '});',
    ].join('\n') : '',
    paginated ? [
      'document.getElementById("btn-prev").onclick = function(){ if(page>1){page--;render();} };',
      'document.getElementById("btn-next").onclick = function(){ if(page<Math.ceil(filtered.length/pageSize)){page++;render();} };',
    ].join('\n') : '',
    'window.onload = genData;',
    '</script>',
  ].join('\n')

  const searchHtml = searchable
    ? '<input class="search" id="search" placeholder="🔍 搜尋 ' + dataType + '..." />'
    : ''

  const paginationHtml = paginated
    ? '<div class="pagination"><span id="page-info"></span><div><button class="page-btn" id="btn-prev">←</button> <button class="page-btn" id="btn-next">→</button></div></div>'
    : ''

  const tableHtml = [
    searchHtml,
    '<div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">',
    '<table><thead><tr>' + thCells + '</tr></thead>',
    '<tbody id="tbody"></tbody></table>',
    '</div>',
    paginationHtml,
    script,
  ].join('\n')

  return html(tableHtml)
}

// ─── Form with real Zod-style validation ──────────────────────────────
function formHtml(data: any): string {
  const fields: any[] = data.fields ?? []
  const name: string = data.componentName ?? 'Form'

  const fieldHtml = fields.map((f: any) => {
    const id = 'field_' + f.name
    let input: string
    if (f.type === 'textarea') {
      input = '<textarea id="' + id + '" rows="3" placeholder="' + (f.placeholder ?? '') + '"></textarea>'
    } else if (f.type === 'select') {
      const opts = (f.options ?? []).map((o: any) => '<option value="' + o.value + '">' + o.label + '</option>').join('')
      input = '<select id="' + id + '"><option value="">選擇...</option>' + opts + '</select>'
    } else if (f.type === 'checkbox') {
      input = '<label style="display:flex;align-items:center;gap:8px;font-weight:400"><input type="checkbox" id="' + id + '" style="width:16px;height:16px" /> ' + f.label + '</label>'
    } else {
      input = '<input type="' + (f.type ?? 'text') + '" id="' + id + '" placeholder="' + (f.placeholder ?? 'Enter ' + f.label.toLowerCase()) + '" />'
    }
    const req = f.required ? ' <span style="color:#dc2626">*</span>' : ''
    return [
      '<div class="field">',
      f.type !== 'checkbox' ? '<label for="' + id + '">' + f.label + req + '</label>' : '',
      input,
      '<div class="err" id="err_' + f.name + '"></div>',
      '</div>',
    ].join('\n')
  }).join('\n')

  const validations = fields.filter((f: any) => f.required || f.type === 'email').map((f: any) => {
    const lines: string[] = []
    lines.push('  var v' + f.name + ' = document.getElementById("field_' + f.name + '").value;')
    if (f.required) {
      lines.push('  if (!v' + f.name + '.trim()) { showErr("' + f.name + '", "' + f.label + ' 為必填"); ok=false; }')
    }
    if (f.type === 'email') {
      lines.push('  else if (!/^[^@]+@[^@]+\\.[^@]+$/.test(v' + f.name + ')) { showErr("' + f.name + '", "請輸入有效的 Email"); ok=false; }')
    }
    return lines.join('\n')
  }).join('\n')

  const script = [
    '<script>',
    'function showErr(name, msg) {',
    '  var el = document.getElementById("err_"+name);',
    '  if (el) { el.textContent = msg; el.classList.add("show"); }',
    '}',
    'function clearErrs() {',
    '  document.querySelectorAll(".err").forEach(function(el){ el.classList.remove("show"); });',
    '}',
    'document.getElementById("submit-btn").onclick = function() {',
    '  clearErrs();',
    '  var ok = true;',
    validations,
    '  if (ok) {',
    '    document.getElementById("success-msg").style.display = "block";',
    '    setTimeout(function(){ document.getElementById("success-msg").style.display = "none"; }, 2000);',
    '  }',
    '};',
    'document.getElementById("cancel-btn").onclick = function() {',
    '  document.querySelectorAll("input,textarea,select").forEach(function(el){ el.value = ""; });',
    '  clearErrs();',
    '};',
    '</script>',
  ].join('\n')

  const body = [
    '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:20px">',
    '<h3 style="font-size:14px;font-weight:600;margin-bottom:16px;color:#111">' + name.replace(/([A-Z])/g, ' $1').trim() + '</h3>',
    '<div id="success-msg" style="display:none;background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px">✅ 提交成功！</div>',
    fieldHtml,
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">',
    '<button class="btn btn-secondary" id="cancel-btn">取消</button>',
    '<button class="btn btn-primary" id="submit-btn">提交</button>',
    '</div>',
    '</div>',
    script,
  ].join('\n')

  return html(body)
}

// ─── Chart ────────────────────────────────────────────────────────────
function chartHtml(data: any): string {
  const type: string = data.chartType ?? 'bar'
  const name: string = data.componentName ?? 'Chart'

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const values = months.map(() => Math.floor(Math.random() * 80) + 20)
  const max = Math.max(...values)
  const w = 36, gap = 6, h = 120

  let chartSvg: string
  if (type === 'bar') {
    const bars = months.map((m, i) => {
      const bh = Math.round((values[i] / max) * h)
      const x = i * (w + gap) + 20
      const y = h - bh + 20
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + bh + '" fill="#2563eb" rx="3" opacity="0.85"/>' +
        '<text x="' + (x + w/2) + '" y="' + (h + 35) + '" text-anchor="middle" font-size="9" fill="#9ca3af">' + m + '</text>'
    }).join('')
    chartSvg = '<svg width="100%" viewBox="0 0 ' + (months.length*(w+gap)+40) + ' 160">' + bars + '</svg>'
  } else if (type === 'line' || type === 'area') {
    const pts = months.map((m, i) => (i*(w+gap)+20+w/2) + ',' + (h - Math.round((values[i]/max)*h) + 20)).join(' ')
    const area = type === 'area'
      ? '<polygon points="' + pts + ' ' + (months.length*(w+gap)) + ',140 20,140" fill="#dbeafe" opacity="0.5"/>'
      : ''
    const dots = months.map((m, i) => {
      const cx = i*(w+gap)+20+w/2
      const cy = h - Math.round((values[i]/max)*h) + 20
      return '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#2563eb"/>'
    }).join('')
    const labels = months.map((m, i) => '<text x="' + (i*(w+gap)+20+w/2) + '" y="155" text-anchor="middle" font-size="9" fill="#9ca3af">' + m + '</text>').join('')
    chartSvg = '<svg width="100%" viewBox="0 0 ' + (months.length*(w+gap)+40) + ' 165">' + area + '<polyline points="' + pts + '" fill="none" stroke="#2563eb" stroke-width="2"/>' + dots + labels + '</svg>'
  } else {
    chartSvg = '<div style="padding:20px;color:#6b7280;text-align:center">Chart type: ' + type + '</div>'
  }

  const body = '<div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:16px"><p style="font-size:13px;font-weight:600;margin-bottom:12px;color:#111">' + name + '</p>' + chartSvg + '</div>'
  return html(body)
}

// ─── Navigation ───────────────────────────────────────────────────────
function navigationHtml(data: any): string {
  const items: any[] = data.items ?? []
  const type: string = data.type ?? 'navbar'
  const name: string = data.componentName ?? 'Navigation'

  if (type === 'sidebar') {
    const links = items.map((item: any, i: number) =>
      '<a href="#" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;text-decoration:none;' +
      (i === 0 ? 'background:#eff6ff;color:#1d4ed8;font-weight:500' : 'color:#374151') +
      '" onclick="setActive(this,event)">' + item.label + '</a>'
    ).join('')
    const script = '<script>function setActive(el,e){e.preventDefault();document.querySelectorAll("a").forEach(function(a){a.style.background="";a.style.color="#374151";a.style.fontWeight=""});el.style.background="#eff6ff";el.style.color="#1d4ed8";el.style.fontWeight="500";}</script>'
    return html('<div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:12px;width:180px">' + links + '</div>' + script)
  }

  if (type === 'tabs') {
    const tabs = items.map((item: any, i: number) =>
      '<button onclick="setTab(this,event)" style="padding:8px 16px;border:none;background:none;cursor:pointer;' +
      (i === 0 ? 'color:#2563eb;border-bottom:2px solid #2563eb' : 'color:#6b7280;border-bottom:2px solid transparent') +
      '">' + item.label + '</button>'
    ).join('')
    const script = '<script>function setTab(el,e){document.querySelectorAll("button").forEach(function(b){b.style.color="#6b7280";b.style.borderBottomColor="transparent"});el.style.color="#2563eb";el.style.borderBottomColor="#2563eb";}</script>'
    return html('<div style="border-bottom:1px solid #e5e7eb">' + tabs + '</div>' + script)
  }

  // navbar
  const links = items.map((item: any, i: number) =>
    '<a href="#" style="padding:6px 12px;border-radius:7px;text-decoration:none;' +
    (i === 0 ? 'background:#eff6ff;color:#1d4ed8;font-weight:500' : 'color:#374151') +
    '" onclick="setActive(this,event)">' + item.label + '</a>'
  ).join('')
  const script = '<script>function setActive(el,e){e.preventDefault();document.querySelectorAll("nav a").forEach(function(a){a.style.background="";a.style.color="#374151";a.style.fontWeight=""});el.style.background="#eff6ff";el.style.color="#1d4ed8";el.style.fontWeight="500";}</script>'
  const authBtn = data.auth ? '<button style="padding:6px 14px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">Account</button>' : ''
  return html('<div style="background:white;border:1px solid #e5e7eb;border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:4px"><strong style="margin-right:20px;font-size:14px">App</strong><nav style="display:flex;gap:4px;flex:1">' + links + '</nav>' + authBtn + '</div>' + script)
}

// ─── SearchBar ────────────────────────────────────────────────────────
function searchBarHtml(data: any): string {
  const placeholder: string = data.placeholder ?? '搜尋...'
  const results = ['User — john@example.com', 'Product — Premium Plan', 'Order — #ORD-1234', 'Settings — Profile']
  const resultHtml = results.map((r: string) =>
    '<div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f3f4f6;color:#374151" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'">› ' + r + '</div>'
  ).join('')
  const script = [
    '<script>',
    'document.getElementById("q").addEventListener("input", function(e) {',
    '  document.getElementById("results").style.display = e.target.value ? "block" : "none";',
    '});',
    'document.getElementById("q").addEventListener("blur", function() {',
    '  setTimeout(function(){ document.getElementById("results").style.display="none"; }, 200);',
    '});',
    '</script>',
  ].join('\n')
  const body = [
    '<div style="position:relative">',
    '<input id="q" type="text" placeholder="' + placeholder + '" style="width:100%;padding:8px 12px 8px 32px;border:1px solid #e5e7eb;border-radius:8px;outline:none" onfocus="this.style.borderColor=\'#3b82f6\'">',
    '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af">🔍</span>',
    '<div id="results" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:white;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;z-index:10">',
    resultHtml,
    '</div>',
    '</div>',
    script,
  ].join('\n')
  return html(body)
}

// ─── Notification ─────────────────────────────────────────────────────
function notificationHtml(data: any): string {
  const types: string[] = data.types ?? ['success', 'error', 'warning', 'info']
  const configs: Record<string, { bg: string; border: string; icon: string; color: string; title: string; msg: string }> = {
    success: { bg: '#f0fdf4', border: '#86efac', icon: '✓', color: '#166534', title: 'Success', msg: 'Operation completed successfully.' },
    error:   { bg: '#fef2f2', border: '#fca5a5', icon: '✕', color: '#991b1b', title: 'Error',   msg: 'Something went wrong. Please try again.' },
    warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠', color: '#92400e', title: 'Warning', msg: 'This action cannot be undone.' },
    info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ', color: '#1e40af', title: 'Info',    msg: 'New update available for your account.' },
  }
  const toasts = types.filter((t: string) => configs[t]).map((t: string) => {
    const c = configs[t]
    return [
      '<div style="background:' + c.bg + ';border:1px solid ' + c.border + ';border-radius:10px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">',
      '<span style="color:' + c.color + ';font-weight:700;flex-shrink:0">' + c.icon + '</span>',
      '<div style="flex:1"><div style="font-weight:600;color:' + c.color + ';margin-bottom:2px">' + c.title + '</div>',
      '<div style="color:#374151;font-size:12px">' + c.msg + '</div></div>',
      '<span style="color:#9ca3af;cursor:pointer" onclick="this.closest(\'div[style*=border-radius]\').remove()">✕</span>',
      '</div>',
    ].join('')
  }).join('\n')
  return html(toasts)
}

// ─── Card ─────────────────────────────────────────────────────────────
function cardHtml(data: any): string {
  const fields: any[] = data.fields ?? []
  const type: string = data.dataType ?? 'Item'
  const rows = fields.map((f: any) => {
    let val: string
    if (f.key === 'id') val = 'abc-123'
    else if (f.type === 'date') val = new Date().toLocaleDateString('zh-TW')
    else if (f.type === 'number') val = '42'
    else val = 'Sample ' + f.label
    return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="color:#6b7280">' + f.label + '</span><span style="font-weight:500">' + val + '</span></div>'
  }).join('')
  const actions: string[] = (data.actions ?? []).map((a: any) =>
    '<button style="padding:7px 14px;border-radius:8px;border:1px solid #e5e7eb;cursor:pointer;background:white;font-size:12px">' + a.label + '</button>'
  )
  const body = [
    '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:20px">',
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">',
    '<div style="width:44px;height:44px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1d4ed8;font-size:18px">' + type.charAt(0) + '</div>',
    '<div><div style="font-weight:600;font-size:14px">Sample ' + type + '</div><div style="color:#9ca3af;font-size:12px">ID: abc-123</div></div>',
    '</div>',
    rows,
    actions.length ? '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' + actions.join('') + '</div>' : '',
    '</div>',
  ].join('\n')
  return html(body)
}

// ─── Main dispatcher ──────────────────────────────────────────────────
export function generatePreviewHtml(blockData: BlockData): string | null {
  const d = blockData as any
  switch (d.kind) {
    case 'data-table':   return dataTableHtml(d)
    case 'form':         return formHtml(d)
    case 'chart':        return chartHtml(d)
    case 'navigation':   return navigationHtml(d)
    case 'search-bar':   return searchBarHtml(d)
    case 'notification': return notificationHtml(d)
    case 'card':         return cardHtml(d)
    default:             return null
  }
}

export const PREVIEWABLE_KINDS = new Set([
  'data-table', 'form', 'card', 'chart', 'navigation', 'search-bar', 'notification',
])
