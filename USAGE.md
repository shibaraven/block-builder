# Block Builder — 如何把生成的代碼用到真實專案

## 方法一：下載 ZIP（最快）

1. 在 Block Builder 畫布設計好積木
2. 點工具列「▶ 生成代碼」
3. 點「⬇ ZIP」下載壓縮檔
4. 解壓到你的專案目錄

```
你的專案/
├── src/
│   ├── types/          ← TypeScript 型別
│   ├── api/routes/     ← API 路由
│   ├── hooks/          ← React Hooks
│   ├── components/     ← UI 組件
│   ├── modules/        ← NestJS 模組
│   └── lib/            ← 工具函式
├── prisma/schema.prisma
├── package.json        ← 已列出所需套件
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
└── vitest.config.ts
```

5. 安裝依賴：

```bash
pnpm install  # 或 npm install
```

6. 如果有 Prisma：

```bash
pnpm db:generate  # 生成 Prisma client
pnpm db:push      # 推送 schema 到資料庫
```

---

## 方法二：CLI 工具（進階）

```bash
# 初始化
npx block-builder init

# 生成代碼
npx block-builder generate canvas.json -o ./src

# 監看模式（canvas.json 變動就重新生成）
npx block-builder watch canvas.json -o ./src

# 從伺服器拉取專案
npx block-builder pull <project-id>
```

---

## 方法三：VSCode 擴充功能

1. 安裝 `.vsix` 擴充功能
2. `Ctrl+Shift+B` 開啟 Block Builder
3. 在 VSCode 內直接設計和生成
4. `Ctrl+Shift+G` 直接生成到 `./generated` 資料夾

---

## 整合到現有專案

生成的代碼是**骨架代碼**，你需要在生成後加入業務邏輯：

### TypeScript 型別

```typescript
// 生成的 src/types/user.ts
export interface User {
  id: string
  email: string
  name: string
  // ... 其他欄位
}
```

直接 import 使用：

```typescript
import type { User } from './types/user'
```

---

### API 路由（Hono）

```typescript
// 生成的 src/api/routes/api-users.ts
app.get('/api/users', async (c) => {
  // TODO: 這裡加入你的業務邏輯
  const users = await db.query.users.findMany()
  return c.json({ success: true, data: users })
})
```

---

### React Hooks

```typescript
// 生成的 src/hooks/use-users-query.ts
export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      return res.json()
    },
  })
}

// 在你的 React 組件中使用：
function MyComponent() {
  const { data, isLoading, error } = useUsersQuery()
  // ...
}
```

---

### DataTable 組件

```tsx
// 生成的 src/components/user-table.tsx
import { UserTable } from './components/user-table'
import { useUsersQuery } from './hooks/use-users-query'

function UsersPage() {
  const { data, isLoading, error } = useUsersQuery()
  return (
    <UserTable
      data={data?.data}
      isLoading={isLoading}
      error={error}
      onRowClick={(user) => console.log(user)}
    />
  )
}
```

---

## 執行測試

```bash
# 執行所有 Vitest 測試
pnpm test

# 監看模式
pnpm test:watch

# 覆蓋率報告
pnpm test:coverage
```

---

## 執行 Playwright E2E 測試

```bash
# 安裝 Playwright
npx playwright install

# 啟動 server
pnpm dev

# 另開終端執行 E2E
npx playwright test
```

---

## Docker 部署

```bash
# 啟動全部服務（API + DB + Redis）
docker compose up -d

# 查看 logs
docker compose logs -f app

# 停止
docker compose down
```

---

## 常見問題

**Q: 生成的 import 路徑錯了怎麼辦？**
A: 確保整個 `src/` 資料夾都一起複製到專案，不要只複製部分檔案。

**Q: 要如何加入自己的業務邏輯？**
A: 找到生成代碼中的 `// TODO:` 註解，那裡就是需要填入業務邏輯的地方。

**Q: 每次重新生成代碼會覆蓋我的修改嗎？**
A: 是的！生成代碼是一次性的骨架。建議：
1. 生成後複製到你的專案
2. 在你的專案中修改業務邏輯
3. 不要把業務邏輯寫在生成的檔案裡，而是 import 後擴展

**Q: 支援哪些資料庫？**
A: Prisma 支援 PostgreSQL、MySQL、SQLite、MongoDB。修改 `prisma/schema.prisma` 中的 `provider` 即可切換。
