import axios from 'axios'
import store from '@/store'
import storage from 'store'
import notification from 'ant-design-vue/es/notification'
import { VueAxios } from './axios'
import { ACCESS_TOKEN } from '@/store/mutation-types'

// 创建 axios 实例
const request = axios.create({
  // API 请求的默认前缀
  // 开发环境使用空字符串以便代理生效，生产环境使用完整URL
  baseURL: process.env.NODE_ENV === 'development' ? '' : process.env.VUE_APP_API_BASE_URL,
  timeout: 15000 // 请求超时时间
})

// 异常拦截处理器
const errorHandler = (error) => {
  if (error.response) {
    const data = error.response.data
    // 从 localstorage 获取 token
    const token = storage.get(ACCESS_TOKEN)
    if (error.response.status === 403) {
      notification.error({
        message: 'Forbidden',
        description: data.message
      })
    }
    if (error.response.status === 401 && !(data.result && data.result.isLogin)) {
      notification.error({
        message: 'Unauthorized',
        description: 'Authorization verification failed'
      })
      if (token) {
        store.dispatch('Logout').then(() => {
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        })
      }
    }
  }
  return Promise.reject(error)
}

// 请求拦截器
request.interceptors.request.use(config => {
  // 登录接口不需要验证token
  if (config.url.includes('/token/login')) {
    return config
  }

  const token = localStorage.getItem('Access-Token')
  if (token) {
    // 和药铺接口使用access_token作为请求头
    const accessToken = token.replace('Bearer ', '')
    config.headers['access_token'] = accessToken
    // 同时保留Authorization头以兼容其他接口
    config.headers['Authorization'] = token

    // 添加跨域请求头
    config.headers['Access-Control-Allow-Origin'] = '*'
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    config.headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, access_token'
  } else {
    // 如果没有token，提示登录超时
    notification.error({
      message: '登录超时',
      description: '请重新登录'
    })
    // 1秒后跳转到登录页
    setTimeout(() => {
      window.location.href = '/user/login'
    }, 1000)
  }
  return config
}, errorHandler)

// response interceptor
request.interceptors.response.use((response) => {
  const res = response.data
  // 检查响应是否包含错误码401或和药铺接口的认证错误码
  if (res.code === 401 || res.errcode === 400 || res.errcode === 401 || res.errcode === 404) {
    // 显示接口返回的错误消息
    notification.error({
      message: '登录提示',
      description: res.msg || res.errmsg || '账号未登录或token已过期'
    })

    // 清除token
    storage.remove(ACCESS_TOKEN)
    localStorage.removeItem('Access-Token')

    // 1秒后跳转到登录页
    setTimeout(() => {
      window.location.href = '/user/login'
    }, 1000)

    return Promise.reject(new Error(res.msg || res.errmsg || '账号未登录'))
  }

  return res
}, errorHandler)

const installer = {
  vm: {},
  install (Vue) {
    Vue.use(VueAxios, request)
  }
}

export default request

export {
  installer as VueAxios,
  request as axios
}
