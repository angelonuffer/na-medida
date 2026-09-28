import { mount } from 'svelte';
import App from './App.svelte';

const atualizarTemaSistema = () => {
  const preferenciaEscura = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = preferenciaEscura ? 'dark' : 'light';
};

atualizarTemaSistema();

const mediaPreferenciaCor = window.matchMedia('(prefers-color-scheme: dark)');
if (typeof mediaPreferenciaCor.addEventListener === 'function') {
  mediaPreferenciaCor.addEventListener('change', atualizarTemaSistema);
} else {
  mediaPreferenciaCor.addListener(atualizarTemaSistema);
}

mount(App, {
  target: document.getElementById('app')
});