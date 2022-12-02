import { createApp, Fragment } from '../../lib/vue3-design-and-imp.esm.js'

// 有插槽的子组件
const MyComponent = {
  name: 'MyComponent',
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

createApp(fatherComp, document.querySelector('#app'))
