import { createApp, onMounted } from '../../lib/vue3-design-and-imp.esm.js'

const MyComponent = {
  name: 'MyComponent',
  setup() {
    onMounted(() => {
      console.log('mounted 1')
    })

    onMounted(() => {
      console.log('mounted 2')
    })
  },
  render() {
    return {
      type: 'span',
      children: '123'
    }
  },
}

const CompVNode = {
  type: MyComponent,
}


createApp(CompVNode, document.querySelector('#app'))
