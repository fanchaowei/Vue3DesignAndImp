// 定义状态机的状态
const State = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称状态
  text: 4, // 文本状态
  tagEnd: 5, // 标签结束状态
  tagEndName: 6 // 结束标签名称状态
}

// 辅助函数，用于判断是否是字母
function isAlpha(char: String) {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}

// 接受模板字符串作为参数，并将模板切割为 Token 返回
export function tokenize(str: String) {
  // 状态机的当前状态，默认在初始状态
  let currentState = State.initial
  // 用于缓存字符
  const chars = []
  // 用于存放生成的 token
  const tokens = []

  // 开启自动机循环
  while (str) {
    // 查看当前 str 的第一个字母
    const char = str[0]
    // 根据当前的状态，来处理 char
    switch (currentState) {
      // 当前为初始状态
      case State.initial:
        if (char === '<') {
          // 如果是 < ，则切换到标签开始状态，并排出该字符
          currentState = State.tagOpen
          str = str.slice(1)
        } else if (isAlpha(char)) {
          // 如果是字母，则切换到文本状态
          currentState = State.text
          // 将当前字母添加到缓存数组
          chars.push(char)
          // 排出该字符
          str = str.slice(1)
        }
        break
      // 当前为标签开始状态
      case State.tagOpen:
        if (isAlpha(char)) {
          // 如果是字母，切换到标签名称状态
          currentState = State.tagName
          // 存入缓存数组
          chars.push(char)
          str = str.slice(1)
        } else if (char === '/') {
          // 如果是 / ，进入结束标签状态
          currentState = State.tagEnd
          str = str.slice(1)
        }
        break
      // 标签名称状态
      case State.tagName:
        if (isAlpha(char)) {
          // 如果是字母，存入缓存数组
          chars.push(char)
          str = str.slice(1)
        } else if (char === '>') {
          // 如果是 > ，切换到初始状态
          currentState = State.initial
          // 创建一个标签 token，讲当前缓存的信息存入。
          tokens.push({
            type: 'tag',
            name: chars.join('')
          })
          // 字符缓存清空
          chars.length = 0
          str = str.slice(1)
        }
        break
      // 文本状态
      case State.text:
        if (isAlpha(char)) {
          // 如果是字母，存入缓存数组
          chars.push(char)
          str = str.slice(1)
        } else if (char === '<') {
          // 如果是 < ，说明已经结束了文本状态，进入结束标签状态
          currentState = State.tagOpen
          // 创建一个文本 token，讲当前缓存信息存入
          tokens.push({
            type: 'text',
            content: chars.join('')
          })
          // 清空缓存
          chars.length = 0
          str = str.slice(1)
        }
        break
      // 标签结束状态
      case State.tagEnd:
        if (isAlpha(char)) {
          // 如果是字母，进入结束标签名称状态
          currentState = State.tagEndName
          chars.push(char)
          str = str.slice(1)
        }
        break
      // 结束标签名称状态
      case State.tagEndName:
        if (isAlpha(char)) {
          // 如果是字母，存入缓存数组
          chars.push(char)
          str = str.slice(1)
        } else if (char === '>') {
          // 如果是 > ，回到初始状态
          currentState = State.initial
          // 创建一个结束标签名称 token
          tokens.push({
            type: 'tagEnd',
            name: chars.join('')
          })
          chars.length = 0
          str = str.slice(1)
        }
        break
    }
  }
  return tokens
}

// 构建 AST
export function parse(str: String) {
  // 获取 tokens
  const tokens = tokenize(str)
  // 创建 root 节点
  const root = {
    type: 'Root',
    children: []
  }
  // 创建 elementStack 栈，起初只有 Root 根节点
  const elementStack = [root]
  while (tokens.length) {
    // 取出栈顶的节点，也是当前循环节点的父节点
    const parent: any = elementStack[elementStack.length - 1]
    // 取出当前处理的 token
    const t = tokens[0]
    switch (t.type) {
      case 'tag':
        // 如果当前 Token 是开始标签，则创建 Element 类型的 AST 节点
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: []
        }
        // 将其添加到父级节点的 children 中
        parent.children.push(elementNode)
        // 将该 AST 节点压入栈中
        elementStack.push(elementNode)
        break
      case 'text':
        // 如果是文本，则创建 Text 类型的 AST 节点
        const textNode: any = {
          type: 'Text',
          content: t.content
        }
        // 将其添加到父节点的 children 中
        parent.children.push(textNode)
        break
      case 'tagEnd':
        // 如果是结束标签，将栈顶的 AST 节点弹出
        elementStack.pop()
        break
    }
    // 清除本次处理的 token
    tokens.shift()
  }
  // 返回 AST
  return root
}

// --------------------------------------------------------------------------------------------------------

// 定义文本模式，作为一个状态表
const TextModes = {
  DATA: 'DATA',
  RCDATA: 'RCDATA',
  RAWTEXT: 'RAWTEXT',
  CDATA: 'CDATA'
}
// 解析器函数，接受模板作为参数
export function _parse(str: string) {
  // 定义上下文对象
  const context = {
    // source 是模板内容，用于再解析过程中进行消费
    source: str,
    // 解析器当前处于文本模式，初始模式为 DATA
    mode: TextModes.DATA,
    // 用于消耗模板指定数量的字符
    advanceBy(num: number) {
      // 传入要截断的位数
      context.source = context.source.slice(num)
    },
    // 清除无用的空白字符，例如：<div     >，内部的空格
    advanceSpaces() {
      // 匹配空白字符
      const match = /^[\t\r\n\f ]+/.exec(context.source)
      if (match) {
        // 调用 advanceBy 消耗空白字符
        context.advanceBy(match[0].length)
      }
    }
  }

  // parseChildren 函数用于解析字符串，返回解析后得到的子节点
  const nodes = parseChildren(context, [])

  return {
    type: 'Root',
    children: nodes
  }
}

/**
 * 解析器的核心，解析字符串
 * @param context 上下文对象
 * @param ancestors 由父代节点构成的栈，用于维护节点间的父子级关系。
 * @returns
 */
function parseChildren(context: any, ancestors: any): any {
  // 存储解析后的子节点
  let nodes = []
  // 上下文对象中取得数据
  const { mode, source } = context

  // 遍历直至字符串全部解析完毕
  while (!isEnd(context, ancestors)) {
    let node: any
    // 模式为 DATA 或 RCDATA 才进入
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      if (mode === TextModes.DATA && source[0] === '<') {
        if (source[1] === '!') {
          if (source.startsWith('<!--')) {
            // 转换注释
            node = parseComment(context)
          } else if (source.startsWith('<!CDATA[')) {
            // 转换 CDATA
            node = parseCDATA(context)
          }
        } else if (source[1] === '/') {
          // 转换结束标签
          // 这里需要抛出错误，因为结束标签并不是在状态机内部处理，所以当遭遇结束标签时，抛出错误
          console.error('无效的结束标签')
          continue
        } else if (/[a-z]/i.test(source[1])) {
          // 转换标签
          node = parseElement(context, ancestors)
        }
      } else if (source.startsWith('{{')) {
        // 解析插值
        node = parseInterpolation(context)
      }

      if (!node) {
        // 如果 node 还是为 null，说明不是 DATA 或 RCDATA 模式，一律当文本处理
        node = parseText(context)
      }

      nodes.push(node)
    }
  }
  return nodes
}

function parseText(context: any) {
  // Implement
}

function parseComment(context: any) {
  // Implement
}

function parseCDATA(context: any) {
  // Implement
}
// 转换标签
function parseElement(context: any, ancestors: any) {
  // 调用 parseTag 函数解析开始标签
  const element = parseTag(context)
  // 如果是自闭标签，则直接返回
  if (element.isSelfClosing) return element

  // 切换文本模式
  if (element.tag === 'textarea' || element.tag === 'title') {
    context.mode = TextModes.RCDATA
  } else if (
    /style | xmp | iframe | noembed | noframes | noscript/.test(element.tag)
  ) {
    context.mode = TextModes.RAWTEXT
  } else {
    context.mode = TextModes.DATA
  }

  ancestors.push(element)
  // 解析开始标签和结束标签的中间部分
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (context.source.startsWith(`</${element.tag}`)) {
    // 调用 parseTag 函数解析结束标签，传递了第二个参数： ‘end’
    parseTag(context, 'end')
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`)
  }
  return element
}
// 用来处理开始标签和结束标签
//  第二个参数，type 用于区分是开始标签还是结束标签，'start' 为开始，‘end’ 为结束
function parseTag(context: any, type: any = 'start'): any {
  const { advanceBy, advanceSpaces } = context

  // 正则处理标签
  const match: any =
    type === 'start'
      ? /^<([a-z][^\t\r\n\f />]*)/i.exec(context.source)
      : /^<\/([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  // 获取标签名称
  const tag = match[1]
  // 消耗掉左箭头和标签名称部分，例：<div
  advanceBy(match[0].length)
  // 消耗掉空白的字符
  advanceSpaces()

  // 判断是否是自闭标签
  const isSelfClosing = context.source.startsWith('/>')
  // 消耗右标签
  advanceBy(isSelfClosing ? 2 : 1)

  return {
    type: 'Element',
    // 标签的名称
    tag,
    // 标签的属性
    props: [],
    // 子节点留空
    children: [],
    // 是否自闭合
    isSelfClosing
  }
}

function parseInterpolation(context: any) {
  // Implement
}

// 是否停止状态机，true 停止
function isEnd(context: any, ancestors: any) {
  // 当模板内容解析完毕后，停止
  if (!context.source) return true
  // 将 source 的开头与栈内的所有节点做比较
  for (let i = 0; i < ancestors.length; i++) {
    // 如果与任意一项栈内的节点符合，则停止状态机
    if (context.source.startsWith(`</${ancestors[i].tag}`)) return true
  }
}
