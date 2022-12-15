// 工具函数，用于打印 AST 节点的信息
export function dump(node: any, indent = 0) {
  // 节点的类型
  const type = node.type
  // 节点的描述，如果是 Root 节点则描述为空
  const desc =
    node.type === 'Root'
      ? ''
      : node.type === 'Element'
      ? node.tag
      : node.content
  console.log(`${'-'.repeat(indent)}${type}: ${desc}`)
  // 存在 children 则递归
  if (node.children) {
    node.children.forEach((n: any) => dump(n, indent + 2))
  }
}

// 用来创建描述 StringLiteral 节点
export function createStringLiteral(value: any) {
  return {
    type: 'StringLiteral',
    value
  }
}
// 创建描述 Identifier 节点
export function createIdentifier(name: any) {
  return {
    type: 'Identifier',
    name
  }
}
// 创建 ArrayExpression 节点
export function createArrayExpression(elements: any) {
  return {
    type: 'ArrayExpression',
    elements
  }
}
// 创建 CallExpression 节点
export function createCallExpression(callee: any, argument: any) {
  return {
    type: 'CallExpression',
    callee,
    arguments: argument
  }
}
