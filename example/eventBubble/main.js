import { createApp } from '../../lib/vue3-design-and-imp.esm.js'

const { effect, ref } = VueReactivity

const bol = ref(false)

effect(() => {
  // 创建 vnode
  const vnode = {
    type: 'div',
    props: bol.value
      ? {
          onClick: () => {
            alert('父元素 clicked')
          },
        }
      : {},
    children: [
      {
        type: 'p',
        props: {
          onClick: () => {
            bol.value = true
            console.log('子元素触发')
          },
        },
        children: 'text',
      },
    ],
  }
  // 渲染 vnode
  createApp(vnode, document.querySelector('#app'))
})
