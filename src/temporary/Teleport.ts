export const Teleport: any = {
  __isTeleport: true,
  process(n1: any, n2: any, container: any, anchor: any, internals: any) {
    // 取出渲染器内部的方法
    const { patch, patchChildren, move } = internals
    if (!n1) {
      // 没有 n1 为挂载
      // 找到要挂载到的父容器
      const target = getTarget(n2.prop.to)
      // 循环依次挂载
      n2.children.forEach((c: any) => {
        patch(null, c, target, anchor)
      })
    } else {
      // 更新
      patchChildren(n1, n2, container)
      if (n1.props.to !== n2.props.to) {
        // 如果 n1 与 n2 的 to 不相同，说明该 Teleport 移动到了别的容器内，需要进行移动
        const newTarget = getTarget(n2.prop.to)
        // 依次移动
        n2.children.forEach((c: any) => {
          move(c, newTarget)
        })
      }
    }
  }
}

// 获取父容器
function getTarget(to: any) {
  return typeof to === 'string' ? document.querySelector(to) : to
}
