import { createApp, Fragment, KeepAlive } from '../../../lib/vue3-design-and-imp.esm.js'

// keepAlive 组件
const keepAliveComp = {
  type: KeepAlive,
  children: {
    default() {
      return { type: 'h1', children: '这是 keepAlive 的插槽' }
    }
  }
}

createApp(keepAliveComp, document.querySelector('#app'))
