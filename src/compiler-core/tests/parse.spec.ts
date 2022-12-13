import { tokenize, parse } from '../src/parse'

describe('Parse', () => {
  // 生成 Token
  test('tokenize', () => {
    const template = `<p>Vue</p>`
    const tokens = tokenize(template)
    expect(tokens).toStrictEqual([
      {
        type: 'tag',
        name: 'p'
      },
      {
        type: 'text',
        content: 'Vue'
      },
      {
        type: 'tagEnd',
        name: 'p'
      }
    ])
  })

  // 构建 AST
  test('parse', () => {
    const template = `<div><p>Vue</p><p>Template</p></div>`
    const tokens = tokenize(template)
    expect(tokens).toStrictEqual([
      { type: 'tag', name: 'div' }, // div 开始标签节点
      { type: 'tag', name: 'p' }, // p 开始标签节点
      { type: 'text', content: 'Vue' }, // 文本节点
      { type: 'tagEnd', name: 'p' }, // p 结束标签节点
      { type: 'tag', name: 'p' }, // p 开始标签节点
      { type: 'text', content: 'Template' }, // 文本节点
      { type: 'tagEnd', name: 'p' }, // p 结束标签节点
      { type: 'tagEnd', name: 'div' } // div 结束标签节点
    ])

    const ast = parse(template)
    expect(ast).toStrictEqual({
      // AST 的逻辑根节点
      type: 'Root',
      children: [
        // 模板的 div 根节点
        {
          type: 'Element',
          tag: 'div',
          children: [
            // div 节点的第一个子节点 p
            {
              type: 'Element',
              tag: 'p',
              // p 节点的文本节点
              children: [
                {
                  type: 'Text',
                  content: 'Vue'
                }
              ]
            },
            // div 节点的第二个子节点 p
            {
              type: 'Element',
              tag: 'p',
              // p 节点的文本节点
              children: [
                {
                  type: 'Text',
                  content: 'Template'
                }
              ]
            }
          ]
        }
      ]
    })
  })
})
