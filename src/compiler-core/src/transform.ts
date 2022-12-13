import { dump } from './utils'

// 用于转换 AST
export function traverseNode(ast: any, context: any) {
  const currentNode = ast

  // 从 context 中获取 ast 的处理数组
  const transforms = context.nodeTransforms
  for (let i = 0; i < transforms.length; i++) {
    // 循环处理数组，将当前的节点传入进行处理
    transforms[i](currentNode, context)
  }

  // 有 children 则递归
  const children = currentNode.children
  if (children) {
    children.forEach((c: any) => traverseNode(c, context))
  }
}

export function transforms(ast: any) {
  // 创建 context 对象，对象内注册 nodeTransforms 数组（ast 处理数组），提供给 traverseNode 调用
  const context = {
    nodeTransforms: [transformElement, transformText]
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
function transformText(node: any) {
  if (node.type === 'Text') {
    node.content = node.content.repeat(2)
  }
}
