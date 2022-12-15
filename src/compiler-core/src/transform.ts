import {
  createArrayExpression,
  createCallExpression,
  createStringLiteral,
  createIdentifier,
  dump
} from './utils'

// 用于转换 AST
export function traverseNode(ast: any, context: any) {
  // 存储当前转换中的节点
  context.currentNode = ast
  // 增加退出阶段的回调函数数组
  const exitFns = []
  // 从 context 中获取 ast 的处理数组
  const transforms = context.nodeTransforms
  for (let i = 0; i < transforms.length; i++) {
    // 循环转换数组，将当前的节点传入进行处理
    const onExit = transforms[i](context.currentNode, context)
    // 转换函数可以返回一个函数，作为结束阶段的回调函数
    if (onExit) {
      exitFns.push(onExit)
    }
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

  // 反序执行当前节点存储的回调函数
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
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
    nodeTransforms: [transformRoot, transformElement, transformText],
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

// 转换元素节点
function transformElement(node: any) {
  // 将转换代码编写再退出阶段的回调函数中
  // 这样可以保证该标签的所有子节点全部被处理完毕
  return () => {
    // 如果被转换的节点不是元素节点，则什么都不做
    if (node.type !== 'Element') {
      return
    }

    // 创建该节点的 h 函数的描述
    const callExp = createCallExpression(createIdentifier('h'), [
      createStringLiteral(node.tag)
    ])

    node.children.length === 1
      ? // 如果当前标签节点只有一个子节点，则直接使用子节点的 jsNode 作为参数
        callExp.arguments.push(node.children[0].jsNode)
      : // 如果有多个节点，则创建数组类型的 js AST 节点
        callExp.arguments.push(
          // 数组的每个元素都是子节点的 jsNode
          createArrayExpression(node.children.map((c: any) => c.jsNode))
        )
    // 将该标签的 JavaScript AST 存入 jsNode
    node.jsNode = callExp
  }
}
// 转换文本节点
function transformText(node: any, context: any) {
  if (node.type === 'Text') {
    // 如果是文本，则创建一个文本类型的 JavaScript AST 节点添加到 node.jsNode 属性下
    node.jsNode = createStringLiteral(node.content)
  }
}
// 转换 Root 根节点
function transformRoot(node: any) {
  return () => {
    // 如果不是根节点，则什么都不做
    if (node.type !== 'Root') {
      return
    }

    // 获取 Root 节点下，实际的根节点。及 Root 的子节点
    // 这里暂不考虑有多个实际根节点的情况
    const vnodeJSAST = node.children[0].jsNode
    // 创建 render 函数的声明语句节点，将 vnodeJSAST 作为 render 函数体的返回语句
    node.jsNode = {
      type: 'FunctionDecl',
      id: createIdentifier('render'),
      params: [],
      body: [
        {
          type: 'ReturnStatement',
          return: vnodeJSAST
        }
      ]
    }
  }
}
