# 🎯 MyBlog 实践练习指南

> 通过动手实验深入理解已有功能的核心知识点

---

## 📋 练习目标

通过以下练习，你将：
- 🔧 掌握项目配置和构建工具使用
- 🎨 理解组件化开发和响应式设计
- ⚡ 学会调试和性能优化技巧
- 🔄 熟练前后端通信和状态管理

---

## 🏗️ 练习1：项目架构探索 (15分钟)

### 任务：理解 Monorepo 和工作空间

1. **探索项目结构**
   ```bash
   # 查看完整目录树
   tree -I node_modules

   # 查看workspace配置
   cat pnpm-workspace.yaml

   # 查看根目录脚本
   cat package.json | grep -A 10 "scripts"
   ```

2. **实验workspace命令**
   ```bash
   # 查看所有workspace包
   pnpm list --depth=0

   # 只给后端添加依赖（模拟）
   pnpm --filter backend info express

   # 查看前端依赖
   pnpm --filter frontend list --depth=0
   ```

3. **修改根目录脚本**
   在`package.json`中添加新脚本：
   ```json
   "check": "pnpm --filter backend type-check && pnpm --filter frontend type-check",
   "clean:all": "pnpm clean && pnpm install"
   ```

**🎯 学习要点：**
- Monorepo 的优势和管理方式
- pnpm workspace 命令使用
- 包管理策略

---

## ⚡ 练习2：后端服务探索 (20分钟)

### 任务：理解Express.js中间件和API设计

1. **分析中间件执行顺序**
   在`backend/src/index.ts`中添加调试中间件：
   ```typescript
   // 在helmet()之后添加
   app.use((req, res, next) => {
     console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
     next();
   });
   ```

2. **创建新的API端点**
   在健康检查后添加：
   ```typescript
   // 系统信息API
   app.get('/api/system', (req, res) => {
     res.json({
       platform: process.platform,
       nodeVersion: process.version,
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       timestamp: new Date().toISOString()
     });
   });
   ```

3. **测试API响应**
   ```bash
   # 测试新端点
   curl http://localhost:3001/api/system | json_pp

   # 观察控制台日志
   curl http://localhost:3001/health
   curl http://localhost:3001/api
   ```

**🎯 学习要点：**
- Express中间件执行流程
- RESTful API设计原则
- Node.js进程信息获取

---

## ⚛️ 练习3：React组件深入 (25分钟)

### 任务：探索React Hooks和组件生命周期

1. **添加调试Hook**
   创建`frontend/src/hooks/useDebug.ts`：
   ```typescript
   import { useEffect, useRef } from 'react';

   export function useDebug(componentName: string, props: any) {
     const renderCount = useRef(0);

     useEffect(() => {
       renderCount.current += 1;
       console.log(`🔄 ${componentName} 渲染 #${renderCount.current}`, props);
     });

     useEffect(() => {
       console.log(`✅ ${componentName} 组件挂载`);
       return () => {
         console.log(`❌ ${componentName} 组件卸载`);
       };
     }, []);
   }
   ```

2. **在HomePage中使用调试Hook**
   在`HomePage.tsx`开头添加：
   ```typescript
   import { useDebug } from '@/hooks/useDebug';

   export default function HomePage() {
     useDebug('HomePage', { timestamp: Date.now() });
     // ... 其余代码
   ```

3. **实验状态更新**
   在HomePage中添加计数器：
   ```typescript
   const [counter, setCounter] = useState(0);

   // 在按钮区域添加
   <button
     onClick={() => setCounter(c => c + 1)}
     className="btn-ghost px-4 py-2"
   >
     点击次数: {counter}
   </button>
   ```

**🎯 学习要点：**
- React Hooks使用模式
- 组件重新渲染机制
- 状态更新最佳实践

---

## 🎨 练习4：Tailwind CSS响应式设计 (20分钟)

### 任务：掌握响应式设计和主题系统

1. **创建响应式测试组件**
   创建`frontend/src/components/ResponsiveTest.tsx`：
   ```tsx
   export default function ResponsiveTest() {
     return (
       <div className="p-8">
         <h3 className="text-2xl font-bold mb-6">响应式测试</h3>

         {/* 响应式网格 */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           {[1,2,3,4].map(i => (
             <div key={i} className="bg-blue-100 p-4 rounded-lg text-center">
               <span className="block sm:hidden">📱 手机 {i}</span>
               <span className="hidden sm:block lg:hidden">📟 平板 {i}</span>
               <span className="hidden lg:block">💻 桌面 {i}</span>
             </div>
           ))}
         </div>

         {/* 响应式文字 */}
         <p className="text-sm md:text-base lg:text-lg xl:text-xl">
           这段文字在不同屏幕尺寸下有不同大小
         </p>
       </div>
     );
   }
   ```

2. **在HomePage中引入测试组件**
   ```tsx
   import ResponsiveTest from '@/components/ResponsiveTest';

   // 在API状态检查后添加
   <section className="py-16 bg-white">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <ResponsiveTest />
     </div>
   </section>
   ```

3. **测试响应式效果**
   - 调整浏览器窗口大小观察变化
   - 使用浏览器开发者工具的响应式模式
   - 尝试修改断点值

**🎯 学习要点：**
- Tailwind响应式断点系统
- 移动优先设计原则
- 响应式组件设计模式

---

## 🔧 练习5：TypeScript类型系统 (15分钟)

### 任务：强化类型安全和错误处理

1. **创建严格类型定义**
   创建`frontend/src/types/api.ts`：
   ```typescript
   export interface ApiResponse<T = any> {
     success: boolean;
     data?: T;
     error?: string;
     timestamp: string;
   }

   export interface HealthStatus {
     status: 'OK' | 'ERROR';
     uptime: number;
     environment: string;
     timestamp: string;
   }

   export interface SystemInfo {
     platform: string;
     nodeVersion: string;
     memory: NodeJS.MemoryUsage;
   }
   ```

2. **改进HomePage的类型安全**
   ```typescript
   import { ApiResponse, HealthStatus } from '@/types/api';

   const [apiStatus, setApiStatus] = useState<ApiResponse<HealthStatus> | null>(null);

   // 在API调用中使用类型
   const checkApiStatus = async () => {
     try {
       const response = await fetch('/api/system');
       const data: ApiResponse<SystemInfo> = await response.json();
       // TypeScript会检查类型匹配
     } catch (error) {
       // 类型安全的错误处理
       if (error instanceof Error) {
         console.error('API错误:', error.message);
       }
     }
   };
   ```

**🎯 学习要点：**
- TypeScript接口定义
- 泛型类型使用
- 类型安全的错误处理

---

## 🚀 练习6：性能分析和优化 (25分钟)

### 任务：学习性能监控和优化技巧

1. **添加性能监控**
   在`HomePage.tsx`中添加：
   ```typescript
   import { useEffect, useState } from 'react';

   function usePageLoadTime() {
     const [loadTime, setLoadTime] = useState<number | null>(null);

     useEffect(() => {
       const startTime = performance.now();

       return () => {
         const endTime = performance.now();
         setLoadTime(endTime - startTime);
         console.log(`📊 HomePage 渲染时间: ${(endTime - startTime).toFixed(2)}ms`);
       };
     }, []);

     return loadTime;
   }

   // 在组件中使用
   const pageLoadTime = usePageLoadTime();
   ```

2. **创建性能分析工具**
   创建`frontend/src/utils/performance.ts`：
   ```typescript
   export class PerformanceMonitor {
     private static marks: Map<string, number> = new Map();

     static startMark(name: string) {
       this.marks.set(name, performance.now());
       performance.mark(`${name}-start`);
     }

     static endMark(name: string): number {
       const startTime = this.marks.get(name);
       if (!startTime) return 0;

       const duration = performance.now() - startTime;
       performance.mark(`${name}-end`);
       performance.measure(name, `${name}-start`, `${name}-end`);

       console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
       return duration;
     }
   }
   ```

3. **分析网络请求性能**
   ```typescript
   // 在API调用中添加性能监控
   const checkApiStatus = async () => {
     PerformanceMonitor.startMark('api-health-check');

     try {
       const response = await fetch('/api');
       PerformanceMonitor.endMark('api-health-check');

       // 分析响应时间
       const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
       console.log('📊 页面加载性能:', {
         domReady: timing.domContentLoadedEventEnd - timing.fetchStart,
         loadComplete: timing.loadEventEnd - timing.fetchStart
       });
     } catch (error) {
       PerformanceMonitor.endMark('api-health-check');
     }
   };
   ```

**🎯 学习要点：**
- Performance API使用
- 渲染性能优化
- 网络请求性能监控

---

## 🧪 练习7：调试技巧实践 (20分钟)

### 任务：掌握前后端调试方法

1. **后端调试增强**
   在`backend/src/index.ts`中添加调试中间件：
   ```typescript
   // 请求详情记录
   app.use((req, res, next) => {
     const start = Date.now();

     res.on('finish', () => {
       const duration = Date.now() - start;
       console.log(`📊 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
     });

     next();
   });
   ```

2. **前端调试工具**
   创建`frontend/src/utils/debug.ts`：
   ```typescript
   export const debug = {
     log: (message: string, data?: any) => {
       if (import.meta.env.DEV) {
         console.log(`🐛 ${message}`, data || '');
       }
     },

     group: (title: string, fn: () => void) => {
       if (import.meta.env.DEV) {
         console.group(`📁 ${title}`);
         fn();
         console.groupEnd();
       }
     },

     time: (label: string) => {
       if (import.meta.env.DEV) {
         console.time(`⏱️ ${label}`);
       }
     },

     timeEnd: (label: string) => {
       if (import.meta.env.DEV) {
         console.timeEnd(`⏱️ ${label}`);
       }
     }
   };
   ```

3. **错误边界测试**
   创建`frontend/src/components/ErrorBoundary.tsx`：
   ```tsx
   import { Component, ErrorInfo, ReactNode } from 'react';

   interface Props {
     children: ReactNode;
   }

   interface State {
     hasError: boolean;
     error?: Error;
   }

   export class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }

     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       console.error('🚨 组件错误:', error, errorInfo);
     }

     render() {
       if (this.state.hasError) {
         return (
           <div className="p-8 text-center">
             <h2 className="text-2xl font-bold text-red-600 mb-4">出错了！</h2>
             <p className="text-gray-600 mb-4">组件渲染时发生错误</p>
             <button
               onClick={() => this.setState({ hasError: false })}
               className="btn-primary"
             >
               重新加载
             </button>
           </div>
         );
       }

       return this.props.children;
     }
   }
   ```

**🎯 学习要点：**
- 开发环境调试技巧
- 错误边界和异常处理
- 日志记录最佳实践

---

## 📚 练习总结和反思

完成这些练习后，请回答以下问题：

### 🤔 反思问题

1. **架构理解**
   - Monorepo相比多个独立仓库有什么具体优势？
   - pnpm相比npm/yarn有哪些显著差异？

2. **技术栈选择**
   - 为什么选择TypeScript而不是JavaScript？
   - Vite相比Webpack在开发体验上有什么改进？

3. **性能优化**
   - 哪些因素会影响React组件的重新渲染？
   - 如何平衡开发体验和生产性能？

4. **开发工具**
   - 类型安全如何帮助减少运行时错误？
   - 响应式设计的核心原则是什么？

### 📝 学习记录

在`docs/MY_LEARNING_LOG.md`中记录：
- 练习过程中遇到的问题
- 新学到的概念和技巧
- 对全栈开发的理解变化
- 下一步想深入学习的方向

---

## 🎯 下一步学习方向

基于练习结果，选择感兴趣的方向深入：

- 🗄️ **数据库和ORM** - 学习Prisma和PostgreSQL
- 🔐 **用户认证** - 实现JWT和权限系统
- 🎨 **高级UI组件** - 构建可复用组件库
- ⚡ **性能优化** - 深入React和Node.js性能调优
- 🚀 **部署运维** - 容器化和云部署

---

*💡 记住：最好的学习方式是动手实践和主动思考！*
