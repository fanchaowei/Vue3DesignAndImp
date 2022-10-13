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

  /**
   * 挂载 element
   * @param vnode
   * @param container
   */
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

  /**
   * 更新 element 对象
   * @param n1 旧 vnode
   * @param n2 新 vnode
   */
  function patchElement(n1: any, n2: any) {
    const el = (n2.el = n1.el)
    const oldProps = n1.props
    const newProps = n2.props

    //#region 更新 props

    for (const key in newProps) {
      // 查看新的 Props 属性与旧的 Props 属性是否不同
      if (newProps[key] !== oldProps[key]) {
        // 不同则需要更新 props
        patchProps(el, key, oldProps[key], newProps[key])
      }
    }

    for (const key in oldProps) {
      // 查看旧 Props 中的属性在新的 Props 内是否存在
      if (!(key in newProps)) {
        // 不存在说明新的 Props 已经删除了该属性，进行更新
        patchProps(el, key, oldProps[key], null)
      }
    }

    //#endregion

    // 更新 children
    patchChildren(n1, n2, el)
  }

  /**
   * 更新 children
   * @param n1 旧 vnode
   * @param n2 新 vnode
   * @param container 容器
   */
  function patchChildren(n1: any, n2: any, container: any) {
    // 判断新子节点是否是文本
    if (typeof n2.children === 'string') {
      // 判断旧子节点是否为数组，如果是数组，则逐个卸载
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c: any) => unmount(c))
      }
      // 设置文本
      setElementText(container, n2.children)
    }
    // 新子节点是数组的情况
    else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        // 新旧子节点都是数组，需要进行 diff 算法更新

        // 先用一种傻瓜式的方法先实现功能，将旧子节点全卸载，再全加载子节点
        n1.children.forEach((c: any) => unmount(c))
        n2.children.forEach((c: any) => patch(null, c, container))
      } else {
        // 这种情况，容器要么是文本要么不存在
        // 清空容器的子节点
        setElementText(container, '')
        // 将新 vnode 的子节点依次挂载
        n2.children.forEach((c: any) => patch(null, c, container))
      }
    }
    // 新子节点是空的情况
    else {
      // 卸载旧子节点即可
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c: any) => unmount(c))
      } else if (typeof n1.children === 'string') {
        setElementText(container, '')
      }
    }
  }

  return {
    render,
  }
}
