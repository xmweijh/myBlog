export default function AboutPage() {
  return (
    <div className="py-20 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            关于 MyBlog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            这是一个用于学习全栈开发的实践项目，基于现代化的技术栈构建
          </p>
        </div>

        <div className="space-y-12">
          {/* 项目介绍 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">项目简介</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                MyBlog 是一个现代化的全栈博客系统，旨在提供完整的学习和实践体验。
                项目参考了优秀的开源博客系统 Aurora 的设计理念，使用 React + Node.js + TypeScript 技术栈重新实现。
              </p>
              <p>
                通过这个项目，你可以学习到前端开发、后端开发、数据库设计、部署运维等全栈开发的核心技能。
                项目采用渐进式开发方式，从基础功能开始，逐步添加复杂特性。
              </p>
            </div>
          </section>

          {/* 技术栈 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">技术栈</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">前端技术</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• React 18 - 现代化前端框架</li>
                  <li>• TypeScript - 类型安全的JavaScript</li>
                  <li>• Vite - 快速的构建工具</li>
                  <li>• Tailwind CSS - 原子化CSS框架</li>
                  <li>• Zustand - 轻量级状态管理</li>
                  <li>• React Router - 路由管理</li>
                  <li>• React Query - 数据获取和缓存</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">后端技术</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Node.js - JavaScript 运行时</li>
                  <li>• Express.js - Web应用框架</li>
                  <li>• TypeScript - 服务端类型安全</li>
                  <li>• Prisma - 现代化ORM工具</li>
                  <li>• PostgreSQL - 关系型数据库</li>
                  <li>• JWT - 身份认证</li>
                  <li>• Jest - 测试框架</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 开发阶段 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">开发计划</h2>
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                    stage.status === 'current' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{stage.title}</h3>
                    <p className="text-gray-600 mt-1">{stage.description}</p>
                    <div className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                      stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                      stage.status === 'current' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {stage.status === 'completed' ? '已完成' :
                       stage.status === 'current' ? '进行中' : '计划中'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 学习资源 */}
          <section className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">相关资源</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">官方文档</h3>
                <ul className="space-y-2">
                  <li><a href="https://react.dev/" className="text-blue-600 hover:underline">React 官方文档</a></li>
                  <li><a href="https://nodejs.org/" className="text-blue-600 hover:underline">Node.js 官方网站</a></li>
                  <li><a href="https://www.typescriptlang.org/" className="text-blue-600 hover:underline">TypeScript 文档</a></li>
                  <li><a href="https://tailwindcss.com/" className="text-blue-600 hover:underline">Tailwind CSS 文档</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">参考项目</h3>
                <ul className="space-y-2">
                  <li><a href="https://github.com/linhaojun857/aurora" className="text-blue-600 hover:underline">Aurora 博客系统</a></li>
                  <li><a href="https://vitejs.dev/" className="text-blue-600 hover:underline">Vite 官方文档</a></li>
                  <li><a href="https://www.prisma.io/" className="text-blue-600 hover:underline">Prisma 文档</a></li>
                  <li><a href="https://expressjs.com/" className="text-blue-600 hover:underline">Express.js 文档</a></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// 开发阶段数据
const stages = [
  {
    title: '项目初始化',
    description: '搭建开发环境，配置工具链，创建基础项目结构',
    status: 'current' as const
  },
  {
    title: '后端API开发',
    description: '实现用户认证、文章管理、评论系统等核心API',
    status: 'pending' as const
  },
  {
    title: '前端应用开发',
    description: '构建用户界面，实现交互功能，集成API接口',
    status: 'pending' as const
  },
  {
    title: '核心功能实现',
    description: '完善业务逻辑，添加高级功能，优化用户体验',
    status: 'pending' as const
  },
  {
    title: '部署和优化',
    description: '生产环境部署，性能优化，监控和维护',
    status: 'pending' as const
  }
]
