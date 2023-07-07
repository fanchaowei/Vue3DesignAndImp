import { createApp, Fragment } from '../../lib/vue3-design-and-imp.esm.js'

// 有插槽的子组件
const MyComponent = {
  name: 'ChildComponent',
  setup() {},
  render() {
    return {
      type: Fragment,
      children: [
        {
          type: 'header',
          children: [this.$slots.header()],
        },
        {
          type: 'div',
          children: [this.$slots.body()],
        },
        {
          type: 'footer',
          children: [this.$slots.footer()],
        },
      ],
    }
  },
}

// 父组件
const fatherComp = {
  name: 'FatherComponent',
  setup() {},
  render() {
    // 返回子节点的虚拟节点
    return {
      type: MyComponent,
      children: {
        header() {
          return { type: 'h1', children: '我是标题' }
        },
        body() {
          return { type: 'section', children: '我是内容' }
        },
        footer() {
          return { type: 'p', children: '我是注脚' }
        },
      },
    }
  },
}

// 父组件的虚拟节点
const fatherVNode = {
  type: fatherComp,
}

createApp(fatherVNode, document.querySelector('#app'))
