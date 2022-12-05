import { createRenderer, Fragment } from '../runtime-core'

// 创建 DOM 元素
function createElement(tag: any) {
  return document.createElement(tag)
}
// 输入文本
function setElementText(el: any, text: any) {
  el.textContent = text
}
// 添加元素到父级元素
function insert(el: any, parent: any, auchor = null) {
  // 将 el 添加到 anthor 之前，倘若为 null ，则默认添加到最后，和 append() 一样。
  // 倘若给定的子节点是当前已存在的节点，则会将这个节点移动到锚点之前
  parent.insertBefore(el, auchor)
}
// 卸载元素
function unmount(vnode: any) {
  if (vnode.type === Fragment) {
    // Fragment 类型需要先依次卸载每个子节点
    vnode.children.forEach((c: any) => {
      unmount(c)
    })
    return
  } else if(typeof vnode.type === 'object') {
    // 对于组件，则是卸载组件所渲染的内容，即 subTree
    unmount(vnode.component.subTree)
    return
  }
  // 获取元素的父级
  const parent = vnode.el.parentNode
  if (parent) {
    // 卸载元素
    parent.removeChild(vnode.el)
  }
}
// 创建文本节点
function createText(text: string) {
  return document.createTextNode(text)
}
// 设置文本节点的内容
function setText(el: any, text: string) {
  el.nodeValue = text
}

// 处理元素 Attributes
function patchProps(el: any, key: any, prevValue: any, nextValue: any) {
  if (/^on/.test(key)) {
    // 判断是否是事件
    // 将 key 进行转化，如：onClick -> click
    const name = key.slice(2).toLowerCase()
    // 获取伪造事件集
    let invokers = el._vei || (el._vei = {})
    // 通过名称获取对应的伪造事件处理函数 invoker
    let invoker = invokers[name]
    // 判断是否存在新的事件
    if (nextValue) {
      if (!invoker) {
        // 如果不存在 invoker 则创建一个
        invoker = el._vei = (e: any) => {
          // e.timeStamp 是事件触发的时间
          // 如果事件发生的事件遭遇事件处理函数绑的时间，则不执行事件处理函数
          if (e.timeStamp < invoker.attached) return
          // invoker 内实际是调用 invoker.value
          // 而我们把 nextValue 就存在 invoker.value 中
          if (Array.isArray(invoker.value)) {
            // 如果是一个数组，说明一个事件绑定了多个方法，依次循环执行
            invoker.value.forEach((fn: any) => fn(e))
          } else {
            invoker.value(e)
          }
        }
        // 将事件存在 .value 中
        invoker.value = nextValue
        // .attached 储存事件处理函数被绑定的时间
        invoker.attached = performance.now()
        // 将该伪造事件添加为事件
        el.addEventListener(name, invoker)
      } else {
        // 如果存在，则更新 .value 的值即可
        invoker.value = nextValue
      }
    } else {
      // 如果不存在 nextValue ，说明已经不存在该方法了，则解除事件的绑定
      el.removeEventListener(name, invoker)
    }
  } else if (key === 'class') {
    // 如果是 class 则直接赋值
    el.className = nextValue || ''
  }
  // 判断是否需要设置 DOM Properties 的值
  else if (shouldSetAsProps(el, key, nextValue)) {
    // 获取该 DOM Properties 的类型
    const type = typeof el[key]
    // 如果是布尔类型，并且 value 是空字符串，则将值矫正为 true
    // 这是为了处理类似 button 的 disabled 等的属性的。这些属性无需设置值，只要存在该属性就需要为 true
    if (type === 'boolean' && nextValue === '') {
      el[key] = true
    } else {
      el[key] = false
    }
  } else {
    // 如果不存在对应的 DOM Properties 类型，则直接设置属性。
    el.setAttribute(key, nextValue)
  }
}

// 是否为 DOM Properties 设置值
function shouldSetAsProps(el: any, key: any, value: any) {
  // 因为 form 属性是只读，虽然 DOM Properties 上存在，但是还是只能通过 setAttribute 设置，所以需要特殊处理
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}

const renderer = createRenderer({
  createElement,
  setElementText,
  insert,
  patchProps,
  unmount,
  createText,
  setText,
})

// 将设置好自定义方法配置的 renderer 实例封装，以提供给用户使用。
export function createApp(el: any, container: any) {
  renderer.render(el, container)
}

//因为 runtime-dom 是 runtime-core 的外层
//所以 runtime-core 在这里导出就好，打包的入口改为导出该 index.ts
export * from '../runtime-core'
