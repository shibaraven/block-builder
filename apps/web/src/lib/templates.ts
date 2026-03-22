import type { CanvasNode, CanvasEdge } from '@block-builder/types'

export interface Template {
  id: string
  name: string
  description: string
  tags: string[]
  nodeCount: number
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const makeNode = (id: string, defId: string, cat: any, label: string, data: any, x: number, y: number): CanvasNode => ({
  id, type: 'blockNode', position: { x, y },
  data: { blockDefId: defId, category: cat, label, blockData: data }
})

const edge = (id: string, src: string, tgt: string): CanvasEdge => ({
  id, source: src, sourceHandle: 'output', target: tgt, targetHandle: 'input', type: 'smoothstep'
})

export const TEMPLATES: Template[] = [
  // ─── User CRUD ──────────────────────────────────────────────────
  {
    id: 'user-crud',
    name: '使用者管理 CRUD',
    description: '完整的使用者 CRUD，含 JWT 認證、角色權限、分頁列表和新增表單',
    tags: ['NestJS', 'JWT', 'CRUD', '入門'],
    nodeCount: 10,
    nodes: [
      makeNode('t1','interface','type','User',{ kind:'interface', name:'User', fields:[{name:'id',type:'string'},{name:'name',type:'string'},{name:'email',type:'string'},{name:'role',type:'UserRole'},{name:'createdAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('t2','enum','type','UserRole',{ kind:'enum', name:'UserRole', values:[{key:'ADMIN',value:'admin'},{key:'USER',value:'user'},{key:'GUEST',value:'guest'}], style:'string' }, 40, 240),
      makeNode('t3','dto','type','CreateUserDto',{ kind:'dto', name:'CreateUserDto', fields:[{name:'name',type:'string',validation:['min(1)']},{name:'email',type:'string',validation:['email()']},{name:'password',type:'string',validation:['min(8)']}], validator:'zod' }, 40, 380),
      makeNode('t4','jwt','auth','JWT Config',{ kind:'jwt', name:'JwtModule', secret:'process.env.JWT_SECRET', expiresIn:'7d', refreshToken:true, payload:[{name:'sub',type:'string'},{name:'email',type:'string'},{name:'role',type:'string'}] }, 40, 540),
      makeNode('t5','api-get','api','GET /api/users',{ kind:'api-endpoint', method:'GET', path:'/api/users', summary:'List all users', auth:true, responseType:'User[]', tags:['users'] }, 320, 40),
      makeNode('t6','api-post','api','POST /api/users',{ kind:'api-endpoint', method:'POST', path:'/api/users', summary:'Create user', auth:false, responseType:'User', bodyType:'CreateUserDto', tags:['users'] }, 320, 200),
      makeNode('t7','api-delete','api','DELETE /api/users/:id',{ kind:'api-endpoint', method:'DELETE', path:'/api/users/:id', summary:'Delete user', auth:true, responseType:'void', tags:['users'] }, 320, 360),
      makeNode('t8','use-query','logic','useUsersQuery',{ kind:'use-query', hookName:'useUsersQuery', endpoint:'/api/users', responseType:'User[]', staleTime:300000, retry:3 }, 600, 40),
      makeNode('t9','use-mutation','logic','useCreateUserMutation',{ kind:'use-mutation', hookName:'useCreateUserMutation', endpoint:'/api/users', method:'POST', bodyType:'CreateUserDto', responseType:'User', onSuccessInvalidate:['useUsersQuery'] }, 600, 200),
      makeNode('t10','data-table','ui','UserTable',{ kind:'data-table', componentName:'UserTable', dataType:'User', columns:[{key:'id',label:'ID'},{key:'name',label:'Name',sortable:true},{key:'email',label:'Email',sortable:true},{key:'role',label:'Role',type:'badge'},{key:'createdAt',label:'Created',sortable:true,type:'date'}], pagination:true, searchable:true }, 880, 40),
      makeNode('t11','form','ui','CreateUserForm',{ kind:'form', componentName:'CreateUserForm', dtoType:'CreateUserDto', fields:[{name:'name',label:'Full Name',type:'text',required:true},{name:'email',label:'Email',type:'email',required:true},{name:'password',label:'Password',type:'password',required:true}], onSubmit:'useCreateUserMutation', validator:'zod' }, 880, 240),
    ],
    edges: [
      edge('e1','t1','t5'), edge('e2','t3','t6'), edge('e3','t4','t5'),
      edge('e4','t5','t8'), edge('e5','t6','t9'), edge('e6','t8','t10'), edge('e7','t9','t11'),
    ],
  },

  // ─── Blog System ────────────────────────────────────────────────
  {
    id: 'blog',
    name: '部落格系統',
    description: '文章 CRUD、分類 Enum、留言、作者關聯，含搜尋和圖表統計',
    tags: ['Blog', 'CRUD', '搜尋'],
    nodeCount: 9,
    nodes: [
      makeNode('b1','interface','type','Post',{ kind:'interface', name:'Post', fields:[{name:'id',type:'string'},{name:'title',type:'string'},{name:'content',type:'string'},{name:'status',type:'PostStatus'},{name:'authorId',type:'string'},{name:'createdAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('b2','enum','type','PostStatus',{ kind:'enum', name:'PostStatus', values:[{key:'DRAFT',value:'draft'},{key:'PUBLISHED',value:'published'},{key:'ARCHIVED',value:'archived'}], style:'string' }, 40, 260),
      makeNode('b3','dto','type','CreatePostDto',{ kind:'dto', name:'CreatePostDto', fields:[{name:'title',type:'string',validation:['min(1)','max(200)']},{name:'content',type:'string',validation:['min(10)']},{name:'status',type:'PostStatus'}], validator:'zod' }, 40, 400),
      makeNode('b4','api-get','api','GET /api/posts',{ kind:'api-endpoint', method:'GET', path:'/api/posts', summary:'List posts', auth:false, responseType:'Post[]', tags:['posts'] }, 320, 40),
      makeNode('b5','api-post','api','POST /api/posts',{ kind:'api-endpoint', method:'POST', path:'/api/posts', summary:'Create post', auth:true, responseType:'Post', bodyType:'CreatePostDto', tags:['posts'] }, 320, 200),
      makeNode('b6','use-query','logic','usePostsQuery',{ kind:'use-query', hookName:'usePostsQuery', endpoint:'/api/posts', responseType:'Post[]', staleTime:60000, retry:2 }, 600, 40),
      makeNode('b7','search-bar','ui','PostSearch',{ kind:'search-bar', componentName:'PostSearch', placeholder:'搜尋文章...', searchType:'remote', endpoint:'/api/posts/search', debounce:300, resultType:'Post' }, 600, 200),
      makeNode('b8','data-table','ui','PostTable',{ kind:'data-table', componentName:'PostTable', dataType:'Post', columns:[{key:'title',label:'Title',sortable:true},{key:'status',label:'Status',type:'badge'},{key:'authorId',label:'Author'},{key:'createdAt',label:'Published',sortable:true,type:'date'}], pagination:true, searchable:false }, 880, 40),
      makeNode('b9','chart','ui','PostsChart',{ kind:'chart', componentName:'PostsChart', chartType:'bar', dataType:'Post', xKey:'status', yKey:'count', lib:'recharts' }, 880, 240),
    ],
    edges: [
      edge('e1','b1','b4'), edge('e2','b3','b5'), edge('e3','b4','b6'),
      edge('e4','b6','b8'), edge('e5','b6','b7'), edge('e6','b6','b9'),
    ],
  },

  // ─── E-commerce Backend ─────────────────────────────────────────
  {
    id: 'ecommerce',
    name: '電商後台',
    description: '商品管理、訂單系統、狀態機、庫存追蹤、Email 通知、背景任務',
    tags: ['電商', '訂單', 'Cache', 'Email'],
    nodeCount: 11,
    nodes: [
      makeNode('e1','interface','type','Product',{ kind:'interface', name:'Product', fields:[{name:'id',type:'string'},{name:'name',type:'string'},{name:'price',type:'number'},{name:'stock',type:'number'},{name:'status',type:'ProductStatus'}] }, 40, 40),
      makeNode('e2','enum','type','ProductStatus',{ kind:'enum', name:'ProductStatus', values:[{key:'ACTIVE',value:'active'},{key:'INACTIVE',value:'inactive'},{key:'OUT_OF_STOCK',value:'out_of_stock'}], style:'string' }, 40, 240),
      makeNode('e3','enum','type','OrderStatus',{ kind:'enum', name:'OrderStatus', values:[{key:'PENDING',value:'pending'},{key:'PAID',value:'paid'},{key:'SHIPPED',value:'shipped'},{key:'DELIVERED',value:'delivered'},{key:'CANCELLED',value:'cancelled'}], style:'string' }, 40, 400),
      makeNode('e4','cache','infra','ProductCache',{ kind:'cache', name:'ProductCache', store:'redis', ttl:300, keyPrefix:'product:' }, 40, 560),
      makeNode('e5','email','infra','OrderEmailService',{ kind:'email', name:'OrderEmailService', provider:'resend', templates:[{name:'order-confirmed',subject:'訂單確認'},{name:'order-shipped',subject:'訂單已出貨'},{name:'order-delivered',subject:'訂單已送達'}] }, 40, 700),
      makeNode('e6','job','infra','InventoryJob',{ kind:'job', name:'InventoryCheckJob', type:'cron', schedule:'0 * * * *', lib:'bullmq' }, 40, 840),
      makeNode('e7','api-get','api','GET /api/products',{ kind:'api-endpoint', method:'GET', path:'/api/products', summary:'List products', auth:false, responseType:'Product[]', tags:['products'] }, 320, 40),
      makeNode('e8','api-get','api','GET /api/orders',{ kind:'api-endpoint', method:'GET', path:'/api/orders', summary:'List orders', auth:true, responseType:'Order[]', tags:['orders'] }, 320, 200),
      makeNode('e9','use-query','logic','useProductsQuery',{ kind:'use-query', hookName:'useProductsQuery', endpoint:'/api/products', responseType:'Product[]', staleTime:300000, retry:3 }, 600, 40),
      makeNode('e10','data-table','ui','ProductTable',{ kind:'data-table', componentName:'ProductTable', dataType:'Product', columns:[{key:'name',label:'Product',sortable:true},{key:'price',label:'Price',sortable:true,type:'number'},{key:'stock',label:'Stock',sortable:true},{key:'status',label:'Status',type:'badge'}], pagination:true, searchable:true }, 880, 40),
      makeNode('e11','chart','ui','SalesChart',{ kind:'chart', componentName:'SalesChart', chartType:'line', dataType:'Order', xKey:'date', yKey:'total', lib:'recharts' }, 880, 240),
    ],
    edges: [
      edge('e1','e1','e7'), edge('e2','e4','e7'), edge('e3','e7','e9'),
      edge('e4','e9','e10'), edge('e5','e9','e11'),
    ],
  },

  // ─── Real-time Chat ─────────────────────────────────────────────
  {
    id: 'chat',
    name: '即時聊天應用',
    description: 'WebSocket 閘道、JWT 認證、訊息佇列、線上狀態、Toast 通知',
    tags: ['WebSocket', 'JWT', '即時', 'BullMQ'],
    nodeCount: 8,
    nodes: [
      makeNode('c1','interface','type','Message',{ kind:'interface', name:'Message', fields:[{name:'id',type:'string'},{name:'content',type:'string'},{name:'senderId',type:'string'},{name:'roomId',type:'string'},{name:'createdAt',type:'Date'}] }, 40, 40),
      makeNode('c2','interface','type','ChatRoom',{ kind:'interface', name:'ChatRoom', fields:[{name:'id',type:'string'},{name:'name',type:'string'},{name:'members',type:'string[]'}] }, 40, 240),
      makeNode('c3','jwt','auth','JWT Config',{ kind:'jwt', name:'JwtModule', secret:'process.env.JWT_SECRET', expiresIn:'24h', refreshToken:false, payload:[{name:'sub',type:'string'},{name:'username',type:'string'}] }, 40, 420),
      makeNode('c4','websocket','infra','ChatGateway',{ kind:'websocket', name:'ChatGateway', namespace:'/chat', events:[{name:'send-message',payload:'CreateMessageDto',direction:'in'},{name:'new-message',payload:'Message',direction:'out'},{name:'join-room',payload:'string',direction:'in'},{name:'user-joined',payload:'string',direction:'out'},{name:'typing',payload:'string',direction:'both'}], framework:'nestjs-gateway' }, 320, 40),
      makeNode('c5','job','infra','MessageJob',{ kind:'job', name:'MessagePersistJob', type:'queue', lib:'bullmq' }, 320, 280),
      makeNode('c6','store','logic','useChatStore',{ kind:'store', name:'useChatStore', lib:'zustand', state:[{name:'messages',type:'Message[]'},{name:'rooms',type:'ChatRoom[]'},{name:'activeRoom',type:'string | null',optional:true},{name:'onlineUsers',type:'string[]'}], actions:[{name:'addMessage',description:'Add new message'},{name:'setActiveRoom',description:'Set current room'},{name:'setOnlineUsers',description:'Update online users list'}] }, 600, 40),
      makeNode('c7','search-bar','ui','UserSearch',{ kind:'search-bar', componentName:'UserSearch', placeholder:'搜尋使用者...', searchType:'remote', endpoint:'/api/users/search', debounce:300, resultType:'User' }, 600, 240),
      makeNode('c8','notification','ui','ChatToaster',{ kind:'notification', componentName:'ChatToaster', lib:'sonner', position:'bottom-right', types:['success','error','info'] }, 600, 400),
    ],
    edges: [
      edge('e1','c1','c4'), edge('e2','c3','c4'), edge('e3','c4','c6'),
      edge('e4','c6','c7'), edge('e5','c6','c8'),
    ],
  },

  // ─── NestJS Full Stack ──────────────────────────────────────────
  {
    id: 'nestjs-full',
    name: 'NestJS 完整架構',
    description: '四層架構：Module + Controller + Service + Prisma Repository，含中介層和快取',
    tags: ['NestJS', 'Prisma', '四層架構'],
    nodeCount: 8,
    nodes: [
      makeNode('n1','interface','type','Article',{ kind:'interface', name:'Article', fields:[{name:'id',type:'string'},{name:'title',type:'string'},{name:'body',type:'string'},{name:'published',type:'boolean',optional:true},{name:'createdAt',type:'Date',optional:true}] }, 40, 100),
      makeNode('n2','dto','type','CreateArticleDto',{ kind:'dto', name:'CreateArticleDto', fields:[{name:'title',type:'string',validation:['min(1)','max(200)']},{name:'body',type:'string',validation:['min(1)']}], validator:'zod' }, 40, 300),
      makeNode('n3','nest-repository','api','ArticleRepository',{ kind:'nest-repository', name:'ArticleRepository', entity:'Article', orm:'prisma', methods:['findAll','findOne','create','update','delete','count'] }, 320, 40),
      makeNode('n4','nest-service','api','ArticleService',{ kind:'nest-service', name:'ArticleService', injectable:true, methods:[{name:'findAll',params:'',returnType:'Promise<Article[]>',description:'Get all articles'},{name:'findOne',params:'id: string',returnType:'Promise<Article>',description:'Get one article'},{name:'create',params:'dto: CreateArticleDto',returnType:'Promise<Article>',description:'Create article'},{name:'update',params:'id: string, dto: UpdateArticleDto',returnType:'Promise<Article>',description:'Update article'},{name:'remove',params:'id: string',returnType:'Promise<void>',description:'Delete article'}], dependencies:['ArticleRepository'] }, 320, 240),
      makeNode('n5','nest-module','api','ArticleModule',{ kind:'nest-module', name:'ArticleModule', imports:['TypeOrmModule'], providers:['ArticleService','ArticleRepository'], exports:['ArticleService'], controllers:['ArticleController'], global:false }, 320, 460),
      makeNode('n6','middleware','infra','CorsMiddleware',{ kind:'middleware', name:'CorsMiddleware', type:'cors', options:{origin:'*',credentials:'true'} }, 600, 40),
      makeNode('n7','cache','infra','ArticleCache',{ kind:'cache', name:'ArticleCache', store:'redis', ttl:300, keyPrefix:'article:' }, 600, 200),
      makeNode('n8','auth-guard','auth','JwtGuard',{ kind:'auth-guard', name:'JwtAuthGuard', strategy:'jwt', framework:'nestjs' }, 600, 360),
    ],
    edges: [
      edge('e1','n1','n3'), edge('e2','n3','n4'), edge('e3','n4','n5'),
      edge('e4','n6','n5'), edge('e5','n7','n4'), edge('e6','n8','n5'),
    ],
  },

  // ─── Dashboard ──────────────────────────────────────────────────
  {
    id: 'dashboard',
    name: '數據儀表板',
    description: '多圖表、統計卡片、搜尋、導覽列，適合後台管理系統',
    tags: ['Dashboard', 'Charts', 'Navigation'],
    nodeCount: 7,
    nodes: [
      makeNode('d1','interface','type','Stats',{ kind:'interface', name:'Stats', fields:[{name:'totalUsers',type:'number'},{name:'totalOrders',type:'number'},{name:'revenue',type:'number'},{name:'growthRate',type:'number'}] }, 40, 100),
      makeNode('d2','use-query','logic','useStatsQuery',{ kind:'use-query', hookName:'useStatsQuery', endpoint:'/api/stats', responseType:'Stats', staleTime:60000, retry:2 }, 300, 100),
      makeNode('d3','chart','ui','RevenueChart',{ kind:'chart', componentName:'RevenueChart', chartType:'area', dataType:'Stats', xKey:'date', yKey:'revenue', lib:'recharts' }, 560, 40),
      makeNode('d4','chart','ui','UsersChart',{ kind:'chart', componentName:'UsersChart', chartType:'bar', dataType:'Stats', xKey:'date', yKey:'totalUsers', lib:'recharts' }, 560, 220),
      makeNode('d5','search-bar','ui','GlobalSearch',{ kind:'search-bar', componentName:'GlobalSearch', placeholder:'搜尋...', searchType:'remote', endpoint:'/api/search', debounce:300, resultType:'any' }, 560, 400),
      makeNode('d6','navigation','layout','AppNavbar',{ kind:'navigation', componentName:'AppNavbar', type:'navbar', items:[{label:'Dashboard',path:'/'},{label:'Users',path:'/users'},{label:'Orders',path:'/orders'},{label:'Analytics',path:'/analytics'},{label:'Settings',path:'/settings'}], auth:true }, 560, 540),
      makeNode('d7','notification','ui','AppToaster',{ kind:'notification', componentName:'AppToaster', lib:'sonner', position:'top-right', types:['success','error','warning','info'] }, 560, 680),
    ],
    edges: [
      edge('e1','d1','d2'), edge('e2','d2','d3'), edge('e3','d2','d4'), edge('e4','d2','d5'),
    ],
  },

  // ─── SaaS Auth System ──────────────────────────────────────────
  {
    id: 'saas-auth',
    name: 'SaaS 認證系統',
    description: 'OAuth Google/GitHub + JWT + 角色權限 + Refresh Token，完整認證架構',
    tags: ['JWT', 'OAuth', 'NestJS', '認證'],
    nodeCount: 12,
    nodes: [
      makeNode('sa1','interface','type','User',{ kind:'interface', name:'User', fields:[{name:'id',type:'string'},{name:'email',type:'string'},{name:'name',type:'string'},{name:'avatar',type:'string',optional:true},{name:'provider',type:'string'},{name:'role',type:'string'},{name:'createdAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('sa2','enum','type','UserRole',{ kind:'enum', name:'UserRole', values:[{key:'ADMIN',value:'admin'},{key:'USER',value:'user'},{key:'PREMIUM',value:'premium'}], style:'string' }, 40, 260),
      makeNode('sa3','dto','type','LoginDto',{ kind:'dto', name:'LoginDto', fields:[{name:'email',type:'string',validation:['email()']},{name:'password',type:'string',validation:['min(8)']}], validator:'zod' }, 40, 400),
      makeNode('sa4','jwt','auth','JWT Config',{ kind:'jwt', name:'JwtModule', secret:'process.env.JWT_SECRET', expiresIn:'15m', refreshToken:true, payload:[{name:'sub',type:'string'},{name:'email',type:'string'},{name:'role',type:'string'}] }, 40, 540),
      makeNode('sa5','oauth','auth','OAuth Config',{ kind:'oauth', providers:['google','github'], callbackUrl:'http://localhost:3000/auth/callback', scope:['email','profile'] }, 40, 700),
      makeNode('sa6','auth-guard','auth','Auth Guard',{ kind:'auth-guard', guardName:'JwtAuthGuard', strategy:'jwt', roles:['admin','user','premium'] }, 40, 860),
      makeNode('sa7','api-post','api','POST /auth/login',{ kind:'api-endpoint', method:'POST', path:'/auth/login', summary:'Login with email/password', auth:false, responseType:'{ access_token: string; refresh_token: string }', bodyType:'LoginDto', tags:['auth'] }, 340, 40),
      makeNode('sa8','api-post','api','POST /auth/refresh',{ kind:'api-endpoint', method:'POST', path:'/auth/refresh', summary:'Refresh access token', auth:false, responseType:'{ access_token: string }', tags:['auth'] }, 340, 200),
      makeNode('sa9','api-get','api','GET /auth/me',{ kind:'api-endpoint', method:'GET', path:'/auth/me', summary:'Get current user', auth:true, responseType:'User', tags:['auth'] }, 340, 360),
      makeNode('sa10','api-get','api','GET /auth/google',{ kind:'api-endpoint', method:'GET', path:'/auth/google', summary:'Initiate Google OAuth', auth:false, responseType:'void', tags:['auth'] }, 340, 520),
      makeNode('sa11','use-mutation','logic','useLoginMutation',{ kind:'use-mutation', hookName:'useLoginMutation', endpoint:'/auth/login', method:'POST', bodyType:'LoginDto', responseType:'{ access_token: string }', onSuccessInvalidate:[] }, 640, 40),
      makeNode('sa12','form','ui','LoginForm',{ kind:'form', componentName:'LoginForm', dtoType:'LoginDto', fields:[{name:'email',label:'Email',type:'email',required:true},{name:'password',label:'Password',type:'password',required:true}], onSubmit:'useLoginMutation', validator:'zod' }, 900, 40),
    ],
    edges: [
      edge('e1','sa1','sa7'), edge('e2','sa3','sa7'), edge('e3','sa4','sa7'), edge('e4','sa4','sa8'),
      edge('e5','sa5','sa10'), edge('e6','sa6','sa9'), edge('e7','sa7','sa11'), edge('e8','sa11','sa12'),
    ],
  },

  // ─── File Upload System ─────────────────────────────────────────
  {
    id: 'file-upload',
    name: '檔案上傳系統',
    description: '多檔案上傳、預覽、進度條、S3 整合，含 Multer 後端處理',
    tags: ['NestJS', 'Upload', 'CRUD'],
    nodeCount: 9,
    nodes: [
      makeNode('fu1','interface','type','FileRecord',{ kind:'interface', name:'FileRecord', fields:[{name:'id',type:'string'},{name:'filename',type:'string'},{name:'originalName',type:'string'},{name:'mimeType',type:'string'},{name:'size',type:'number'},{name:'url',type:'string'},{name:'uploadedAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('fu2','dto','type','UploadFileDto',{ kind:'dto', name:'UploadFileDto', fields:[{name:'filename',type:'string',validation:['min(1)']},{name:'mimeType',type:'string'},{name:'size',type:'number',validation:['min(1)']}], validator:'zod' }, 40, 280),
      makeNode('fu3','file-upload','infra','File Upload Config',{ kind:'file-upload', provider:'local', maxFileSize:10485760, allowedTypes:['image/*','application/pdf','text/*'], destination:'./uploads', multiple:true }, 40, 460),
      makeNode('fu4','api-post','api','POST /api/files/upload',{ kind:'api-endpoint', method:'POST', path:'/api/files/upload', summary:'Upload files', auth:true, responseType:'FileRecord[]', bodyType:'FormData', tags:['files'] }, 340, 40),
      makeNode('fu5','api-get','api','GET /api/files',{ kind:'api-endpoint', method:'GET', path:'/api/files', summary:'List all files', auth:true, responseType:'FileRecord[]', tags:['files'] }, 340, 220),
      makeNode('fu6','api-delete','api','DELETE /api/files/:id',{ kind:'api-endpoint', method:'DELETE', path:'/api/files/:id', summary:'Delete file', auth:true, responseType:'void', tags:['files'] }, 340, 400),
      makeNode('fu7','use-query','logic','useFilesQuery',{ kind:'use-query', hookName:'useFilesQuery', endpoint:'/api/files', responseType:'FileRecord[]', staleTime:60000, retry:2 }, 620, 40),
      makeNode('fu8','use-mutation','logic','useUploadFileMutation',{ kind:'use-mutation', hookName:'useUploadFileMutation', endpoint:'/api/files/upload', method:'POST', bodyType:'FormData', responseType:'FileRecord[]', onSuccessInvalidate:['useFilesQuery'] }, 620, 220),
      makeNode('fu9','data-table','ui','FilesTable',{ kind:'data-table', componentName:'FilesTable', dataType:'FileRecord', columns:[{key:'originalName',label:'檔案名稱',sortable:true},{key:'mimeType',label:'類型'},{key:'size',label:'大小',type:'number',sortable:true},{key:'uploadedAt',label:'上傳時間',type:'date',sortable:true}], pagination:true, searchable:true }, 900, 40),
    ],
    edges: [
      edge('e1','fu1','fu4'), edge('e2','fu2','fu4'), edge('e3','fu3','fu4'),
      edge('e4','fu4','fu8'), edge('e5','fu5','fu7'), edge('e6','fu7','fu9'), edge('e7','fu8','fu9'),
    ],
  },

  // ─── Real-time Chat ─────────────────────────────────────────────
  {
    id: 'realtime-chat',
    name: '即時聊天系統',
    description: 'WebSocket + JWT 認證 + 聊天室 + 訊息歷史，支援多房間',
    tags: ['WebSocket', 'JWT', 'NestJS', '即時'],
    nodeCount: 10,
    nodes: [
      makeNode('rc1','interface','type','Message',{ kind:'interface', name:'Message', fields:[{name:'id',type:'string'},{name:'content',type:'string'},{name:'senderId',type:'string'},{name:'roomId',type:'string'},{name:'createdAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('rc2','interface','type','ChatRoom',{ kind:'interface', name:'ChatRoom', fields:[{name:'id',type:'string'},{name:'name',type:'string'},{name:'members',type:'string[]'},{name:'createdAt',type:'Date',optional:true}] }, 40, 240),
      makeNode('rc3','dto','type','SendMessageDto',{ kind:'dto', name:'SendMessageDto', fields:[{name:'content',type:'string',validation:['min(1)','max(2000)']},{name:'roomId',type:'string',validation:['min(1)']}], validator:'zod' }, 40, 440),
      makeNode('rc4','jwt','auth','JWT Config',{ kind:'jwt', name:'JwtModule', secret:'process.env.JWT_SECRET', expiresIn:'7d', refreshToken:false, payload:[{name:'sub',type:'string'},{name:'email',type:'string'}] }, 40, 600),
      makeNode('rc5','websocket','infra','WebSocket Gateway',{ kind:'websocket', gatewayName:'ChatGateway', namespace:'/chat', events:[{name:'sendMessage',type:'incoming'},{name:'newMessage',type:'outgoing'},{name:'joinRoom',type:'incoming'},{name:'userJoined',type:'outgoing'}], auth:true }, 40, 740),
      makeNode('rc6','api-get','api','GET /api/rooms',{ kind:'api-endpoint', method:'GET', path:'/api/rooms', summary:'List chat rooms', auth:true, responseType:'ChatRoom[]', tags:['chat'] }, 340, 40),
      makeNode('rc7','api-post','api','POST /api/rooms',{ kind:'api-endpoint', method:'POST', path:'/api/rooms', summary:'Create chat room', auth:true, responseType:'ChatRoom', tags:['chat'] }, 340, 200),
      makeNode('rc8','api-get','api','GET /api/rooms/:id/messages',{ kind:'api-endpoint', method:'GET', path:'/api/rooms/:id/messages', summary:'Get message history', auth:true, responseType:'Message[]', tags:['chat'] }, 340, 380),
      makeNode('rc9','use-query','logic','useRoomsQuery',{ kind:'use-query', hookName:'useRoomsQuery', endpoint:'/api/rooms', responseType:'ChatRoom[]', staleTime:30000, retry:2 }, 620, 40),
      makeNode('rc10','store','logic','chatStore',{ kind:'store', storeName:'useChatStore', lib:'zustand', state:[{name:'messages',type:'Message[]',default:'[]'},{name:'activeRoom',type:'string | null',default:'null'},{name:'connected',type:'boolean',default:'false'}], actions:['addMessage','setActiveRoom','setConnected'] }, 620, 240),
    ],
    edges: [
      edge('e1','rc1','rc8'), edge('e2','rc2','rc6'), edge('e3','rc3','rc5'),
      edge('e4','rc4','rc5'), edge('e5','rc5','rc10'), edge('e6','rc6','rc9'),
      edge('e7','rc8','rc10'), edge('e8','rc9','rc10'),
    ],
  },

  // ─── E-commerce Checkout ────────────────────────────────────────
  {
    id: 'ecommerce-checkout',
    name: '電商結帳流程',
    description: 'Stripe 支付 + 購物車 + 訂單管理 + Webhook 處理',
    tags: ['電商', '訂單', 'NestJS', 'Cache'],
    nodeCount: 11,
    nodes: [
      makeNode('ec1','interface','type','Product',{ kind:'interface', name:'Product', fields:[{name:'id',type:'string'},{name:'name',type:'string'},{name:'price',type:'number'},{name:'stock',type:'number'},{name:'imageUrl',type:'string',optional:true}] }, 40, 40),
      makeNode('ec2','interface','type','Order',{ kind:'interface', name:'Order', fields:[{name:'id',type:'string'},{name:'userId',type:'string'},{name:'items',type:'OrderItem[]'},{name:'total',type:'number'},{name:'status',type:'string'},{name:'paymentIntentId',type:'string',optional:true}] }, 40, 240),
      makeNode('ec3','dto','type','CreateOrderDto',{ kind:'dto', name:'CreateOrderDto', fields:[{name:'items',type:'OrderItem[]',validation:['min(1)']},{name:'shippingAddress',type:'string',validation:['min(1)']}], validator:'zod' }, 40, 440),
      makeNode('ec4','stripe','infra','Stripe Config',{ kind:'stripe', webhookSecret:'process.env.STRIPE_WEBHOOK_SECRET', successUrl:'http://localhost:3000/success', cancelUrl:'http://localhost:3000/cancel', currency:'twd', events:['checkout.session.completed','payment_intent.payment_failed'] }, 40, 620),
      makeNode('ec5','cache','infra','Redis Cache',{ kind:'cache', provider:'redis', url:'process.env.REDIS_URL', ttl:3600, keyPrefix:'bb:', strategies:[{pattern:'/api/products*',ttl:300}] }, 40, 800),
      makeNode('ec6','api-get','api','GET /api/products',{ kind:'api-endpoint', method:'GET', path:'/api/products', summary:'List products', auth:false, responseType:'Product[]', tags:['products'] }, 340, 40),
      makeNode('ec7','api-post','api','POST /api/orders',{ kind:'api-endpoint', method:'POST', path:'/api/orders', summary:'Create order', auth:true, responseType:'Order', bodyType:'CreateOrderDto', tags:['orders'] }, 340, 200),
      makeNode('ec8','api-post','api','POST /api/checkout',{ kind:'api-endpoint', method:'POST', path:'/api/checkout', summary:'Create Stripe checkout session', auth:true, responseType:'{ url: string }', tags:['payment'] }, 340, 380),
      makeNode('ec9','api-post','api','POST /api/webhook',{ kind:'api-endpoint', method:'POST', path:'/api/webhook/stripe', summary:'Stripe webhook handler', auth:false, responseType:'void', tags:['payment'] }, 340, 540),
      makeNode('ec10','use-query','logic','useProductsQuery',{ kind:'use-query', hookName:'useProductsQuery', endpoint:'/api/products', responseType:'Product[]', staleTime:300000, retry:2 }, 620, 40),
      makeNode('ec11','data-table','ui','ProductsTable',{ kind:'data-table', componentName:'ProductsTable', dataType:'Product', columns:[{key:'name',label:'商品名稱',sortable:true},{key:'price',label:'價格',type:'number',sortable:true},{key:'stock',label:'庫存',type:'number',sortable:true}], pagination:true, searchable:true }, 880, 40),
    ],
    edges: [
      edge('e1','ec1','ec6'), edge('e2','ec2','ec7'), edge('e3','ec3','ec7'),
      edge('e4','ec4','ec8'), edge('e5','ec4','ec9'), edge('e6','ec5','ec6'),
      edge('e7','ec6','ec10'), edge('e8','ec7','ec9'), edge('e9','ec10','ec11'),
    ],
  },

  // ─── Notification System ────────────────────────────────────────
  {
    id: 'notification-system',
    name: '通知推播系統',
    description: 'Email + Push + In-App 三種通知管道，含排程任務和通知歷史',
    tags: ['Email', 'BullMQ', 'NestJS', 'WebSocket'],
    nodeCount: 9,
    nodes: [
      makeNode('ns1','interface','type','Notification',{ kind:'interface', name:'Notification', fields:[{name:'id',type:'string'},{name:'userId',type:'string'},{name:'type',type:'string'},{name:'title',type:'string'},{name:'message',type:'string'},{name:'read',type:'boolean'},{name:'createdAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('ns2','dto','type','CreateNotificationDto',{ kind:'dto', name:'CreateNotificationDto', fields:[{name:'userId',type:'string',validation:['min(1)']},{name:'type',type:'string'},{name:'title',type:'string',validation:['min(1)']},{name:'message',type:'string',validation:['min(1)']}], validator:'zod' }, 40, 280),
      makeNode('ns3','email','infra','Email Service',{ kind:'email', provider:'nodemailer', from:'noreply@myapp.com', templates:[{name:'welcome',subject:'歡迎加入！'},{name:'notification',subject:'你有新通知'},{name:'reset-password',subject:'重設密碼'}] }, 40, 500),
      makeNode('ns4','job','infra','Notification Job',{ kind:'job', jobName:'NotificationJob', lib:'bullmq', queue:'notifications', schedule:'*/5 * * * *', retries:3, timeout:30000 }, 40, 680),
      makeNode('ns5','api-post','api','POST /api/notifications',{ kind:'api-endpoint', method:'POST', path:'/api/notifications', summary:'Send notification', auth:true, responseType:'Notification', bodyType:'CreateNotificationDto', tags:['notifications'] }, 340, 40),
      makeNode('ns6','api-get','api','GET /api/notifications',{ kind:'api-endpoint', method:'GET', path:'/api/notifications', summary:'List user notifications', auth:true, responseType:'Notification[]', tags:['notifications'] }, 340, 220),
      makeNode('ns7','api-put','api','PUT /api/notifications/:id/read',{ kind:'api-endpoint', method:'PUT', path:'/api/notifications/:id/read', summary:'Mark as read', auth:true, responseType:'Notification', tags:['notifications'] }, 340, 400),
      makeNode('ns8','use-query','logic','useNotificationsQuery',{ kind:'use-query', hookName:'useNotificationsQuery', endpoint:'/api/notifications', responseType:'Notification[]', staleTime:30000, retry:2 }, 620, 40),
      makeNode('ns9','notification','ui','NotificationBell',{ kind:'notification', componentName:'NotificationBell', lib:'sonner', position:'top-right', types:['success','error','warning','info'] }, 900, 40),
    ],
    edges: [
      edge('e1','ns1','ns5'), edge('e2','ns2','ns5'), edge('e3','ns3','ns4'),
      edge('e4','ns4','ns5'), edge('e5','ns5','ns8'), edge('e6','ns6','ns8'),
      edge('e7','ns8','ns9'),
    ],
  },

  // ─── Search System ──────────────────────────────────────────────
  {
    id: 'search-system',
    name: '全文搜尋系統',
    description: '全文搜尋 + 篩選 + 排序 + 分頁，含搜尋歷史和熱門搜尋',
    tags: ['搜尋', 'NestJS', 'Cache', 'CRUD'],
    nodeCount: 8,
    nodes: [
      makeNode('ss1','interface','type','SearchResult',{ kind:'interface', name:'SearchResult', fields:[{name:'id',type:'string'},{name:'title',type:'string'},{name:'description',type:'string',optional:true},{name:'type',type:'string'},{name:'url',type:'string'},{name:'score',type:'number',optional:true}] }, 40, 40),
      makeNode('ss2','interface','type','SearchParams',{ kind:'interface', name:'SearchParams', fields:[{name:'q',type:'string'},{name:'type',type:'string',optional:true},{name:'page',type:'number',optional:true},{name:'limit',type:'number',optional:true},{name:'sortBy',type:'string',optional:true}] }, 40, 240),
      makeNode('ss3','pagination','type','PaginatedResults',{ kind:'pagination', name:'PaginatedResults', itemType:'SearchResult', defaultLimit:20, maxLimit:100 }, 40, 440),
      makeNode('ss4','cache','infra','Search Cache',{ kind:'cache', provider:'redis', url:'process.env.REDIS_URL', ttl:300, keyPrefix:'search:', strategies:[{pattern:'/api/search*',ttl:300}] }, 40, 600),
      makeNode('ss5','api-get','api','GET /api/search',{ kind:'api-endpoint', method:'GET', path:'/api/search', summary:'Full-text search', auth:false, responseType:'PaginatedResults', tags:['search'] }, 340, 40),
      makeNode('ss6','api-get','api','GET /api/search/suggestions',{ kind:'api-endpoint', method:'GET', path:'/api/search/suggestions', summary:'Search suggestions', auth:false, responseType:'string[]', tags:['search'] }, 340, 220),
      makeNode('ss7','use-query','logic','useSearchQuery',{ kind:'use-query', hookName:'useSearchQuery', endpoint:'/api/search', responseType:'PaginatedResults', staleTime:60000, retry:1 }, 620, 40),
      makeNode('ss8','search-bar','ui','GlobalSearchBar',{ kind:'search-bar', componentName:'GlobalSearchBar', placeholder:'搜尋所有內容...', searchType:'remote', endpoint:'/api/search/suggestions', debounce:300, resultType:'string[]' }, 900, 40),
    ],
    edges: [
      edge('e1','ss1','ss5'), edge('e2','ss2','ss5'), edge('e3','ss3','ss5'),
      edge('e4','ss4','ss5'), edge('e5','ss4','ss6'), edge('e6','ss5','ss7'),
      edge('e7','ss7','ss8'),
    ],
  },

  // ─── Microservices API Gateway ──────────────────────────────────
  {
    id: 'api-gateway',
    name: 'API Gateway 微服務',
    description: '統一入口 + 路由轉發 + 限流 + 認證中介層 + 服務發現',
    tags: ['NestJS', 'JWT', '四層架構', 'Cache'],
    nodeCount: 10,
    nodes: [
      makeNode('ag1','interface','type','ServiceConfig',{ kind:'interface', name:'ServiceConfig', fields:[{name:'name',type:'string'},{name:'url',type:'string'},{name:'timeout',type:'number'},{name:'retries',type:'number'},{name:'healthCheck',type:'string',optional:true}] }, 40, 40),
      makeNode('ag2','dto','type','ProxyRequestDto',{ kind:'dto', name:'ProxyRequestDto', fields:[{name:'service',type:'string',validation:['min(1)']},{name:'path',type:'string',validation:['min(1)']},{name:'method',type:'string'}], validator:'zod' }, 40, 260),
      makeNode('ag3','jwt','auth','JWT Middleware',{ kind:'jwt', name:'JwtModule', secret:'process.env.JWT_SECRET', expiresIn:'1h', refreshToken:true, payload:[{name:'sub',type:'string'},{name:'roles',type:'string[]'}] }, 40, 460),
      makeNode('ag4','middleware','infra','Rate Limit + CORS',{ kind:'middleware', middlewareName:'GatewayMiddleware', type:'global', rateLimiting:{ windowMs:60000, max:100 }, cors:{ origins:['http://localhost:3000'], methods:['GET','POST','PUT','DELETE','PATCH'] }, logging:true }, 40, 640),
      makeNode('ag5','cache','infra','Response Cache',{ kind:'cache', provider:'redis', url:'process.env.REDIS_URL', ttl:60, keyPrefix:'gw:', strategies:[{pattern:'/api/*/list',ttl:60}] }, 40, 820),
      makeNode('ag6','api-get','api','GET /gateway/:service/*',{ kind:'api-endpoint', method:'GET', path:'/gateway/:service/*', summary:'Proxy GET request', auth:true, responseType:'any', tags:['gateway'] }, 340, 40),
      makeNode('ag7','api-post','api','POST /gateway/:service/*',{ kind:'api-endpoint', method:'POST', path:'/gateway/:service/*', summary:'Proxy POST request', auth:true, responseType:'any', tags:['gateway'] }, 340, 200),
      makeNode('ag8','api-get','api','GET /health',{ kind:'api-endpoint', method:'GET', path:'/health', summary:'Gateway health check', auth:false, responseType:'{ status: string; services: ServiceConfig[] }', tags:['health'] }, 340, 380),
      makeNode('ag9','nest-module','api','GatewayModule',{ kind:'nest-module', name:'GatewayModule', controllers:['GatewayController'], providers:['GatewayService','ProxyService','DiscoveryService'], imports:['HttpModule','JwtModule','CacheModule'], global:false }, 340, 540),
      makeNode('ag10','nest-service','api','GatewayService',{ kind:'nest-service', name:'GatewayService', injectable:true, methods:[{name:'proxy',params:'service: string, path: string, req: Request',returnType:'Promise<any>',description:'Proxy request to service'},{name:'healthCheck',params:'',returnType:'Promise<ServiceConfig[]>',description:'Check all services'}], dependencies:['HttpService','CacheService'] }, 340, 740),
    ],
    edges: [
      edge('e1','ag1','ag6'), edge('e2','ag2','ag7'), edge('e3','ag3','ag6'),
      edge('e4','ag3','ag7'), edge('e5','ag4','ag6'), edge('e6','ag4','ag7'),
      edge('e7','ag5','ag6'), edge('e8','ag9','ag10'), edge('e9','ag10','ag6'), edge('e10','ag10','ag7'),
    ],
  },

  // ─── Blog with Comments ─────────────────────────────────────────
  {
    id: 'blog-full',
    name: '完整部落格系統',
    description: '文章 CRUD + 留言巢狀回覆 + 標籤分類 + 全文搜尋 + SEO',
    tags: ['Blog', 'NestJS', 'CRUD', '搜尋'],
    nodeCount: 11,
    nodes: [
      makeNode('bf1','interface','type','Article',{ kind:'interface', name:'Article', fields:[{name:'id',type:'string'},{name:'title',type:'string'},{name:'content',type:'string'},{name:'slug',type:'string'},{name:'authorId',type:'string'},{name:'tags',type:'string[]'},{name:'published',type:'boolean'},{name:'createdAt',type:'Date',optional:true}] }, 40, 40),
      makeNode('bf2','interface','type','Comment',{ kind:'interface', name:'Comment', fields:[{name:'id',type:'string'},{name:'content',type:'string'},{name:'authorId',type:'string'},{name:'articleId',type:'string'},{name:'parentId',type:'string',optional:true},{name:'createdAt',type:'Date',optional:true}] }, 40, 260),
      makeNode('bf3','dto','type','CreateArticleDto',{ kind:'dto', name:'CreateArticleDto', fields:[{name:'title',type:'string',validation:['min(3)','max(200)']},{name:'content',type:'string',validation:['min(10)']},{name:'tags',type:'string[]'},{name:'published',type:'boolean'}], validator:'zod' }, 40, 480),
      makeNode('bf4','pagination','type','PaginatedArticles',{ kind:'pagination', name:'PaginatedArticles', itemType:'Article', defaultLimit:10, maxLimit:50 }, 40, 680),
      makeNode('bf5','api-get','api','GET /api/articles',{ kind:'api-endpoint', method:'GET', path:'/api/articles', summary:'List published articles', auth:false, responseType:'PaginatedArticles', tags:['articles'] }, 340, 40),
      makeNode('bf6','api-post','api','POST /api/articles',{ kind:'api-endpoint', method:'POST', path:'/api/articles', summary:'Create article', auth:true, responseType:'Article', bodyType:'CreateArticleDto', tags:['articles'] }, 340, 220),
      makeNode('bf7','api-get','api','GET /api/articles/:slug',{ kind:'api-endpoint', method:'GET', path:'/api/articles/:slug', summary:'Get article by slug', auth:false, responseType:'Article', tags:['articles'] }, 340, 400),
      makeNode('bf8','api-post','api','POST /api/articles/:id/comments',{ kind:'api-endpoint', method:'POST', path:'/api/articles/:id/comments', summary:'Add comment', auth:true, responseType:'Comment', tags:['comments'] }, 340, 580),
      makeNode('bf9','use-query','logic','useArticlesQuery',{ kind:'use-query', hookName:'useArticlesQuery', endpoint:'/api/articles', responseType:'PaginatedArticles', staleTime:120000, retry:2 }, 640, 40),
      makeNode('bf10','use-mutation','logic','useCreateArticleMutation',{ kind:'use-mutation', hookName:'useCreateArticleMutation', endpoint:'/api/articles', method:'POST', bodyType:'CreateArticleDto', responseType:'Article', onSuccessInvalidate:['useArticlesQuery'] }, 640, 220),
      makeNode('bf11','data-table','ui','ArticlesTable',{ kind:'data-table', componentName:'ArticlesTable', dataType:'Article', columns:[{key:'title',label:'標題',sortable:true},{key:'tags',label:'標籤'},{key:'published',label:'狀態',type:'badge'},{key:'createdAt',label:'發布日期',type:'date',sortable:true}], pagination:true, searchable:true }, 900, 40),
    ],
    edges: [
      edge('e1','bf1','bf5'), edge('e2','bf3','bf6'), edge('e3','bf2','bf8'),
      edge('e4','bf4','bf5'), edge('e5','bf5','bf9'), edge('e6','bf6','bf10'),
      edge('e7','bf9','bf11'), edge('e8','bf10','bf11'),
    ],
  },

  // ─── Inventory Management ───────────────────────────────────────
  {
    id: 'inventory',
    name: '庫存管理系統',
    description: '商品庫存 + 入庫出庫記錄 + 低庫存警告 + 統計圖表',
    tags: ['CRUD', 'NestJS', 'Charts', 'Email'],
    nodeCount: 10,
    nodes: [
      makeNode('im1','interface','type','Product',{ kind:'interface', name:'Product', fields:[{name:'id',type:'string'},{name:'sku',type:'string'},{name:'name',type:'string'},{name:'quantity',type:'number'},{name:'minQuantity',type:'number'},{name:'unit',type:'string'},{name:'location',type:'string',optional:true}] }, 40, 40),
      makeNode('im2','interface','type','StockMovement',{ kind:'interface', name:'StockMovement', fields:[{name:'id',type:'string'},{name:'productId',type:'string'},{name:'type',type:'string'},{name:'quantity',type:'number'},{name:'note',type:'string',optional:true},{name:'createdAt',type:'Date',optional:true}] }, 40, 260),
      makeNode('im3','dto','type','AdjustStockDto',{ kind:'dto', name:'AdjustStockDto', fields:[{name:'productId',type:'string',validation:['min(1)']},{name:'type',type:'string'},{name:'quantity',type:'number',validation:['int()','min(1)']},{name:'note',type:'string',optional:true}], validator:'zod' }, 40, 480),
      makeNode('im4','email','infra','Low Stock Alert',{ kind:'email', provider:'nodemailer', from:'inventory@myapp.com', templates:[{name:'low-stock',subject:'⚠️ 低庫存警告'},{name:'out-of-stock',subject:'🚨 庫存不足'}] }, 40, 700),
      makeNode('im5','api-get','api','GET /api/inventory',{ kind:'api-endpoint', method:'GET', path:'/api/inventory', summary:'List all products', auth:true, responseType:'Product[]', tags:['inventory'] }, 340, 40),
      makeNode('im6','api-post','api','POST /api/inventory/adjust',{ kind:'api-endpoint', method:'POST', path:'/api/inventory/adjust', summary:'Adjust stock', auth:true, responseType:'StockMovement', bodyType:'AdjustStockDto', tags:['inventory'] }, 340, 220),
      makeNode('im7','api-get','api','GET /api/inventory/low-stock',{ kind:'api-endpoint', method:'GET', path:'/api/inventory/low-stock', summary:'Get low stock alerts', auth:true, responseType:'Product[]', tags:['inventory'] }, 340, 400),
      makeNode('im8','use-query','logic','useInventoryQuery',{ kind:'use-query', hookName:'useInventoryQuery', endpoint:'/api/inventory', responseType:'Product[]', staleTime:60000, retry:2 }, 620, 40),
      makeNode('im9','data-table','ui','InventoryTable',{ kind:'data-table', componentName:'InventoryTable', dataType:'Product', columns:[{key:'sku',label:'SKU',sortable:true},{key:'name',label:'商品名稱',sortable:true},{key:'quantity',label:'數量',type:'number',sortable:true},{key:'minQuantity',label:'最低庫存',type:'number'},{key:'location',label:'位置'}], pagination:true, searchable:true }, 900, 40),
      makeNode('im10','chart','ui','StockChart',{ kind:'chart', componentName:'StockChart', chartType:'bar', dataType:'StockMovement', xKey:'createdAt', yKey:'quantity', lib:'recharts' }, 900, 280),
    ],
    edges: [
      edge('e1','im1','im5'), edge('e2','im2','im6'), edge('e3','im3','im6'),
      edge('e4','im4','im7'), edge('e5','im5','im8'), edge('e6','im8','im9'),
      edge('e7','im8','im10'), edge('e8','im6','im8'),
    ],
  },

  // ─── Task Management ────────────────────────────────────────────
  {
    id: 'task-management',
    name: '任務管理系統',
    description: 'Kanban 看板 + 任務 CRUD + 指派成員 + 截止日期提醒',
    tags: ['CRUD', 'NestJS', 'JWT', 'Email'],
    nodeCount: 10,
    nodes: [
      makeNode('tm1','interface','type','Task',{ kind:'interface', name:'Task', fields:[{name:'id',type:'string'},{name:'title',type:'string'},{name:'description',type:'string',optional:true},{name:'status',type:'TaskStatus'},{name:'priority',type:'string'},{name:'assigneeId',type:'string',optional:true},{name:'dueDate',type:'Date',optional:true}] }, 40, 40),
      makeNode('tm2','enum','type','TaskStatus',{ kind:'enum', name:'TaskStatus', values:[{key:'TODO',value:'todo'},{key:'IN_PROGRESS',value:'in_progress'},{key:'REVIEW',value:'review'},{key:'DONE',value:'done'}], style:'string' }, 40, 280),
      makeNode('tm3','dto','type','CreateTaskDto',{ kind:'dto', name:'CreateTaskDto', fields:[{name:'title',type:'string',validation:['min(1)','max(200)']},{name:'description',type:'string',optional:true},{name:'priority',type:'string'},{name:'assigneeId',type:'string',optional:true},{name:'dueDate',type:'Date',optional:true}], validator:'zod' }, 40, 460),
      makeNode('tm4','jwt','auth','JWT Config',{ kind:'jwt', name:'JwtModule', secret:'process.env.JWT_SECRET', expiresIn:'8h', refreshToken:false, payload:[{name:'sub',type:'string'},{name:'email',type:'string'}] }, 40, 680),
      makeNode('tm5','api-get','api','GET /api/tasks',{ kind:'api-endpoint', method:'GET', path:'/api/tasks', summary:'List tasks', auth:true, responseType:'Task[]', tags:['tasks'] }, 340, 40),
      makeNode('tm6','api-post','api','POST /api/tasks',{ kind:'api-endpoint', method:'POST', path:'/api/tasks', summary:'Create task', auth:true, responseType:'Task', bodyType:'CreateTaskDto', tags:['tasks'] }, 340, 220),
      makeNode('tm7','api-patch','api','PATCH /api/tasks/:id',{ kind:'api-endpoint', method:'PATCH', path:'/api/tasks/:id', summary:'Update task status', auth:true, responseType:'Task', tags:['tasks'] }, 340, 400),
      makeNode('tm8','use-query','logic','useTasksQuery',{ kind:'use-query', hookName:'useTasksQuery', endpoint:'/api/tasks', responseType:'Task[]', staleTime:60000, retry:2 }, 620, 40),
      makeNode('tm9','use-mutation','logic','useCreateTaskMutation',{ kind:'use-mutation', hookName:'useCreateTaskMutation', endpoint:'/api/tasks', method:'POST', bodyType:'CreateTaskDto', responseType:'Task', onSuccessInvalidate:['useTasksQuery'] }, 620, 220),
      makeNode('tm10','form','ui','CreateTaskForm',{ kind:'form', componentName:'CreateTaskForm', dtoType:'CreateTaskDto', fields:[{name:'title',label:'任務標題',type:'text',required:true},{name:'description',label:'描述',type:'textarea'},{name:'priority',label:'優先級',type:'select',options:[{value:'low',label:'低'},{value:'medium',label:'中'},{value:'high',label:'高'}]},{name:'dueDate',label:'截止日期',type:'date'}], onSubmit:'useCreateTaskMutation', validator:'zod' }, 900, 40),
    ],
    edges: [
      edge('e1','tm1','tm5'), edge('e2','tm3','tm6'), edge('e3','tm4','tm5'),
      edge('e4','tm4','tm7'), edge('e5','tm5','tm8'), edge('e6','tm6','tm9'),
      edge('e7','tm8','tm10'), edge('e8','tm9','tm10'),
    ],
  },
]

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map(t => [t.id, t]))
