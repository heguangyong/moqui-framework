<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import axios from 'axios'

const router = useRouter()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const userFullName = ref('')
const emailAddress = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function handleRegister() {
  if (!username.value || !password.value || !userFullName.value) {
    Notify.create({ type: 'warning', message: '请填写必填项' })
    return
  }
  
  if (password.value !== confirmPassword.value) {
    Notify.create({ type: 'warning', message: '两次输入的密码不一致' })
    return
  }
  
  // Moqui 密码要求：至少8位，包含大小写字母和数字
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  if (!passwordRegex.test(password.value)) {
    Notify.create({ type: 'warning', message: '密码至少8位，需包含大小写字母和数字' })
    return
  }
  
  loading.value = true
  try {
    await axios.post('/rest/s1/moqui/users', {
      username: username.value,
      newPassword: password.value,
      newPasswordVerify: confirmPassword.value,
      userFullName: userFullName.value,
      emailAddress: emailAddress.value
    })
    
    Notify.create({ type: 'positive', message: '注册成功，请登录' })
    router.push('/login')
  } catch (e: any) {
    const errMsg = e.response?.data?.errors || e.response?.data?.errorCode 
      ? '密码不符合要求，请使用更复杂的密码' 
      : '注册失败，请重试'
    Notify.create({ type: 'negative', message: errMsg })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-page class="flex flex-center">
    <q-card class="register-card">
      <q-card-section class="text-center">
        <h1 class="text-h5 q-mb-sm">注册 Babelio</h1>
        <p class="text-grey">加入高质量书评社区</p>
      </q-card-section>
      
      <q-card-section>
        <q-form @submit.prevent="handleRegister" class="q-gutter-md">
          <q-input
            v-model="userFullName"
            label="昵称 *"
            outlined
            :rules="[val => !!val || '请输入昵称']"
          >
            <template v-slot:prepend>
              <q-icon name="badge" />
            </template>
          </q-input>
          
          <q-input
            v-model="username"
            label="用户名 *"
            outlined
            :rules="[val => !!val || '请输入用户名']"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>
          
          <q-input
            v-model="emailAddress"
            label="邮箱"
            type="email"
            outlined
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>
          
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="密码 *"
            outlined
            :rules="[val => !!val || '请输入密码', val => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val) || '至少8位，含大小写字母和数字']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          
          <q-input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="确认密码 *"
            outlined
            :rules="[val => val === password || '密码不一致']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>
          
          <q-btn
            type="submit"
            color="primary"
            label="注册"
            class="full-width"
            size="lg"
            :loading="loading"
          />
          
          <div class="text-center q-mt-md">
            <span class="text-grey">已有账号？</span>
            <router-link to="/login" class="text-primary">立即登录</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style lang="scss" scoped>
.register-card {
  width: 100%;
  max-width: 400px;
  margin: 16px;
}
</style>
