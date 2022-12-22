// 动态节点栈
export const dynamicChildrenStack: any = []
// 当前动态节点集合
export let currentDynamicChildren: any = null
// openBlock 用来创建一个新的动态节点集合，并讲该集合压入栈中
export function openBlock() {
  dynamicChildrenStack.push((currentDynamicChildren = []))
}
// closeBlock 用来将通过 openBlock 创建的动态节点集合从栈中弹出
export function closeBlock() {
  currentDynamicChildren = dynamicChildrenStack.pop()
}

// 创建 block
export function createBlock(tag: any, props: any, children: any) {
  // block 本质上是 vnode
  const block: any = createVNode(tag, props, children)
  // 赋值动态节点集合
  block.dynamicChildren = currentDynamicChildren
  // 将但其那动态节点集合从栈中弹出
  closeBlock()
  return block
}

// 创建虚拟节点
export function createVNode(tag: any, props: any, children: any, flags?: any) {
  const key = props && props.key
  props && delete props.key

  const vnode = {
    tag,
    props,
    children,
    key,
    patchFlags: flags
  }

  // 如果是动态节点，则存入动态节点集合中
  if (typeof flags !== 'undefined' && currentDynamicChildren) {
    currentDynamicChildren.push(vnode)
  }

  return vnode
}
