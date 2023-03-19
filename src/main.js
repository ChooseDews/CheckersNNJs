import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

//import picoCSS from 'picocss'
import '@picocss/pico/scss/pico.scss'
import './assets/main.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
