import { createApp } from '../../lib/vue3-design-and-imp.esm.js'

const vnode = {
  type: 'button',
  props: {
    disabled: '',
  },
  children: 'click.',
}

createApp(vnode, document.querySelector('#app'))
