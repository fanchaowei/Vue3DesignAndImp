// 将 JavaScript AST 转换为渲染函数的代码
export function generate(node: any) {
  // 全局的上下文对象
  const context = {
    code: '',
    // 在生成代码时，通过调用 push 函数完成代码的拼接
    push(code: string) {
      context.code += code
    },
    // 当前缩进的级别，一个级别为两个空格
    currentIndent: 0,
    // 用于换行的函数
    // 换行后，要保持缩进
    newline() {
      context.code += '\n' + '  '.repeat(context.currentIndent)
    },
    // 用来缩进，即让 currentIndent 自增后，调用换行函数
    indent() {
      context.currentIndent++
      context.newline()
    },
    // 取消缩进，让 currentIdent 自减后，调用换行函数
    deIndent() {
      context.currentIndent--
      context.newline()
    }
  }

  // 调用 genNode 函数完成代码生成的工作
  genNode(node, context)

  return context.code
}

// 处理 JavaScript AST
function genNode(node: any, context: any) {
  // 按照 node.type 调用对应的转换方法
  switch (node.type) {
    case 'FunctionDecl':
      genFunctionDecl(node, context)
      break
    case 'ReturnStatement':
      genReturnStatement(node, context)
      break
    case 'CallExpression':
      genCallExpression(node, context)
      break
    case 'StringLiteral':
      genStringLiteral(node, context)
      break
    case 'ArrayExpression':
      genArrayExpression(node, context)
      break
  }
}
// 处理数组，生成对应的 JavaScript 代码
function genArrayExpression(node: any, context: any) {
  const { push } = context
  push(`[`)
  genNodeList(node.elements, context)
  push(`]`)
}
// 处理文本，生成对应的 JavaScript 代码
function genStringLiteral(node: any, context: any) {
  const { push } = context
  push(`'${node.value}'`)
}
// 处理函数调用，生成对应的 JavaScript 代码
function genCallExpression(node: any, context: any) {
  const { push } = context
  const { callee, arguments: args } = node
  push(`${callee.name}(`)
  // 生成参数
  genNodeList(args, context)
  push(`)`)
}
// 处理函数返回，生成对应的 JavaScript 代码
function genReturnStatement(node: any, context: any) {
  const { push } = context
  // 追加 return 关键字和空格
  push(`return `)
  genNode(node.return, context)
}
// 处理函数的声明，生成对应的 JavaScript 代码
function genFunctionDecl(node: any, context: any) {
  const { push, indent, deIndent } = context
  push(`function ${node.id.name}`)
  push(`(`)
  // 生成函数的参数
  genNodeList(node.params, context)
  push(`) `)
  push(`{`)
  // 缩进
  indent()
  // 依次将内部的内容传入到 genNode 中生成对应的渲染函数代码
  node.body.forEach((n: any) => genNode(n, context))
  deIndent()
  push(`}`)
}

// 生成函数声明的参数或数组的内容
function genNodeList(nodes: any, context: any) {
  const { push } = context
  // 遍历参数
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    // 将每个参数节点都传入 genNode 中进行处理
    genNode(node, context)
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}
