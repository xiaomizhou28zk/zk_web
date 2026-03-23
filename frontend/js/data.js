// 模拟博客数据：文章列表
const BLOG_ARTICLES = [
  {
    id: 1,
    title: '初探现代前端工程化',
    summary: '从打包工具到模块化，梳理前端工程化的核心概念与常用实践。',
    author: { name: '李明', avatar: '👨‍💻' },
    publishedAt: '2025-03-15 14:30',
    cover: '📦',
  },
  {
    id: 2,
    title: 'TypeScript 类型体操入门',
    summary: '通过几个小例子理解泛型、条件类型与映射类型，写出更安全的代码。',
    author: { name: '王芳', avatar: '👩‍💻' },
    publishedAt: '2025-03-14 09:00',
    cover: '🔷',
  },
  {
    id: 3,
    title: 'CSS 变量与主题切换',
    summary: '用 CSS 自定义属性实现亮色/暗色主题切换，无需 JS 参与。',
    author: { name: '张伟', avatar: '👨‍🎨' },
    publishedAt: '2025-03-13 18:20',
    cover: '🎨',
  },
  {
    id: 4,
    title: 'REST 与 GraphQL 选型思考',
    summary: '从接口设计、缓存与生态角度对比两种 API 风格，帮助做技术选型。',
    author: { name: '刘洋', avatar: '👨‍💻' },
    publishedAt: '2025-03-12 11:15',
    cover: '🔌',
  },
  {
    id: 5,
    title: 'Vite 与 Webpack 使用体验',
    summary: '开发体验、构建速度与生态对比，以及迁移时需要注意的点。',
    author: { name: '陈静', avatar: '👩‍💻' },
    publishedAt: '2025-03-11 16:45',
    cover: '⚡',
  },
  {
    id: 6,
    title: '前端性能优化清单',
    summary: '从首屏、交互到长列表，一份可落地的性能优化检查表。',
    author: { name: '李明', avatar: '👨‍💻' },
    publishedAt: '2025-03-10 10:00',
    cover: '🚀',
  },
  {
    id: 7,
    title: '从零搭建一个简单博客',
    summary: '用纯 HTML/CSS/JS 实现文章列表、分页与评论，适合练手。',
    author: { name: '王芳', avatar: '👩‍💻' },
    publishedAt: '2025-03-09 14:20',
    cover: '📝',
  },
  {
    id: 8,
    title: 'Git 协作流程与规范',
    summary: '分支策略、提交信息与 Code Review 的实践建议。',
    author: { name: '张伟', avatar: '👨‍🎨' },
    publishedAt: '2025-03-08 09:30',
    cover: '🌿',
  },
  {
    id: 9,
    title: '浏览器渲染原理简述',
    summary: 'DOM、CSSOM、布局与绘制的简要流程，便于理解性能优化。',
    author: { name: '刘洋', avatar: '👨‍💻' },
    publishedAt: '2025-03-07 15:00',
    cover: '🖥️',
  },
  {
    id: 10,
    title: '可访问性（a11y）入门',
    summary: '语义化、焦点管理与 ARIA 的简单应用，让页面更友好。',
    author: { name: '陈静', avatar: '👩‍💻' },
    publishedAt: '2025-03-06 11:40',
    cover: '♿',
  },
  {
    id: 11,
    title: 'React Hooks 实战技巧',
    summary: 'useEffect 依赖、自定义 Hook 与性能优化，避免常见坑。',
    author: { name: '李明', avatar: '👨‍💻' },
    publishedAt: '2025-03-05 10:20',
    cover: '⚛️',
  },
  {
    id: 12,
    title: 'Node.js 异步编程模型',
    summary: '事件循环、Promise 与 async/await 在服务端的正确用法。',
    author: { name: '王芳', avatar: '👩‍💻' },
    publishedAt: '2025-03-04 15:30',
    cover: '🟢',
  },
  {
    id: 13,
    title: '移动端适配方案总结',
    summary: 'viewport、rem、vw 与媒体查询，选型与混用建议。',
    author: { name: '张伟', avatar: '👨‍🎨' },
    publishedAt: '2025-03-03 09:15',
    cover: '📱',
  },
  {
    id: 14,
    title: 'Docker 入门与前端联调',
    summary: '用容器跑前端与 Mock 服务，统一团队开发环境。',
    author: { name: '刘洋', avatar: '👨‍💻' },
    publishedAt: '2025-03-02 14:00',
    cover: '🐳',
  },
  {
    id: 15,
    title: '单元测试与 E2E 取舍',
    summary: '测试金字塔、覆盖率与 ROI，前端测试的实用策略。',
    author: { name: '陈静', avatar: '👩‍💻' },
    publishedAt: '2025-03-01 11:45',
    cover: '🧪',
  },
  {
    id: 16,
    title: '状态管理：从 Redux 到 Zustand',
    summary: '何时需要全局状态、如何选型，以及轻量方案的对比。',
    author: { name: '李明', avatar: '👨‍💻' },
    publishedAt: '2025-02-28 16:20',
    cover: '📊',
  },
  {
    id: 17,
    title: 'HTTP 缓存机制详解',
    summary: '强缓存、协商缓存与常用响应头，减少重复请求。',
    author: { name: '王芳', avatar: '👩‍💻' },
    publishedAt: '2025-02-27 10:10',
    cover: '📡',
  },
  {
    id: 18,
    title: 'CSS Grid 布局实战',
    summary: '二维布局、命名区域与响应式，告别复杂 float。',
    author: { name: '张伟', avatar: '👨‍🎨' },
    publishedAt: '2025-02-26 13:50',
    cover: '▦',
  },
  {
    id: 19,
    title: 'Monorepo 工具链选型',
    summary: 'pnpm workspace、Turborepo 与 Nx 的简单对比与上手。',
    author: { name: '刘洋', avatar: '👨‍💻' },
    publishedAt: '2025-02-25 09:30',
    cover: '📁',
  },
  {
    id: 20,
    title: 'Web 安全基础：XSS 与 CSRF',
    summary: '常见攻击方式与防护手段，前后端各自的责任。',
    author: { name: '陈静', avatar: '👩‍💻' },
    publishedAt: '2025-02-24 15:15',
    cover: '🔒',
  },
  {
    id: 21,
    title: 'Tailwind CSS 使用心得',
    summary: '原子类、设计令牌与可维护性，何时值得引入。',
    author: { name: '李明', avatar: '👨‍💻' },
    publishedAt: '2025-02-23 11:00',
    cover: '🎨',
  },
  {
    id: 22,
    title: 'SSR 与 SSG 简要对比',
    summary: 'Next.js、Nuxt 与静态站点生成，选型考量。',
    author: { name: '王芳', avatar: '👩‍💻' },
    publishedAt: '2025-02-22 14:40',
    cover: '🌐',
  },
  {
    id: 23,
    title: '前端监控与错误上报',
    summary: '性能指标、异常捕获与日志上报的简易方案。',
    author: { name: '张伟', avatar: '👨‍🎨' },
    publishedAt: '2025-02-21 10:25',
    cover: '📈',
  },
  {
    id: 24,
    title: 'API 设计风格与版本管理',
    summary: 'RESTful 约定、版本号策略与向后兼容实践。',
    author: { name: '刘洋', avatar: '👨‍💻' },
    publishedAt: '2025-02-20 16:00',
    cover: '🔗',
  },
  {
    id: 25,
    title: '从设计稿到切图协作',
    summary: '标注、切图与设计系统，提升前后端协作效率。',
    author: { name: '陈静', avatar: '👩‍💻' },
    publishedAt: '2025-02-19 09:50',
    cover: '✂️',
  },
  { id: 26, title: '微前端架构实践', summary: 'qiankun、Module Federation 与子应用隔离的选型与落地。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-02-18 14:00', cover: '🧩' },
  { id: 27, title: 'Webpack 5 新特性速览', summary: '持久化缓存、资源模块与 Node polyfill 移除带来的变化。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-02-17 10:30', cover: '📦' },
  { id: 28, title: '前端 CI/CD 流水线搭建', summary: 'GitHub Actions 与 Jenkins 的配置示例与最佳实践。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-02-16 16:20', cover: '🔄' },
  { id: 29, title: 'Electron 桌面应用开发入门', summary: '主进程与渲染进程、打包与自动更新的简要指南。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-02-15 09:15', cover: '🖥️' },
  { id: 30, title: 'Web 动画性能优化', summary: 'requestAnimationFrame、CSS 动画与 will-change 的合理使用。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-02-14 11:40', cover: '✨' },
  { id: 31, title: 'GraphQL 服务端实现', summary: 'Schema 设计、Resolver 与 N+1 问题的解决思路。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-02-13 15:00', cover: '🔷' },
  { id: 32, title: 'PWA 离线与安装体验', summary: 'Service Worker、manifest 与缓存策略的实战总结。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-02-12 10:00', cover: '📱' },
  { id: 33, title: '前端国际化（i18n）方案', summary: '文案抽取、复数与日期格式化的常见做法。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-02-11 14:30', cover: '🌍' },
  { id: 34, title: 'Chrome DevTools 调试技巧', summary: 'Performance、Network 与 Source 面板的进阶用法。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-02-10 09:50', cover: '🔧' },
  { id: 35, title: '设计 tokens 与样式规范', summary: '颜色、间距与字体的统一管理与在设计/代码间的同步。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-02-09 16:10', cover: '🎨' },
  { id: 36, title: 'Vue 3 Composition API 心得', summary: 'ref、reactive 与组合式函数的封装与复用。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-02-08 11:20', cover: '💚' },
  { id: 37, title: '前端埋点与数据上报', summary: '点击、曝光与自定义事件的采集与发送策略。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-02-07 14:00', cover: '📊' },
  { id: 38, title: 'WebSocket 实时通信实践', summary: '连接管理、重连与心跳在前端中的实现。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-02-06 10:45', cover: '🔌' },
  { id: 39, title: '大表单与长列表性能', summary: '虚拟滚动、分步提交与防抖节流的综合运用。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-02-05 15:30', cover: '📋' },
  { id: 40, title: 'Nginx 与前端资源部署', summary: '静态资源缓存、gzip 与 SPA 路由的配置要点。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-02-04 09:00', cover: '🖥️' },
  { id: 41, title: '低代码平台前端架构', summary: '表单/流程引擎与 DSL 渲染的常见实现思路。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-02-03 13:20', cover: '🧱' },
  { id: 42, title: '前端 Code Review 清单', summary: '可读性、安全与性能的检查项与团队约定。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-02-02 11:10', cover: '✅' },
  { id: 43, title: 'Rust 与 WebAssembly 初探', summary: 'wasm-pack 与在浏览器中运行 Rust 的入门示例。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-02-01 16:40', cover: '🦀' },
  { id: 44, title: '前端工程化之 Monorepo', summary: '包划分、依赖提升与脚本编排的实战经验。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-01-31 10:00', cover: '📁' },
  { id: 45, title: 'Sketch/Figma 与开发协作', summary: '设计稿交付、标注与组件映射的流程优化。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-01-30 14:15', cover: '✂️' },
  { id: 46, title: '前端错误边界与降级', summary: 'React Error Boundary 与全局兜底页的设计。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-01-29 09:30', cover: '🛡️' },
  { id: 47, title: 'Node 脚本与脚手架开发', summary: 'Commander、Inquirer 与本地模板渲染的简单实现。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-01-28 11:50', cover: '⚙️' },
  { id: 48, title: 'CSS 容器查询入门', summary: 'container-type、container-query 与响应式组件。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-01-27 15:20', cover: '▦' },
  { id: 49, title: '前端灰度发布方案', summary: '按用户、比例与规则的流量切换与回滚。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-01-26 10:40', cover: '🎚️' },
  { id: 50, title: 'Web 端 PDF 预览与标注', summary: 'pdf.js 与 Canvas 叠加层的基本用法。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-01-25 13:00', cover: '📄' },
  { id: 51, title: '前端资源加载优化', summary: '预加载、懒加载与关键路径的取舍。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-01-24 16:00', cover: '⏱️' },
  { id: 52, title: 'Jest 与 React 组件测试', summary: '渲染、交互与 Mock 的常见写法。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-01-23 09:20', cover: '🧪' },
  { id: 53, title: 'Web 字体与 FOIT/FOUT', summary: 'font-display 与字体子集化的实践。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-01-22 12:30', cover: '🔤' },
  { id: 54, title: '前端权限与路由控制', summary: '菜单、按钮与动态路由的权限模型设计。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-01-21 14:50', cover: '🔐' },
  { id: 55, title: '大厂前端面试题精选', summary: '基础、框架与工程化的常见考点梳理。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-01-20 11:00', cover: '📝' },
  { id: 56, title: 'Three.js 与 3D 可视化', summary: '场景、相机与简单模型的浏览器端渲染。', author: { name: '李明', avatar: '👨‍💻' }, publishedAt: '2025-01-19 15:40', cover: '🎲' },
  { id: 57, title: '前端日志与排查技巧', summary: 'Source Map、用户行为轨迹与错误复现。', author: { name: '王芳', avatar: '👩‍💻' }, publishedAt: '2025-01-18 10:10', cover: '🔍' },
  { id: 58, title: 'Svelte 与响应式原理', summary: '编译时优化与细粒度更新的简要介绍。', author: { name: '张伟', avatar: '👨‍🎨' }, publishedAt: '2025-01-17 13:25', cover: '⚡' },
  { id: 59, title: '前端重构与渐进增强', summary: '在不影响线上的前提下做技术升级的策略。', author: { name: '刘洋', avatar: '👨‍💻' }, publishedAt: '2025-01-16 16:00', cover: '🔨' },
  { id: 60, title: '开源组件库维护心得', summary: '文档、版本与社区协作的几点体会。', author: { name: '陈静', avatar: '👩‍💻' }, publishedAt: '2025-01-15 09:45', cover: '📚' },
];

// 每篇文章的正文（详情页用）
const ARTICLE_BODIES = {
  1: `<p>前端工程化涵盖构建、模块化、规范与协作等方方面面。本文从打包工具谈起，介绍 Webpack、Vite 等如何解决模块打包与开发体验问题。</p>
  <p>随后会涉及代码规范（ESLint/Prettier）、提交规范、以及简单的 CI 流程，帮助小团队快速搭起一套可用的工程化底座。</p>`,
  2: `<p>TypeScript 的类型系统不仅能做静态检查，还能通过泛型、条件类型等写出「类型即文档」的代码。本文用几个由浅入深的小例子，带你入门类型体操。</p>
  <p>包括：泛型约束、keyof、条件类型与 infer，以及如何在业务代码里适度使用，避免过度设计。</p>`,
  3: `<p>使用 <code>--primary-color</code>、<code>--bg-color</code> 等 CSS 变量，配合 <code>prefers-color-scheme</code> 或一个切换类，即可实现主题切换。</p>
  <p>文中会给出一个最小可用的示例，并说明在组件库或大型项目中的组织方式。</p>`,
  4: `<p>REST 与 GraphQL 各有适用场景。REST 简单、缓存友好；GraphQL 灵活、减少请求次数。本文从接口设计、前后端协作和生态工具角度做对比。</p>
  <p>并给出选型建议：何时用 REST、何时考虑 GraphQL，以及混合使用的可能。</p>`,
  5: `<p>Vite 凭借 ESM 与 esbuild 带来极快的冷启动与 HMR；Webpack 生态成熟、可定制性强。本文对比两者在开发与构建阶段的体验差异。</p>
  <p>并简要说明从 Webpack 迁移到 Vite 时，配置与插件上的注意点。</p>`,
  6: `<p>性能优化可从多个维度入手：资源体积、加载策略、渲染路径与交互响应。本文整理一份清单，涵盖图片、字体、首屏与长列表等。</p>
  <p>每个条目附带简要做法与可用的测量工具，便于按图索骥。</p>`,
  7: `<p>不依赖框架，用原生 HTML、CSS 和 JavaScript 实现一个简单的博客：文章列表、分页、文章详情与评论。适合作为练手项目。</p>
  <p>文中会给出数据结构和关键逻辑，便于你本地扩展或接入后端 API。</p>`,
  8: `<p>合理的分支策略（如 Git Flow、GitHub Flow）与提交信息规范，能显著提升团队协作效率。本文介绍常用流程与约定。</p>
  <p>并简要讨论 Code Review 的节奏与关注点，以及如何用 CI 自动化部分检查。</p>`,
  9: `<p>从 HTML/CSS 到像素上屏，大致会经历 DOM、CSSOM、布局、绘制与合成等阶段。了解这些有助于理解重排、重绘与合成层。</p>
  <p>本文用简图与文字梳理这条链路，并指出常见性能问题的对应阶段。</p>`,
  10: `<p>可访问性（Accessibility）能让更多用户顺畅使用你的产品。本文从语义化标签、焦点管理与 ARIA 属性入手，给出入门级实践。</p>
  <p>包括键盘导航、屏幕阅读器兼容与对比度等基础要点。</p>`,
  11: `<p>React Hooks 让函数组件也能拥有状态与副作用。本文聚焦 useEffect 的依赖数组、清理函数与自定义 Hook 的封装技巧。</p>
  <p>并讨论 useMemo、useCallback 的适用场景，避免过度优化。</p>`,
  12: `<p>Node.js 基于事件循环与异步 I/O，理解其模型有助于写出高效、可预测的服务端代码。</p>
  <p>本文梳理回调、Promise 与 async/await 的关系，以及常见误区。</p>`,
  13: `<p>移动端屏幕尺寸与像素比多样，适配方案各有取舍。本文对比 viewport、rem、vw 以及媒体查询的适用场景。</p>
  <p>并给出混合使用与设计稿换算的实用建议。</p>`,
  14: `<p>Docker 可统一开发、测试与部署环境。本文介绍基础概念与常用命令，并演示如何用容器跑前端与 Mock 服务。</p>
  <p>便于团队新成员一键启动项目。</p>`,
  15: `<p>测试能提升信心，但投入需有回报。本文讨论测试金字塔、覆盖率指标与 E2E 的取舍。</p>
  <p>并给出前端单元测试与集成测试的实用策略。</p>`,
  16: `<p>全局状态并非所有项目都需要。本文从 Redux 到 Zustand、Jotai 等轻量方案做对比。</p>
  <p>帮助在复杂度与可维护性之间做选型。</p>`,
  17: `<p>合理利用 HTTP 缓存可显著减少重复请求、提升加载速度。本文详解强缓存与协商缓存的区别。</p>
  <p>以及 Cache-Control、ETag 等常用响应头的用法。</p>`,
  18: `<p>CSS Grid 提供二维布局能力，适合复杂页面结构。本文介绍网格定义、命名区域与响应式写法。</p>
  <p>并对比 Flexbox 与 Grid 的适用场景。</p>`,
  19: `<p>Monorepo 便于多包管理与复用。本文简要对比 pnpm workspace、Turborepo 与 Nx。</p>
  <p>从零搭建一个可用的 Monorepo 并配置构建与任务编排。</p>`,
  20: `<p>XSS 与 CSRF 是 Web 常见安全威胁。本文介绍攻击原理与防护手段。</p>
  <p>并说明前后端各自的责任：转义、CSP、SameSite 等。</p>`,
  21: `<p>Tailwind CSS 以原子类著称，能快速实现 UI 且保持一致性。本文分享使用心得与项目中的组织方式。</p>
  <p>以及何时值得引入、如何与设计系统结合。</p>`,
  22: `<p>服务端渲染与静态站点生成能改善首屏与 SEO。本文对比 SSR、SSG 与 CSR 的适用场景。</p>
  <p>并简要介绍 Next.js、Nuxt 等框架的选型考量。</p>`,
  23: `<p>监控与错误上报是保障线上质量的重要手段。本文介绍性能指标采集、前端异常捕获与日志上报。</p>
  <p>并给出接入 Sentry 等服务的简易方案。</p>`,
  24: `<p>API 设计影响前后端协作效率。本文讨论 RESTful 约定、版本号策略与向后兼容实践。</p>
  <p>以及文档与 Mock 的维护方式。</p>`,
  25: `<p>从设计稿到可用的前端页面，需要清晰的标注、切图与设计系统支持。本文总结协作流程与工具。</p>
  <p>提升设计与开发的对接效率。</p>`,
};

// 每页显示文章数默认值（首页可通过 URL 参数 size=10|20|50 覆盖）
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// 评论数据（按文章 id 存储，支持回复）
// 使用 localStorage 键 'blog_comments' 持久化，若无则用下面默认数据
const DEFAULT_COMMENTS = {
  1: [
    { id: 'c1-1', author: '路人甲', content: '讲得很清晰，期待后续系列。', time: '2025-03-15 16:00', replies: [
      { id: 'r1-1-1', author: '李明', content: '谢谢，会继续写。', time: '2025-03-15 16:30' },
    ]},
    { id: 'c1-2', author: '小白', content: '打包工具这块一直没搞懂，这篇有帮助。', time: '2025-03-16 09:20', replies: [] },
  ],
  2: [
    { id: 'c2-1', author: 'TS 爱好者', content: '类型体操写业务确实要克制，不然可读性会变差。', time: '2025-03-14 10:15', replies: [] },
  ],
};

function getStoredComments() {
  try {
    const raw = localStorage.getItem('blog_comments');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_COMMENTS));
}

function setStoredComments(data) {
  try {
    localStorage.setItem('blog_comments', JSON.stringify(data));
  } catch (_) {}
}

// 当前用户：优先从 localStorage 读取（登录/注册后写入，后端实现后可改为 token + 请求 /user/me）
var _currentUser = null;
var BLOG_USER_KEY = 'blog_user';

/* 首屏同步恢复，避免顶栏先「未登录」再闪成已登录（getCurrentUser 在 fetchUserInfo 完成前即可正确） */
try {
  var _blogUserRaw = localStorage.getItem(BLOG_USER_KEY);
  if (_blogUserRaw) _currentUser = JSON.parse(_blogUserRaw);
} catch (_hydrateErr) {}

function fetchUserInfo() {
  return new Promise(function (resolve) {
    try {
      var raw = localStorage.getItem(BLOG_USER_KEY);
      if (raw) {
        var user = JSON.parse(raw);
        _currentUser = user;
        resolve(user);
        return;
      }
    } catch (_) {}
    _currentUser = null;
    resolve(null);
  });
}

function getCurrentUser() {
  return _currentUser;
}

function setCurrentUser(user) {
  _currentUser = user;
  try {
    if (user) localStorage.setItem(BLOG_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(BLOG_USER_KEY);
  } catch (_) {}
}

function logout() {
  setCurrentUser(null);
}

// 用户发表的文章（localStorage 持久化，与默认数据合并展示）
function getStoredExtraArticles() {
  try {
    const raw = localStorage.getItem('blog_articles_extra');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {}
  return [];
}

function getStoredExtraBodies() {
  try {
    const raw = localStorage.getItem('blog_bodies_extra');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {}
  return {};
}

function getArticleList(q) {
  var extra = getStoredExtraArticles();
  var published = extra.filter(function (a) {
    return a.status !== 'draft';
  });
  var list = published.concat(BLOG_ARTICLES);
  return Promise.resolve(list);
}

/** 分页获取文章列表：返回 { articles, nextCursor }。mock 模式下基于 getArticleList 切片。 */
function getArticleListPage(q, cursor, pageSize) {
  return getArticleList(q).then(function (list) {
    var filtered = (list || []).filter(function (a) {
      if (!q) return true;
      var ql = q.toLowerCase();
      return (
        (a.title && a.title.toLowerCase().indexOf(ql) !== -1) ||
        (a.summary && a.summary.toLowerCase().indexOf(ql) !== -1) ||
        (a.author && a.author.name && a.author.name.toLowerCase().indexOf(ql) !== -1)
      );
    });
    var offset = cursor ? (parseInt(cursor, 10) || 0) : 0;
    var chunk = filtered.slice(offset, offset + (pageSize || 15));
    var nextCursor = offset + chunk.length < filtered.length ? String(offset + chunk.length) : '';
    return { articles: chunk, nextCursor: nextCursor };
  });
}

/** 推荐精选文章：mock 模式下取前 10 条；API 模式下由 /api/articles/featured 返回 */
function getFeaturedArticles() {
  var extra = getStoredExtraArticles();
  var published = extra.filter(function (a) { return a.status !== 'draft'; });
  var list = published.concat(BLOG_ARTICLES);
  return Promise.resolve(list.slice(0, 10));
}

/** 当前用户写的文章（仅 localStorage 中的 extra），含草稿与已发布 */
function getMyArticles() {
  var user = getCurrentUser();
  var nickname = user && user.nickname ? user.nickname : '';
  if (!nickname) return Promise.resolve([]);
  var list = getStoredExtraArticles().filter(function (a) {
    return a.author && a.author.name === nickname;
  }).map(function (a) {
    var vis = a.visibility != null ? Number(a.visibility) : 1;
    if (vis !== 2) vis = 1;
    return {
      id: a.id,
      title: a.title,
      summary: a.summary,
      author: a.author,
      publishedAt: a.publishedAt,
      cover: a.cover,
      status: a.status === 'draft' ? 'draft' : 'published',
      visibility: vis,
    };
  });
  return Promise.resolve(list);
}

function getExtraArticleById(id) {
  var list = getStoredExtraArticles();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return Promise.resolve(list[i]);
  }
  return Promise.resolve(null);
}

function getArticle(id) {
  var list = getStoredExtraArticles().concat(BLOG_ARTICLES);
  var article = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { article = list[i]; break; }
  }
  if (!article) return Promise.resolve(null);
  var bodies = getStoredExtraBodies();
  var bodyHtml = bodies[id] !== undefined ? bodies[id] : (ARTICLE_BODIES[id] || '<p>本文为示例文章，暂无更多正文。</p>');
  return Promise.resolve({
    article: article,
    bodyHtml: bodyHtml,
    engagement: { likeCount: 12, favoriteCount: 3, liked: false, favorited: false },
  });
}

/** mock：我的收藏（离线无接口时使用） */
function getMyFavoriteArticles(params) {
  params = params || {};
  return Promise.resolve({ articles: [], total: 0 });
}

function getComments(articleId) {
  var all = getStoredComments();
  var list = all[articleId] || [];
  return Promise.resolve(list);
}

function addComment(articleId, content) {
  var all = getStoredComments();
  if (!all[articleId]) all[articleId] = [];
  var user = getCurrentUser();
  var author = (user && user.nickname) ? user.nickname : '匿名';
  var now = new Date();
  var timeStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  var comment = { id: 'c' + articleId + '-' + Date.now(), author: author, content: content, time: timeStr, replies: [] };
  all[articleId].push(comment);
  setStoredComments(all);
  return Promise.resolve(comment);
}

function addReply(articleId, commentId, content, parentReplyId) {
  var all = getStoredComments();
  var list = all[articleId] || [];
  var user = getCurrentUser();
  var author = (user && user.nickname) ? user.nickname : '匿名';
  var now = new Date();
  var timeStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  var reply = { id: 'r' + commentId + '-' + Date.now(), author: author, content: content, time: timeStr, replies: [] };
  function findAndAppend(comments, cid, prid, r) {
    for (var j = 0; j < comments.length; j++) {
      if (comments[j].id === cid) {
        if (prid) {
          function findInReplies(replies, rid, nr) {
            if (!replies || !replies.length) return false;
            for (var k = 0; k < replies.length; k++) {
              if (replies[k].id === rid) { (replies[k].replies = replies[k].replies || []).push(nr); return true; }
              if (findInReplies(replies[k].replies, rid, nr)) return true;
            }
            return false;
          }
          findInReplies(comments[j].replies || [], prid, r);
        } else {
          (comments[j].replies = comments[j].replies || []).push(r);
        }
        return;
      }
    }
  }
  findAndAppend(list, commentId, parentReplyId, reply);
  setStoredComments(all);
  return Promise.resolve(reply);
}

function updateArticle(id, article, bodyHtml, status) {
  var list = getStoredExtraArticles();
  var bodies = getStoredExtraBodies();
  var idx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { idx = i; break; }
  }
  if (idx < 0) return Promise.resolve(false);
  if (article) {
    if (article.title !== undefined) list[idx].title = article.title;
    if (article.summary !== undefined) list[idx].summary = article.summary;
    if (article.cover !== undefined) list[idx].cover = article.cover;
    if (article.author !== undefined) list[idx].author = article.author;
    if (article.publishedAt !== undefined) list[idx].publishedAt = article.publishedAt;
  }
  if (status !== undefined) list[idx].status = status;
  if (article && article.visibility !== undefined) list[idx].visibility = article.visibility;
  if (bodyHtml !== undefined) bodies[id] = bodyHtml;
  try {
    localStorage.setItem('blog_articles_extra', JSON.stringify(list));
    localStorage.setItem('blog_bodies_extra', JSON.stringify(bodies));
  } catch (_) {}
  return Promise.resolve(true);
}

function setArticleVisibility(id, visibility) {
  return updateArticle(id, { visibility: visibility }, undefined, undefined);
}

function getArticleBody(id) {
  var bodies = getStoredExtraBodies();
  var html = bodies[id] !== undefined ? bodies[id] : (ARTICLE_BODIES[id] || '<p>本文为示例文章，暂无更多正文。</p>');
  return Promise.resolve(html);
}

function addArticle(article, bodyHtml, status) {
  var list = getStoredExtraArticles();
  var bodies = getStoredExtraBodies();
  var maxId = Math.max(
    0,
    Math.max.apply(null, BLOG_ARTICLES.map(function (a) { return a.id; })),
    list.length ? Math.max.apply(null, list.map(function (a) { return a.id; })) : 0
  );
  article.id = maxId + 1;
  article.status = status === 'draft' ? 'draft' : 'published';
  if (article.visibility == null) article.visibility = 1;
  list.unshift(article);
  bodies[article.id] = bodyHtml;
  try {
    localStorage.setItem('blog_articles_extra', JSON.stringify(list));
    localStorage.setItem('blog_bodies_extra', JSON.stringify(bodies));
  } catch (_) {}
  return Promise.resolve(article.id);
}

// 文章浏览次数（localStorage），用于热度榜
var VIEWS_KEY = 'blog_article_views';
var VIEWS_MAX = 5000;

function getStoredViews() {
  try {
    var raw = localStorage.getItem(VIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {}
  return [];
}

function setStoredViews(arr) {
  try {
    if (arr.length > VIEWS_MAX) arr = arr.slice(-VIEWS_MAX);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(arr));
  } catch (_) {}
}

function recordArticleView(articleId) {
  var list = getStoredViews();
  list.push({ articleId: articleId, ts: Date.now() });
  setStoredViews(list);
  return Promise.resolve();
}

/** 假数据：用于无浏览记录时展示热度榜，不写入 localStorage */
function getSeedViews() {
  var now = Date.now();
  var dayMs = 24 * 60 * 60 * 1000;
  var list = [];
  var i, j, ts;
  for (i = 1; i <= 10; i++) {
    for (j = 0; j <= 12 - i; j++) {
      ts = now - (j * 2 + (i % 3)) * dayMs - (i * 3600000);
      list.push({ articleId: i, ts: ts });
    }
  }
  for (i = 11; i <= 18; i++) {
    for (j = 0; j <= 20 - i; j++) {
      ts = now - j * dayMs - (i * 1800000);
      list.push({ articleId: i, ts: ts });
    }
  }
  return list;
}

/** type: 'total' | 'week' | 'day'，返回按浏览次数降序的 { id, views } 数组，最多 10 条 */
function getHotRanking(type) {
  var stored = getStoredViews();
  var list = stored.length ? stored : getSeedViews();
  var now = Date.now();
  var dayMs = 24 * 60 * 60 * 1000;
  var cutoff = type === 'total' ? 0 : type === 'week' ? now - 7 * dayMs : now - dayMs;
  var counts = {};
  for (var i = 0; i < list.length; i++) {
    if (list[i].ts < cutoff) continue;
    var id = list[i].articleId;
    counts[id] = (counts[id] || 0) + 1;
  }
  var entries = Object.keys(counts).map(function (id) {
    return { id: parseInt(id, 10), views: counts[id] };
  });
  entries.sort(function (a, b) { return b.views - a.views; });
  return Promise.resolve(entries.slice(0, 10));
}

/** 将接口返回的文章对象规范为列表卡片用字段（含点赞/收藏数） */
function mapArticleFromApi(a) {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    author: a.author,
    publishedAt: a.publishedAt || a.published_at,
    cover: a.cover,
    likeCount: Number(a.likeCount != null ? a.likeCount : a.like_count) || 0,
    favoriteCount: Number(a.favoriteCount != null ? a.favoriteCount : a.favorite_count) || 0,
  };
}

// ---------------------------------------------------------------------------
// 使用接口时：用 BlogAPI 替换上述实现，统一走 BLOG_API_BASE
// ---------------------------------------------------------------------------
(function () {
  if (typeof window === 'undefined' || !window.BlogAPI) return;
  var api = window.BlogAPI;

  fetchUserInfo = function () {
    return api.getUserMe()
      .then(function (d) {
        _currentUser = (d && d.user) ? d.user : null;
        try {
          if (_currentUser) localStorage.setItem(BLOG_USER_KEY, JSON.stringify(_currentUser));
          else localStorage.removeItem(BLOG_USER_KEY);
        } catch (_) {}
        return _currentUser;
      })
      .catch(function () {
        // 接口失败（如未鉴权、/user/me 未实现）时保留当前已登录状态，避免登录后 refreshHeader 被清空
        return _currentUser;
      });
  };

  logout = function () {
    api.logout().catch(function () {});
    if (api.setToken) api.setToken('');
    setCurrentUser(null);
  };

  getFeaturedArticles = function () {
    return api.getFeaturedArticles()
      .then(function (d) {
        return (d.articles || d.list || []).map(mapArticleFromApi);
      })
      .catch(function () { return []; });
  };

  getArticleList = function (q) {
    return api.getArticles({ q: q || '', page_size: 300 })
      .then(function (d) {
        return (d.articles || d.list || []).map(mapArticleFromApi);
      })
      .catch(function () { return []; });
  };

  /** 分页获取文章列表，供瀑布流下拉加载。返回 { articles, nextCursor } */
  getArticleListPage = function (q, cursor, pageSize) {
    return api.getArticles({ q: q || '', cursor: cursor || '', page_size: pageSize || 15 })
      .then(function (d) {
        var list = (d.articles || d.list || []).map(mapArticleFromApi);
        return { articles: list, nextCursor: d.next_cursor || d.nextCursor || '' };
      })
      .catch(function () { return { articles: [], nextCursor: '' }; });
  };

  getArticle = function (id) {
    return api.getArticle(id)
      .then(function (d) {
        var art = d.article;
        if (!art) return null;
        var eg = d.engagement || {};
        return {
          article: {
            id: art.id,
            title: art.title,
            summary: art.summary,
            author: art.author,
            publishedAt: art.publishedAt || art.published_at,
            cover: art.cover,
          },
          bodyHtml: d.bodyHtml != null ? d.bodyHtml : (d.body_html || ''),
          engagement: {
            likeCount: Number(eg.likeCount != null ? eg.likeCount : eg.like_count) || 0,
            favoriteCount: Number(eg.favoriteCount != null ? eg.favoriteCount : eg.favorite_count) || 0,
            liked: !!(eg.liked != null ? eg.liked : false),
            favorited: !!(eg.favorited != null ? eg.favorited : false),
          },
        };
      })
      .catch(function () { return null; });
  };

  getArticleBody = function (id) {
    return api.getArticle(id).then(function (d) { return (d.bodyHtml != null ? d.bodyHtml : d.body_html) || ''; }).catch(function () { return ''; });
  };

  getMyArticles = function () {
    return api.getMyArticles({ page: 1, page_size: 100 })
      .then(function (d) {
        var list = d.articles || d.list || [];
        return list.map(function (a) {
          var vis = a.visibility != null ? Number(a.visibility) : 1;
          if (vis !== 2) vis = 1;
          return {
            id: a.id,
            title: a.title,
            summary: a.summary,
            author: a.author,
            publishedAt: a.publishedAt || a.published_at,
            cover: a.cover,
            status: a.status === 'draft' || a.status === 1 ? 'draft' : 'published',
            visibility: vis,
          };
        });
      })
      .catch(function () { return []; });
  };

  getExtraArticleById = function (id) {
    return api.getArticle(id).then(function (d) {
      var art = d.article;
      if (!art) return null;
      return {
        id: art.id,
        title: art.title,
        summary: art.summary,
        author: art.author,
        publishedAt: art.publishedAt || art.published_at,
        cover: art.cover,
        status: art.status === 'draft' || art.status === 1 ? 'draft' : 'published',
      };
    }).catch(function () { return null; });
  };

  addArticle = function (article, bodyHtml, status) {
    var statusStr = status === 'draft' ? 'draft' : 'published';
    return api.createArticle({
      title: article.title,
      summary: article.summary,
      cover: article.cover || '📝',
      bodyHtml: bodyHtml,
      status: statusStr,
    }).then(function (d) { return d.id; });
  };

  updateArticle = function (id, article, bodyHtml, status) {
    var payload = { id: id };
    if (article && article.title != null) payload.title = article.title;
    if (article && article.summary != null) payload.summary = article.summary;
    if (article && article.cover != null) payload.cover = article.cover;
    if (article && article.publishedAt != null) payload.publishedAt = article.publishedAt;
    if (article && article.visibility != null) payload.visibility = article.visibility;
    if (bodyHtml != null) payload.bodyHtml = bodyHtml;
    if (status != null) payload.status = status;
    return api.updateArticle(id, payload).then(function () { return true; }).catch(function () { return false; });
  };

  /** 仅更新首页/推荐可见性：1 可见，2 隐藏 */
  setArticleVisibility = function (id, visibility) {
    return api.updateArticle(id, { visibility: visibility }).then(function () { return true; }).catch(function () { return false; });
  };

  getComments = function (articleId) {
    return api.getComments(articleId)
      .then(function (d) { return d.comments || d.list || []; })
      .catch(function () { return []; });
  };

  addComment = function (articleId, content) {
    return api.addComment(articleId, content).then(function (d) { return d.comment || d; });
  };

  addReply = function (articleId, commentId, content, parentReplyId) {
    return api.addReply(articleId, commentId, content, parentReplyId).then(function (d) { return d.reply || d; });
  };

  recordArticleView = function (articleId) {
    return api.recordView(articleId).catch(function () {});
  };

  getHotRanking = function (type) {
    return api.getHotRanking(type || 'total')
      .then(function (d) {
        var list = d.items || d.list || [];
        return list.map(function (x) {
          return {
            id: x.articleId || x.article_id || x.id,
            title: x.title || '',
            views: x.views || 0
          };
        });
      })
      .catch(function () { return []; });
  };

  getMyFavoriteArticles = function (params) {
    return api
      .getMyFavoriteArticles(params || {})
      .then(function (d) {
        var list = d.articles || d.list || [];
        return {
          total: d.total != null ? Number(d.total) : 0,
          articles: list.map(mapArticleFromApi),
        };
      })
      .catch(function () {
        return { total: 0, articles: [] };
      });
  };
})();
