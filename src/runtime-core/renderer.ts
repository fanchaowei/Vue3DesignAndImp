import {
  effect,
  reactive,
  shallowReactive,
  shallowReadOnly
} from '../reactivity'
import queueJob from '../util/jobQueue'

// 文本节点的 vnode.type 标识
export const Text = Symbol()
// 注释节点的 vnode.type 标识
export const Comment = Symbol()
// Fragment 的标识
export const Fragment = Symbol()

// 全局变量，用于存储当前正在被初始化的组件实例
export let currentInstance: any = null

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
    setText
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
    // 处理 Fragment 节点
    else if (type === Fragment) {
      if (!n1) {
        n2.children.forEach((c: any) => patch(null, c, container, null))
      } else {
        // 如果有旧 vnode ，则更新 children
        patchChildren(n1, n2, container)
      }
    }
    // 处理 Teleport
    else if (typeof type === 'object' && type.__isTeleport) {
      // 调用 Teleport 组件选项中的 process 函数，将控制权交接出去
      type.process(n1, n2, container, anchor, {
        patch,
        patchChildren,
        unmount,
        move(vnode: any, container: any, anchor: any) {
          // 判断一下移动的是组件还是普通元素
          insert(
            vnode.component ? vnode.component.subTree.el : vnode.el,
            container,
            anchor
          )
        }
      })
    }
    // 处理 Component 组件，object 为有状态组件，function 为函数式组件
    else if (typeof type === 'object' || typeof type === 'function') {
      if (!n1) {
        if (n2.keptAlive) {
          // 如果存在 keptAlive 标识，则激活组件
          n2.keepAliveInstance._activate(n2, container, anchor)
        } else {
          // 挂载组件
          mountComponent(n2, container, anchor)
        }
      } else {
        // 更新组件
        patchComponent(n1, n2, container)
      }
    }
  }

  // 将组件实例设置到 currtentInstance 上
  function setCurrentInstance(instance: any) {
    currentInstance = instance
  }

  // 挂载组件
  function mountComponent(vnode: any, container: any, anchor: any) {
    // 从 vnode 中获取组件
    let componentOptions = vnode.type
    // 检查是否是函数时组件
    const isFunctional = typeof vnode.type === 'function'
    if (isFunctional) {
      // 如果是函数时组件，则改变 componentOptions
      componentOptions = {
        render: vnode.type,
        props: vnode.type.props
      }
    }

    // 获取组件的渲染函数 render, 与组件数据 data, 和生命周期等
    let {
      render,
      data,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
      props: propsOption,
      setup
    } = componentOptions

    // 执行 beforeCreate 钩子
    beforeCreate && beforeCreate()

    // 将组件数据 data 包装成响应式数据
    const state = data ? reactive(data()) : null
    // 调用 resolve 函数解析出最终的 props 数据与 attrs 数据
    const [props, attrs] = resolveProps(propsOption, vnode.props)

    // 定义 emit 函数
    // event: 事件名称
    // payload: 传递给事件处理函数的参数
    const emit = (event: any, ...payload: any) => {
      // 按照约定的对事件的命名进行处理，例如：change => onChange
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
      // 在 props 内查找是否存在该名称的事件
      const handler = instance.props[eventName]
      if (handler) {
        // 调用时间处理函数并传递参数
        handler(...payload)
      } else {
        console.error('事件不存在')
      }
    }

    // 将 vnode.children 作为 slot 对象
    const slots = vnode.children || {}

    // 定义组件实例，一个组件实例本质上就是一个对象，它包含与组件相关的状态信息
    const instance: any = {
      // 组件自身的状态数据，即 data
      state,
      // 将解析处的 props 包装为 shallowReactive 并定义到组件实例上
      props: shallowReactive(props),
      // 一个布尔值标识，用于判断是否已经挂载
      isMounted: false,
      // 组件所渲染的内容，即子树(subTree)
      subTree: null,
      // 插槽
      slots,
      // 在组件实例中添加 mounted 数组，用来存储通过 onMounted 函数注册的生命周期钩子
      mounted: []
    }

    const isKeepAlive = vnode.type.__isKeepAlive
    if (isKeepAlive) {
      // 如果是 keepAlive 组件，则赋予 keepAliveCtx 对象
      instance.keepAliveCtx = {
        move(vnode: any, container: any, anchor: any) {
          // 可以看到 move 的本质就是移动渲染的内容到指定的容器中。
          insert(vnode.component.subTree.el, container, anchor)
        },
        createElement
      }
    }

    // 传入  setup 的第二个参数
    const setupContext = { attrs, emit, slots }
    // 调用 setup 函数之前，存储当前的组件实例
    setCurrentInstance(instance)
    // 调用 setup 函数，获得返回值
    const setupResult = setup(shallowReadOnly(instance.props), setupContext)
    // setup 函数执行后，重置 currentInstance
    setCurrentInstance(null)
    // 用来存储 setup 返回的数据
    let setupState: any = null

    if (typeof setupResult === 'function') {
      if (render) {
        // setup 函数代表渲染函数，但又存在 render ，发生冲突
        console.error(`setup 函数返回渲染函数， render 选项将被忽略`)
        render = setupResult
      }
    } else {
      setupState = setupResult
    }

    // 将组件实例挂载到 vnode 上，用于后续更新
    vnode.component = instance

    // 创建渲染上下文对象，本质上是组件实例的处理
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        const { state, props, slots } = t
        if (k === '$slots') {
          // 返回插槽
          return slots
        }
        // 查看 k 存在在 state 还是 props 上，并对应返回
        if (state && k in state) {
          return state[k]
        } else if (k in props) {
          return props[k]
        } else if (setupState && k in setupState) {
          return setupState[k].__v_isRef ? setupState[k].value : setupState[k]
        } else {
          console.error('不存在')
        }
      },
      set(t, k: any, v, r) {
        const { state, props } = t
        if (state && k in state) {
          state[k] = v
        } else if (k in props) {
          console.warn(`Attempting to mutate prop "${k}". Props are readonly.`)
        } else if (setupState && k in setupState) {
          // 支持对 setup 暴露的属性的修改
          if (setupState[k].__v_isRef) {
            setupState[k].value = v
          } else {
            setupState[k] = v
          }
        } else {
          console.error('不存在')
        }
        return true
      }
    })

    // 在这里调用 created 钩子
    created && created.call(renderContext)

    effect(
      () => {
        // 执行渲染函数，获取组件要渲染的内容。即 render 函数返回的虚拟 DOM
        const subTree = render.call(renderContext, renderContext)

        // 检查组件是否已经被挂载
        if (!instance.isMounted) {
          // 在这里调用 beforeMount 钩子
          beforeMount && beforeMount.call(renderContext)
          // 初次挂载，patch 第一个参数传 null
          patch(null, subTree, container, anchor)
          // 将 isMounted 改为 true，这样就不会再执行挂载操作了
          instance.isMounted = true
          // 在这里调用 mounted 钩子
          instance.mounted &&
            instance.mounted.forEach((hook: any) => hook.call(renderContext))
        } else {
          // 调用 beforeUpdate 钩子
          beforeUpdate && beforeUpdate.call(renderContext)
          // 如果是更新，则从组件实例中取出旧的 subTree，与新的 subTree 一起进行更新打补丁。
          patch(instance.subTree, subTree, container, anchor)
          // 调用 updated 钩子
          updated && updated.call(renderContext)
        }
        // 更新组件实例的子树 subTree
        instance.subTree = subTree
      },
      {
        // 用于将更新放在微任务队列中
        scheduler: queueJob
      }
    )
  }

  // 用于解析组件的 props 和 attrs
  function resolveProps(options: any, propsData: any): [any, any] {
    const props: any = {}
    const attrs: any = {}

    // 遍历组件传递的 props 数据
    for (const key in propsData) {
      if (options) {
        if (key in options) {
          // 如果为组件传递的 props 数据在组件自身的 props 选项中有定义，则将其视为合法的 props
          props[key] = propsData[key]
        } else {
          // 否则将其视为 attrs
          attrs[key] = propsData[key]
        }
      }
      if (key.startsWith('on')) {
        // 以 on 打头的数据也都会存入 props 中
        props[key] = propsData[key]
      }
    }
    return [props, attrs]
  }

  // 更新组件
  function patchComponent(n1: any, n2: any, container: any) {
    // 获取组件实例，即 n1.component，同时让新的组件虚拟节点 n2.component 也指向组件实例
    const instance = (n2.component = n1.component)
    // 获取当前的 props 数据
    const { props } = instance
    // 调用 hasPropsChanged 检测为子组件传递的 props 是否发生变化，如果没有变化，则不需要更新
    if (hasPropsChanged(n1.props, n2.props)) {
      // 调用 resolveProps 函数重新获取 props 数据
      const [nextProps] = resolveProps(n2.type.props, n2.props)
      // 更新 props
      for (const k in nextProps) {
        props[k] = nextProps[k]
      }
      // 删除不存在的 props
      for (const k in props) {
        if (!(k in nextProps)) {
          delete props[k]
        }
      }
    }
  }

  // 判断子组件传递的 props 是否发生变化
  function hasPropsChanged(prevProps: any, nextProps: any) {
    const nextKeys = Object.keys(nextProps)
    // 先简单的判断，新旧 props 长度是否不同，不同则说明发生了变化
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true
    }
    for (let i = 0; i < nextKeys.length; i++) {
      // 循环每个 key ，将新旧 props 进行判断
      const key = nextKeys[i]
      if (nextProps[key] !== prevProps[key]) return true
    }
    return false
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

    // 是否是 transition 组件
    const needTransition = vnode.transition
    // beforeEnter 钩子
    if (needTransition) {
      vnode.transition.beforeEnter(el)
    }

    // 将元素添加到容器中
    insert(el, container, anchor)

    // enter 钩子
    if (needTransition) {
      vnode.transition.enter(el)
    }
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

    if (n2.patchFlags) {
      const flags = n2.patchFlags
      if (flags === 1) {
        // 只更新文本内容
      } else if (flags === 2) {
        // 只更新 class
      } else if (flags === 3) {
        // 只更新 style
      }
    } else {
      // 全量更新
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
    }

    // 更新 children
    if (n2.dynamicChildren) {
      // 如果存在动态节点集合，则直接从动态节点集合里进行更新，这样就只更新动态节点，防止静态节点更新，节省性能开销。
      patchBlockChildren(n1, n2)
    } else {
      patchChildren(n1, n2, el)
    }
  }
  // 处理动态节点集合
  function patchBlockChildren(n1: any, n2: any) {
    for (let i = 0; i < n2.dynamicChildren.length; i++) {
      // 依次循环遍历，处理动态节点
      patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i])
    }
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
   * 快速 diff 算法
   * @param n1
   * @param n2
   * @param container
   */
  function patchKeyedChildren(n1: any, n2: any, container: any) {
    const newChildren = n2.children
    const oldChildren = n1.children
    // 索引 j 为前置节点标识，指向新旧 children 的头部
    let j = 0
    let oldVNode = oldChildren[j]
    let newVNode = newChildren[j]
    // 向后循环查找，直到找到 key 不同的节点位置，这时完成了前置节点的更新
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container, null)
      j++
      oldVNode = oldChildren[j]
      newVNode = newChildren[j]
    }

    // 获取新旧 children 最后一位的位置，作为后置节点标识
    let oldEnd = oldChildren.length - 1
    let newEnd = newChildren.length - 1

    oldVNode = oldChildren[oldEnd]
    newVNode = newChildren[newEnd]
    // 向前循环，直到找到 key 不同的节点位置，这时完成了后置节点的更新
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, container, null)

      oldEnd--
      newEnd--
      oldVNode = oldChildren[oldEnd]
      newVNode = newChildren[newEnd]
    }

    // 满足这个条件的，说明 j->newEnd 之间的节点应作为新节点插入
    if (j > oldEnd && j <= newEnd) {
      // 获取锚点
      const anchorIndex = newEnd + 1
      const anchor =
        newChildren.length > anchorIndex ? newChildren[anchorIndex].el : null
      while (j <= newEnd) {
        // 循环插入
        patch(null, newChildren[j++], container, anchor)
      }
    }
    // 满足这个条件的则为 j->oldEnd 之间的旧节点需要卸载
    else if (j > newEnd && j <= oldEnd) {
      while (j <= oldEnd) {
        unmount(oldChildren[j++])
      }
    }
    // 处理非理想状况
    else {
      // 计算出需要处理的区间长度
      const count = newEnd - j + 1
      // 用于存储新的一组子节点中的节点在旧的一组子节点中的位置索引，用于后续计算最长递增子序列
      const source = new Array(count)
      source.fill(-1)

      const oldStart = j
      const newStart = j
      // 索引表，key 为新节点的 key。 value 为对应 key 在新 children 数组内的索引
      const keyIndex: any = {}
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key] = i
      }
      // 是否需要移动的标识
      let moved = false
      // 与简单 diff 算法一样，循环中出现的最大的索引值
      let pos = 0
      // 代表循环中已经处理了节点，避免处理超出
      let patched = 0
      // 遍历旧的一组子节点中剩余未处理的节点
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldChildren[i]

        // 已更新节点的数量是否超出需要更新的数量
        if (patched <= count) {
          // 通过 key 在索引表内反查找 newChildren 的索引
          const k = keyIndex[oldVNode.key]

          if (typeof k !== undefined) {
            // 如果存在，则更新节点
            newVNode = newChildren[k]
            patch(oldVNode, newVNode, container, null)
            // 存入数组
            source[k - newStart] = i
            // 判断是否需要移动
            if (k < pos) {
              // 需要移动
              moved = true
            } else {
              pos = k
            }
          } else {
            // 没找到则卸载
            unmount(oldVNode)
          }
        }
      }

      // 如果 moved 为 true ，说明需要移动位置
      if (moved) {
        // 获得最长递增子序列
        const seq = lis(source)

        // s 指向最长递增子序列的最后一个元素
        let s = seq.length - 1
        // i 指向 newChildren 需要处理的区间内的数组的最后一个元素
        let i = count - 1
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            // source[i] 为 -1 说明需要新增

            // 获取需要新增的 vnode
            const pos = i + newStart
            const newVNode = newChildren[pos]
            // 获取锚点
            const nextPos = pos + 1
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null
            // 挂载
            patch(null, newVNode, container, anchor)
          } else if (seq[s] !== i) {
            // 不相等说明需要移动

            // 获取需要移动的 vnode
            const pos = i + newStart
            const newVNode = newChildren[pos]
            // 获取锚点
            const nextPos = pos + 1
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null
            // 移动
            insert(newVNode.el, container, anchor)
          } else {
            // 相等则是找到了对应的无需移动的 vnode ，s 向前走一位。
            s--
          }
        }
      }
    }
  }

  /**
   * 双端 diff 算法
   * @param n1
   * @param n2
   * @param container
   */
  function patchKeyedChildren_1(n1: any, n2: any, container: any) {
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
        // 不存在说明已处理，跳过
        oldStartVNode = oldChildren[++oldStartIdx]
      } else if (!oldEndVNode) {
        // 不存在说明已处理，跳过
        oldEndVNode = oldChildren[--oldEndIdx]
      } else if (oldStartVNode.key === newStartVNode.key) {
        // oldStartIdx 和 newStartIdx 比较

        patch(oldStartVNode, newStartVNode, container, null)

        oldStartVNode = oldChildren[++oldStartIdx]
        newStartVNode = newChildren[++newStartIdx]
      } else if (oldEndVNode.key === newEndVNode.key) {
        // oldEndIdx 和 newEndIdx 比较

        // 由于都是最后一位，只需更新节点，无需移动
        patch(oldEndVNode, newEndVNode, container, null)

        oldEndVNode = oldChildren[--oldEndIdx]
        newEndVNode = newChildren[--newEndIdx]
      } else if (oldStartVNode.key === newEndVNode.key) {
        // oldStartIdx 和 newEndVNode 比较

        patch(oldStartVNode, newEndVNode, container, null)
        insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)

        oldStartVNode = oldChildren[++oldStartIdx]
        newEndVNode = newChildren[--newEndIdx]
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
        } else {
          // 如果不存在复用，那说明 newStartVNode 是新增的头部节点
          patch(null, newStartVNode, container, oldStartVNode.el)
        }
        // 更新 newStartIdx
        newStartVNode = newChildren[++newStartIdx]
      }
    }

    // 这里是为了处理特殊原因：循环结束了，但是新增的节点却还未处理。
    // 例子：
    // 旧 children ： 1 2 3
    // 新 children ： 4 1 2 3
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        // 循环添加新节点
        patch(null, newChildren[i], container, oldStartVNode.el)
      }
    }
    // 移除旧节点
    else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i])
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
    render
  }
}

/**
 * 最长递增子序列(不考察但是需要理解该算法在 diff 算法的作用)
 * 通过传入的数组，输出正向排布的不需要变动位置的数组
 * 例如：[2, 3, 0, 5, 6, 9] -> [ 0, 1, 3, 4, 5 ]
 * 上面例子代表：原数组的第 0, 1, 3, 4, 5 位是正向增长的，无需移动位置
 * @param arr
 * @returns
 */
function lis(arr: any) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

// 生命周期 mounted
export function onMounted(fn: Function) {
  if (currentInstance) {
    // 将生命周期 push 到 mounted 数组内
    currentInstance.mounted.push(fn)
  } else {
    console.error('onMounted 函数只能在 setup 中调用')
  }
}
