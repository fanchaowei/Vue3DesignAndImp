import { createApp } from '../../lib/vue3-design-and-imp.esm.js'

const vnode = {
  type: 'button',
  props: {
    onClick: [
      // 事件一
      () => {
        alert('clicked 1')
      },
      // 事件二
      () => {
        alert('clicked 2')
      },
    ],
  },
  children: 'click.',
}

createApp(vnode, document.querySelector('#app'))
