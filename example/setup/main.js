import { createApp, ref } from '../../lib/vue3-design-and-imp.esm.js'

// 第一种方式：作为组件的 render 函数
const MyComponent = {
  name: 'MyComponent',
  setup() {
    // 作为函数返回，则为组件的渲染函数
    return () => {
      return { type: 'div', children: 'hello' }
    }
  },
}

// 第二种方式
const Comp = {
  // 对象的数据会暴露在渲染函数中
  setup() {
    const count = ref(0)
    return {
      count,
    }
  },
  render() {
    // 通过 this key访问 setup 暴露出来的响应式数据
    return { type: 'div', children: `count is: ${this.count}` }
  },
}

// 组件的虚拟节点
const CompVNode = {
  // type: MyComponent,
  type: Comp,
}

createApp(CompVNode, document.querySelector('#app'))
