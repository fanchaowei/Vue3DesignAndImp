import { currentInstance, Fragment } from '../runtime-core'

export const KeepAlive: any = {
  // Keep Alive 特有得标识
  __isKeepAlive: true,
  props: {
    include: RegExp, // 只输入正则表达式，RegExp 是正则的类型
    exclude: RegExp,
  },
  setup(props: any, { slots }: any) {
    // 创建一个缓存对象
    // key：vnode.type
    // value: vnode
    const cache = new Map()
    // 当前 keepAlive 组件的实例
    const instance = currentInstance
    // 对于 keepAlive 组件来说，它的实例上存在特殊的 keepAliveCtx 对象，该对象由渲染器注入
    // 该对象会暴露渲染器的一些内部方法，其中 move 函数用来将一段 DOM 移动到另一个容器
    const { move, createElement } = instance.keepAliveCtx
    // 创建隐藏容器
    const storageContainer = createElement('div')

    // KeepAlive 组件的实例上会被添加两个内容函数，分别是 _deActivate 和 _activate
    // 这两个函数会在渲染器中被调用
    instance._deActivate = (vnode: any) => {
      move(vnode, storageContainer)
    }
    // 锚点怎么找？
    // 锚点的话，会在 patchChildren 时的 diff 算法比较时，会传入 patch 中进行更新，更新的时候传入了锚点
    instance._activate = (vnode: any, container: any, anchor: any) => {
      move(vnode, container, anchor)
    }

    return () => {
      // KeepAlive 的默认插槽就是要被 KeepAlive 的组件
      let rawVNode = slots.default()
      // 如果不是组件，则直接渲染，非组件的虚拟节点不能 keepAlive
      if (typeof rawVNode.type !== 'object') {
        return rawVNode
      }

      const name = rawVNode.type.name
      // 查看 keepAlive 内的组件是否被 exclude 匹配，并不被 include 匹配，匹配成功则直接渲染虚拟节点
      if (
        name &&
        ((props.include && !props.include.test(name)) ||
          (props.exclude && props.exclude.test(name)))
      ) {
        return rawVNode
      }

      // 从缓存中取出缓存的组件
      const cachedVNode = cache.get(rawVNode.type)
      if (cachedVNode) {
        // 如果存在，则将缓存的组件实例赋值给现在虚拟节点的组件实例
        rawVNode.component = cachedVNode.component
        // 将 keptAlive 设置为 true，避免渲染器重新挂载它
        rawVNode.keptAlive = true
      } else {
        // 如果缓存中没有，则存入缓存
        cache.set(rawVNode.type, rawVNode)
      }
      // 添加该属性并设置为 true，避免渲染器真的卸载组件
      rawVNode.shouldKeepAlive = true
      // 将 keepAlive 组件的实例也添加到 vnode 上，以便在渲染器中访问
      rawVNode.keepAliveInstance = instance

      return rawVNode
    }
  },
  render(): any {
    return {
      type: Fragment,
      children: [this.$slots.default()],
    }
  },
}
