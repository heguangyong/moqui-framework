import './assets/main.css'

// Quasar Framework
import { Quasar } from 'quasar'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// Import Shanghai Port Theme
import './styles/shanghai-port-theme.scss'

// Configure Quasar with Shanghai Port Design System
app.use(Quasar, {
  plugins: {
    // Notify, Dialog, Loading, etc.
  },
  config: {
    brand: {
      primary: '#0A1F6C',      // 科技蓝
      secondary: '#FF4F1E',    // 行动橙
      accent: '#FF4F1E',       // 行动橙
      dark: '#1A1A1A',         // 标题色
      positive: '#00B365',     // 成功绿
      negative: '#FF3D71',     // 错误红
      info: '#1890FF',         // 信息蓝
      warning: '#FFB300'       // 警告黄
    }
  }
})

app.use(createPinia())
app.use(router)

app.mount('#app')
