import { createApp } from 'vue';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createPinia } from 'pinia';

import App from '@/App.vue';
import { i18n } from '@/i18n';
import { router } from '@/router';
import '@/style.css';

library.add(fab, far, fas);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);
app.mount('#app');
