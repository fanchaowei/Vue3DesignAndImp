import { createRenderer } from '../../lib/vue3-design-and-imp.esm.js'

const vnode = {
  type: 'h1',
  children: 'hello',
}
const parent = {
  type: 'root',
}

// const renderer = createRenderer()
// renderer.render(vnode, document.querySelector('#app'))

const renderer = createRenderer({
  // 创建元素
  createElement(type) {
    console.log(`创建元素${type}`)
    // 可以看到创建元素返回的不是特定的 api ，而是抽象成一个可配置的对象
    // 可以通过这个对象，在最后根据平台的不同调用不同的 api 进行渲染，做到多平台渲染
    return { type }
  },
  setElementText(el, text) {
    console.log(`设置 ${JSON.stringify(el)} 的文本内容：${text}`)
    el.textContent = text
  },
  insert(el, parent) {
    console.log(`将 ${JSON.stringify(el)} 添加到 ${JSON.stringify(parent)}`)
    parent.children = el
  },
})
renderer.render(vnode, parent)
