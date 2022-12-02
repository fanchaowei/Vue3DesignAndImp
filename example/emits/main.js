import { createApp, ref } from '../../lib/vue3-design-and-imp.esm.js'

const MyComponent = {
  name: 'MyComponent',
  setup(props, { emit }) {
    function onClick() {
      console.log('触发事件')
      // 发射 change 事件，并传递给事件处理函数两个参数
      emit('change', 1, 2)
    }
    return {
      onClick,
    }
  },
  render() {
    return {
      type: 'button',
      props: {
        onClick: this.onClick,
      },
      children: `click it`,
    }
  },
}

// 组件的虚拟节点
const CompVNode = {
  type: MyComponent,
  props: {
    onChange: handler, // emit 的自定义事件
  },
}
function handler(num1, num2) {
  console.log(`接收到：${num1},${num2}`)
}

createApp(CompVNode, document.querySelector('#app'))
