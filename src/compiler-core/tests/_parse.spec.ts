import { _parse } from '../src/parse'

describe('_Parse', () => {
  // 转换标签
  test('element', () => {
    const template = `<div><span></span></div>`
    const ast = _parse(template)
    expect(ast).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [],
          isSelfClosing: false,
          children: [
            {
              type: 'Element',
              tag: 'span',
              props: [],
              isSelfClosing: false,
              children: []
            }
          ]
        }
      ]
    })
  })
})
