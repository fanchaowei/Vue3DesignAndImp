// 文本节点的 vnode.type 标识
export const Text = Symbol()
// 注释节点的 vnode.type 标识
export const Comment = Symbol()
// Fragment 的标识
export const Fragment = Symbol()

/**
 * 创建渲染器
 * @param options 包含的扩展配置,可以直接通过该参数去自定义配置，以达成不同的环境的需求。
 */
export function createRenderer(options: any) {
  // 将传入的自定义方法取出
  const {
    createElement,
    insert,
    setElementText,
    patchProps,
    unmount,
    createText,
    setText,
  } = options

  /**
   * 渲染 DOM 节点
   * @param vnode 虚拟节点
   * @param container 容器
   */
  function render(vnode: any, container: any) {
    if (vnode) {
      // 如果存在 vnode ，则将旧的 vnode 也传入进行更新
      patch(container._vnode, vnode, container, null)
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
  function patch(n1: any, n2: any, container: any, anchor: any) {
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
        mountElement(n2, container, anchor)
      } else {
        // 存在旧 vnode ，更新打补丁
        patchElement(n1, n2)
      }
    } else if (typeof type === 'object') {
      // 如果是对象类型，则是组件
    } else if (type === Text) {
      // 文本节点
      if (!n1) {
        // 创建文本节点
        const el = (n2.el = createText(n2.children))
        insert(el, container)
      } else {
        const el = (n2.el = n1.el)
        if (n2.children !== n1.children) {
          // 替换文本
          setText(el, n2.children)
        }
      }
    }
    // 判断是否未 Fragment 节点
    else if (type === Fragment) {
      if (!n1) {
        n2.children.forEach((c: any) => patch(null, c, container, null))
      } else {
        // 如果有旧 vnode ，则更新 children
        patchChildren(n1, n2, container)
      }
    }
  }

  /**
   * 挂载 element
   * @param vnode
   * @param container
   */
  function mountElement(vnode: any, container: any, anchor: any) {
    // 创建 element 对象,并将其与 vnode.el 关联
    const el = (vnode.el = createElement(vnode.type))

    // 处理 children
    if (typeof vnode.children === 'string') {
      // 如果 children 类型是 string ，说明是文字
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 如果 children 是数组，则进行循环把每个子节点都进行挂载
      vnode.children.forEach((child: any) => {
        patch(null, child, el, null)
      })
    }

    // 处理 props
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key])
      }
    }

    // 将元素添加到容器中
    insert(el, container, anchor)
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
        // patchArrayChildren(n1, n2, container)
        patchKeyedChildren(n1, n2, container)
      } else {
        // 这种情况，容器要么是文本要么不存在
        // 清空容器的子节点
        setElementText(container, '')
        // 将新 vnode 的子节点依次挂载
        n2.children.forEach((c: any) => patch(null, c, container, null))
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

  /**
   * 双端 diff 算法
   * @param n1
   * @param n2
   * @param container
   */
  function patchKeyedChildren(n1: any, n2: any, container: any) {
    const oldChildren = n1.children
    const newChildren = n2.children

    let oldStartIdx = 0
    let oldEndIdx = oldChildren.length - 1
    let newStartIdx = 0
    let newEndIdx = newChildren.length - 1

    let oldStartVNode = oldChildren[oldStartIdx]
    let oldEndVNode = oldChildren[oldEndIdx]
    let newStartVNode = newChildren[newStartIdx]
    let newEndVNode = newChildren[newEndIdx]

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVNode) {
        // 不存在则跳过
        oldStartVNode = oldChildren[++oldStartIdx]
      } else if (!oldEndVNode) {
        // 不存在则跳过
        oldEndVNode = oldChildren[--oldEndIdx]
      } else if (oldStartVNode.key === newStartVNode.key) {
        // oldStartIdx 和 newStartIdx 比较

        patch(oldStartVNode, newStartVNode, container, null)

        oldStartVNode = oldChildren[++oldStartIdx]
        newStartVNode = newChildren[++newStartIdx]
      } else if (oldEndVNode.key === newStartVNode.key) {
        // oldEndIdx 和 newStartIdx 比较

        // 更新节点
        patch(oldEndVNode, newStartVNode, container, null)
        // 将 oldEndVNode 移动到 oldStartVNode 前面
        // why？ 因为 newStartVNode 的位置对应就是 oldStartVNode
        insert(oldEndVNode.el, container, oldStartVNode.el)

        // 移动完后，两个标识各自往里移动一位
        oldEndVNode = oldChildren[--oldEndIdx]
        newStartVNode = newChildren[++newStartIdx]
      } else if (oldStartVNode.key === newEndVNode.key) {
        // oldStartIdx 和 newEndVNode 比较

        patch(oldStartVNode, newEndVNode, container, null)
        insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)

        oldStartVNode = oldChildren[++oldStartIdx]
        newEndVNode = newChildren[--newEndIdx]
      } else if (oldEndVNode.key === newEndVNode.key) {
        // oldEndIdx 和 newEndIdx 比较

        // 由于都是最后一位，只需更新节点，无需移动
        patch(oldEndVNode, newStartVNode, container, null)

        oldEndVNode = oldChildren[--oldEndIdx]
        newEndVNode = newChildren[--newEndIdx]
      } else {
        // 四次比较未发现复用的时候，进行的特殊处理

        // 查找 newStartVNode 在旧 children 内是否存在复用，并输出对应的索引值
        const idxInOld = oldChildren.findIndex((node: any) => {
          return node.key === newStartVNode.key
        })
        // 是否存在复用
        if (idxInOld > 0) {
          // 获取到需要移动的旧节点
          const vnodeToMove = oldChildren[idxInOld]
          // 更新节点
          patch(vnodeToMove, newStartVNode, container, null)
          // 将就节点插入到最前面
          insert(vnodeToMove.el, container, oldStartVNode.el)
          // 因为真实 DOM 已经移动了不在原位，所以虚拟节点也需要取消掉
          oldChildren[idxInOld] = undefined
          // 更新 newStartIdx
          newStartVNode = newChildren[++newStartIdx]
        }
      }
    }
  }

  /**
   * 简单 diff 算法更新数组
   * @param n1 旧 vnode
   * @param n2 新 vnode
   * @param container
   */
  function patchArrayChildren(n1: any, n2: any, container: any) {
    const oldChildren = n1.children
    const newChildren = n2.children
    const oldLen = oldChildren.length
    const newLen = newChildren.length

    let lastIndex = 0 // 用于存储循环中遇到的最大索引值
    // 遍历新 children ，每遍历依次就遍历旧 children 查找有没有 key 相同的节点
    for (let i = 0; i < newLen; i++) {
      // 判断是否在旧 children 中找到可复用节点的标识
      let find = false
      const newVNode = newChildren[i]
      for (let k = 0; k < oldLen; k++) {
        const oldVNode = oldChildren[k]
        if (newVNode.key === oldVNode.key) {
          find = true
          // 如果 key 相同，代表可以复用
          // 但是即使是可以复用，内部的 children 可能不相同了，所以还需要 patch 更新
          patch(oldVNode, newVNode, container, null)

          if (k < lastIndex) {
            // 如果当前找到的旧 children 的索引值小于 lastIndex，说明节点需要移动
            // why? 因为外层循环新 children 的索引是越来越大的，如果不需要移动，那么旧 children 的索引值也应该越来越大，而不能小于 lastIndex

            // 获取 newVNode 的前一个 vnode
            const prevVNode = newChildren[i - 1]
            // 如果 prevVNode 不存在，说明是第一个节点，不需要移动
            if (prevVNode) {
              // 我们要将 newVNode 的真实 DOM 移动到 prevNode 对应的真实 DOM 后面
              // 所以我们获取 prevVNode 的真实 DOM 的下一个兄弟节点
              const anchor = prevVNode.el.nextSibling
              // 插入这个兄弟节点的前面，就相当于插入 prevNode 真实 DOM 节点的后面
              insert(newVNode.el, container, anchor)
            }
          } else {
            // 说明当前节点不需要移动
            // 更新最大索引值
            lastIndex = k
          }

          break
        }
      }
      // 如果 find 为 false ，说明没有找到可复用节点，需要添加
      if (!find) {
        const prevVNode = newChildren[i - 1]
        let anchor = null
        if (prevVNode) {
          // 同理找锚点进行插入
          anchor = prevVNode.el.nextSibling
        } else {
          // 如果没有上一个节点，说明添加的是第一个子节点
          anchor = container.firstChild
        }
        patch(null, newVNode, container, anchor)
      }
    }

    // 遍历旧 children ，目的是为了删除节点
    for (let i = 0; i < oldLen; i++) {
      const oldVNode = oldChildren[i]
      // 在新 children 上查找是否存在相同 key 的节点
      const has = newChildren.find((vnode: any) => {
        return vnode.key === oldVNode.key
      })
      // 如果不存在则删除
      if (!has) {
        unmount(oldVNode)
      }
    }
  }

  return {
    render,
  }
}
