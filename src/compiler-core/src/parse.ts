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
          str.slice(1)
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
          str.slice(1)
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
          currentState = State.text
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
