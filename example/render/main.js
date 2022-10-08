import { createRenderer } from '../../lib/vue3-design-and-imp.esm.js'

const vnode = {
  type: 'h1',
  children: 'hello',
}

const renderer = createRenderer()
renderer.render(vnode, document.querySelector('#app'))
