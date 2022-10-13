import { createApp } from '../../lib/vue3-design-and-imp.esm.js'

const btnVnode = {
  type: 'button',
  props: {
    onClick: [
      // 事件一
      () => {
        console.log('触发事件')
        vnode = {
          type: 'div',
          children: [
            {
              type: 'p',
              children: '对...对吗？',
            },
            {
              type: 'div',
              children: '对的',
            },
          ],
        }
        createApp(vnode, document.querySelector('#app'))
      },
    ],
  },
  children: 'change.',
}

let vnode = {
  type: 'div',
  children: '未改变',
}

createApp(btnVnode, document.querySelector('#btn'))
createApp(vnode, document.querySelector('#app'))
