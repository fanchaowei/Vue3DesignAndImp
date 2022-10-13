import { createApp, Fragment } from '../../lib/vue3-design-and-imp.esm.js'

let vnode = {
  type: 'ul',
  children: [
    {
      type: Fragment,
      children: [
        { type: 'li', children: '1' },
        { type: 'li', children: '2' },
        { type: 'li', children: '3' },
      ],
    },
  ],
}

createApp(vnode, document.querySelector('#app'))
