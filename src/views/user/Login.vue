<template>
  <div class="main">
    <a-form
      id="formLogin"
      class="user-layout-login"
      ref="formLogin"
      :form="form"
      @submit="handleSubmit"
    >
      <h1>登录</h1>

      <a-alert v-if="isLoginError" type="error" showIcon style="margin-bottom: 24px;" :message="$t('user.login.message-invalid-credentials')" />

      <a-form-item>
        <a-input
          size="large"
          type="text"
          :placeholder="'账号'"
          v-decorator="[
            'mobile',
            { initialValue: 'admin'},
            // {rules: [{ required: true, pattern: /^1[34578]\d{9}$/, message: '请输入正确的手机号' }], validateTrigger: 'change', initialValue: '18037470971'}

          ]"
        >
          <a-icon slot="prefix" type="mobile" :style="{ color: 'rgba(0,0,0,.25)' }"/>
        </a-input>
      </a-form-item>

      <a-form-item>
        <a-input-password
          size="large"
          :placeholder="'密码'"
          v-decorator="[
            'password',
            {rules: [{ required: true, message: '请输入密码' }], validateTrigger: 'blur', initialValue: '1111'},
            // {rules: [{ required: true, message: '请输入密码' }], validateTrigger: 'blur', initialValue: '123456'}
          ]"
        >
          <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-checkbox v-decorator="['rememberMe', { valuePropName: 'checked' }]">记住密码</a-checkbox>
      </a-form-item>

      <a-form-item style="margin-top:24px">
        <a-button
          size="large"
          type="primary"
          htmlType="submit"
          class="login-button"
          :loading="state.loginBtn"
          :disabled="state.loginBtn"
        >登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
// import md5 from 'md5'
import { mapActions } from 'vuex'
import { login } from '@/api/annotation'

export default {
  data () {
    return {
      loginBtn: false,
      isLoginError: false,
      form: this.$form.createForm(this),
      state: {
        loginBtn: false
      }
    }
  },
  methods: {
    ...mapActions(['Logout']),
    handleSubmit (e) {
      e.preventDefault()
      const {
        form: { validateFields },
        state
      } = this

      state.loginBtn = true

      validateFields(['mobile', 'password'], { force: true }, (err, values) => {
        if (!err) {
          console.log('login form', values)
          const loginParams = { ...values }
          // loginParams.password = md5(values.password)

          login(loginParams)
            .then((res) => {
              if (res.code === 0) {
                this.loginSuccess(res)
              } else {
                this.requestFailed(new Error(res.message || '登录失败'))
              }
            })
            .catch(err => this.requestFailed(err))
            .finally(() => {
              state.loginBtn = false
            })
        } else {
          setTimeout(() => {
            state.loginBtn = false
          }, 600)
        }
      })
    },
    loginSuccess (res) {
      console.log(res)
      if (res.data && res.data.accessToken) {
        // 和药铺接口返回的是accessToken，需要添加Bearer前缀
        const token = `Bearer ${res.data.accessToken}`
        localStorage.setItem('Access-Token', token)
      }
      this.$router.push({ path: '/' })
      setTimeout(() => {
        this.$notification.success({
          message: '欢迎',
          description: `欢迎回来`
        })
      }, 1000)
      this.isLoginError = false
    },
    requestFailed (err) {
      this.isLoginError = true
      this.$notification['error']({
        message: '错误',
        description: ((err.response || {}).data || {}).message || '请求出现错误，请稍后再试',
        duration: 4
      })
    }
  }
}
</script>

<style lang="less" scoped>
.main {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}

.user-layout-login {
  padding: 32px 24px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 380px;

  h1 {
    text-align: center;
    margin-bottom: 24px;
    color: rgba(0, 0, 0, 0.85);
  }

  label {
    font-size: 14px;
  }

  button.login-button {
    padding: 0 15px;
    font-size: 16px;
    height: 40px;
    width: 100%;
  }

  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input-affix-wrapper {
    .ant-input {
      min-height: 40px;
    }
  }
}
</style>
@/api/annotation
