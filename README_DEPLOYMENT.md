# 部署配置说明

## 构建命令说明

### 开发环境构建
```bash
npm run build:dev
```
- 使用 `.env.dev` 配置
- API请求地址：`http://47.98.242.169:8010`
- 适用于开发测试

### 生产环境构建（动态部署）
```bash
npm run build:deploy
```
- 使用 `.env.prod` 配置
- 静态资源使用相对路径：`./`
- API请求使用相对路径，根据部署位置自动确定

## 部署示例

### 部署到 https://khtai.suhzy.com/lable

1. 运行构建命令：
```bash
npm run build:deploy
```

2. 将 `dist` 目录下的文件上传到服务器的 `/lable` 目录

3. 访问效果：
- **网站访问地址**：`https://khtai.suhzy.com/lable/`
- **静态资源路径**：`https://khtai.suhzy.com/lable/js/chunk-vendors.js`
- **API请求路径**：`https://khtai.suhzy.com/lable/htai/prescribe/photo`

### 部署到其他路径

如果部署到 `https://example.com/medical/app/`：
- **网站访问地址**：`https://example.com/medical/app/`
- **静态资源路径**：`https://example.com/medical/app/js/chunk-vendors.js`
- **API请求路径**：`https://example.com/medical/app/htai/prescribe/photo`

## 配置文件说明

### .env.dev（开发环境）
- `VUE_APP_USE_RELATIVE_API=false`：使用绝对路径API
- `VUE_APP_API_BASE_URL='http://47.98.242.169:8010'`：固定API地址

### .env.prod（生产环境）
- `VUE_APP_USE_RELATIVE_API=true`：使用相对路径API
- `VUE_APP_API_BASE_URL=''`：空值，由代码动态计算

## 技术实现

1. **静态资源路径**：通过 `vue.config.js` 中的 `publicPath: './'` 实现相对路径
2. **API路径动态计算**：在 `src/utils/request.js` 中根据当前页面路径动态计算API基础路径
3. **环境区分**：通过环境变量 `VUE_APP_USE_RELATIVE_API` 控制是否使用相对路径API