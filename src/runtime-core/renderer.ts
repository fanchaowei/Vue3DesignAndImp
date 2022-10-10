/**
 * 创建渲染器
 * @param options 包含的扩展配置,可以直接通过该参数去自定义配置，以达成不同的环境的需求。
 */
export function createRenderer(options: any) {
  // 将传入的自定义方法取出
  const { createElement, insert, setElementText } = options

  /**
   * 渲染 DOM 节点
   * @param vnode 虚拟节点
   * @param container 容器
   */
  function render(vnode: any, container: any) {
    if (vnode) {
      // 如果存在 vnode ，则将旧的 vnode 也传入进行更新
      patch(container._vnode, vnode, container)
    } else {
      // 如果存在旧的不存在新的，说明是卸载
      if (container._vnode) {
        container.innerHtml = ''
      }
    }
    // 将当前传入的 vnode 复制给 _vnode，作为下次的旧 vnode
    container._vnode = vnode
  }
  /**
   * 渲染器的核心入口
   * @param n1 旧 vnode
   * @param n2 新 vnode
   * @param container 容器
   */
  function patch(n1: any, n2: any, container: any) {
    if (!n1) {
      // 不存在旧 vnode ，挂载操作
      mountElement(n2, container)
    } else {
      // 存在旧 vnode ，更新打补丁
    }
  }

  // 挂载 element
  function mountElement(vnode: any, container: any) {
    // 创建 element 对象
    const el = createElement(vnode.type)
    if (typeof vnode.children === 'string') {
      // 如果 children 类型是 string ，说明是文字
      setElementText(el, vnode.children)
    }
    // 将元素添加到容器中
    insert(el, container)
  }

  return {
    render,
  }
}
