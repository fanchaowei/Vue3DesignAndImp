import { dump } from './utils'

// 用于转换 AST
export function traverseNode(ast: any, context: any) {
  // 存储当前转换中的节点
  context.currentNode = ast

  // 从 context 中获取 ast 的处理数组
  const transforms = context.nodeTransforms
  for (let i = 0; i < transforms.length; i++) {
    // 循环处理数组，将当前的节点传入进行处理
    transforms[i](context.currentNode, context)
    // 因为每个转换处理函数都可能移除节点，所以每次执行转换函数后，都得判断一下是否还存在当前节点
    if (!context.currentNode) return
  }

  // 有 children 则递归
  const children = context.currentNode.children
  if (children) {
    children.forEach((c: any, index: number) => {
      // 存储父级节点
      context.parent = context.currentNode
      // 存储索引
      context.childIndex = index
      traverseNode(c, context)
    })
  }
}

export function transforms(ast: any) {
  // 创建 context 对象
  const context: any = {
    // 用于存储当前正在转换的节点
    currentNode: null,
    // 用于存储当前节点在父节点的 children 中的位置索引
    childIndex: 0,
    // 用于存储当前转换节点的父节点
    parent: null,
    // 处理函数数组，提供给 traverseNode 调用
    nodeTransforms: [transformElement, transformText],
    // 替换节点
    replaceNode(node: any) {
      //替换节点，我们需要通过父节点的 children 找到当前节点来替换。
      context.parent.children[context.childIndex] = node
      // currentNode 要修改为替换的节点
      context.currentNode = node
    },
    // 用于删除当前节点
    removeNode() {
      // 调用 splice  方法删除当前节点
      context.parent.children.splice(context.childIndex, 1)
      // 将 context.currentNode 置空
      context.currentNode = null
    }
  }
  // 调用 traverseNode 进行转换
  traverseNode(ast, context)
  console.log(dump(ast))
}

// 转换标签节点，这里是将 p 标签转换为 h1 标签
function transformElement(node: any) {
  if (node.type === 'Element' && node.tag === 'p') {
    node.tag = 'h1'
  }
}
// 转换文本节点，这里是将文本节点的内容变成两倍
function transformText(node: any, context: any) {
  if (node.type === 'Text') {
    // node.content = node.content.repeat(2)
    // 替换节点
    // context.replaceNode({
    //   type: 'Element',
    //   tag: 'span'
    // })
    // 删除节点
    context.removeNode()
  }
}
