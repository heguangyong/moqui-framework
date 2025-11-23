<template>
  <q-page class="login-page column items-center justify-center">
    <div class="login-container">
      <q-card class="login-card">
        <q-card-section class="text-center">
          <q-icon name="psychology" size="64px" color="primary" class="q-mb-md"/>
          <div class="text-h4">Moqui AI Mobile</div>
          <div class="text-subtitle1 text-grey-6">AI驱动的企业移动应用</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleLogin">
            <q-input
              v-model="credentials.username"
              label="用户名"
              outlined
              :rules="[val => !!val || '请输入用户名']"
              class="q-mb-md">
              <template v-slot:prepend>
                <q-icon name="person"/>
              </template>
            </q-input>

            <q-input
              v-model="credentials.password"
              label="密码"
              type="password"
              outlined
              :rules="[val => !!val || '请输入密码']"
              class="q-mb-md">
              <template v-slot:prepend>
                <q-icon name="lock"/>
              </template>
            </q-input>

            <q-btn
              type="submit"
              label="登录"
              color="primary"
              class="full-width q-mb-md"
              :loading="authStore.isLoading"
              size="lg"/>
          </q-form>
        </q-card-section>

        <q-card-section class="text-center">
          <div class="text-caption text-grey-6">
            演示账号: john.doe / moqui
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/modules/auth'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const authStore = useAuthStore()

const credentials = ref({
  username: 'john.doe',
  password: 'moqui'
})

const handleLogin = async () => {
  const result = await authStore.login(credentials.value)

  if (result.success) {
    $q.notify({
      type: 'positive',
      message: '登录成功'
    })

    // 重定向到原来要访问的页面或首页
    const redirectPath = route.query.redirect as string || '/'
    router.push(redirectPath)
  } else {
    $q.notify({
      type: 'negative',
      message: result.error || '登录失败'
    })
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-card {
  border-radius: 16px;
}
</style>