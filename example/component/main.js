import { createApp } from '../../lib/vue3-design-and-imp.esm.js'

// 最基础的组件
// const MyComponent = {
//   name: 'MyComponent',
//   render() {
//     // 返回虚拟 DOM
//     return {
//       type: 'div',
//       children: `我是文本内容`,
//     }
//   },
// }

// 自身带状态的组件
const MyComponent = {
  name: 'MyComponent',
  // 用 data 来模拟自身状态
  data() {
    return {
      foo: 'hello world',
    }
  },
  render() {
    return {
      type: 'div',
      children: `foo 的值是：${this.foo}`,
    }
  },
}

// 组件的虚拟节点
const CompVNode = {
  type: MyComponent,
}

createApp(CompVNode, document.querySelector('#app'))
