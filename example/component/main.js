import { createApp } from '../../lib/vue3-design-and-imp.esm.js'

const MyComponent = {
  name: 'MyComponent',
  render() {
    // 返回虚拟 DOM
    return {
      type: 'div',
      children: `我是文本内容`,
    }
  },
}
const CompVNode = {
  type: MyComponent,
}

createApp(CompVNode, document.querySelector('#app'))
