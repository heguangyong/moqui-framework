<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Notify } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    Notify.create({ type: 'warning', message: '请输入用户名和密码' })
    return
  }
  
  const result = await authStore.login(username.value, password.value)
  if (result.success) {
    Notify.create({ type: 'positive', message: '登录成功' })
    router.push('/')
  } else {
    Notify.create({ type: 'negative', message: result.message })
  }
}
</script>

<template>
  <q-page class="flex flex-center">
    <q-card class="login-card">
      <q-card-section class="text-center">
        <h1 class="text-h5 q-mb-sm">Babelio</h1>
        <p class="text-grey">高质量书评与理性讨论社区</p>
      </q-card-section>
      
      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            v-model="username"
            label="用户名"
            outlined
            :rules="[val => !!val || '请输入用户名']"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>
          
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="密码"
            outlined
            :rules="[val => !!val || '请输入密码']"
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
          
          <q-btn
            type="submit"
            color="primary"
            label="登录"
            class="full-width"
            size="lg"
            :loading="authStore.loading"
          />
          
          <div class="text-center q-mt-md">
            <span class="text-grey">没有账号？</span>
            <router-link to="/register" class="text-primary">立即注册</router-link>
          </div>
          
          <div class="text-center text-grey text-caption q-mt-sm">
            默认账号: john.doe / moqui
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style lang="scss" scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  margin: 16px;
}
</style>
