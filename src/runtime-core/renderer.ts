/**
 * 创建渲染器
 * @param options 包含的扩展配置,可以直接通过该参数去自定义配置，以达成不同的环境的需求。
 */
export function createRenderer(options: any) {
  // 将传入的自定义方法取出
  const { createElement, insert, setElementText, patchProps, unmount } = options

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
        // 卸载元素
        unmount(container._vnode)
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
    // 先判断 n1 和 n2 是否一致，如果不一致则将 n1 先卸载
    if (n1 && n1.type !== n2.type) {
      unmount(n1)
      n1 = null
    }
    // 走到这里，n1 和 n2 类型一致
    const { type } = n2
    if (typeof type === 'string') {
      // string 说明是文本类型
      if (!n1) {
        // 不存在旧 vnode ，挂载操作
        mountElement(n2, container)
      } else {
        // 存在旧 vnode ，更新打补丁
        patchElement(n1, n2)
      }
    } else if (typeof type === 'object') {
      // 如果是对象类型，则是组件
    }
  }

  // 挂载 element
  function mountElement(vnode: any, container: any) {
    // 创建 element 对象,并将其与 vnode.el 关联
    const el = (vnode.el = createElement(vnode.type))

    // 处理 children
    if (typeof vnode.children === 'string') {
      // 如果 children 类型是 string ，说明是文字
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 如果 children 是数组，则进行循环把每个子节点都进行挂载
      vnode.children.forEach((child: any) => {
        patch(null, child, el)
      })
    }

    // 处理 props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }

    // 将元素添加到容器中
    insert(el, container)
  }

  function patchElement(n1: any, n2: any) {
    // Implement
  }

  return {
    render,
  }
}
