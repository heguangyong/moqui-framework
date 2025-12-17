import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import router from './router'
import App from './App.vue'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'

// Import custom styles
import './styles/main.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
  config: {
    brand: {
      primary: '#1976d2',
      secondary: '#26a69a',
      accent: '#9c27b0',
      dark: '#1d1d1d',
      positive: '#21ba45',
      negative: '#c10015',
      info: '#31ccec',
      warning: '#f2c037'
    }
  }
})

app.mount('#app')