import './styles/main.scss'

// Quasar Framework
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Configure Quasar with Babelio Design System
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading
  },
  config: {
    brand: {
      primary: '#2C3E50',      // 深灰蓝 - 理性沉稳
      secondary: '#8B4513',    // 书卷棕 - 文学气质
      accent: '#D4A574',       // 暖金色 - 精选标记
      dark: '#1A1A1A',         // 标题色
      positive: '#27AE60',     // 成功绿
      negative: '#E74C3C',     // 错误红
      info: '#3498DB',         // 信息蓝
      warning: '#F39C12'       // 警告黄
    },
    notify: {
      position: 'top',
      timeout: 2500
    }
  }
})

app.use(createPinia())
app.use(router)

app.mount('#app')
