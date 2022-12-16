import { parse } from '../src/parse'
import { transforms } from '../src/transform'
import { dump } from '../src/utils'

describe('transform', () => {
  // 将模板 AST 转换为 JavaScript AST
  test('base', () => {
    const ast: any = parse(`<div><p>Vue</p><p>Template</p></div>`)
    transforms(ast)
    expect(ast.jsNode).toStrictEqual({
      type: 'FunctionDecl',
      id: {
        type: 'Identifier',
        name: 'render'
      },
      params: [],
      body: [
        {
          type: 'ReturnStatement',
          return: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'h' },
            arguments: [
              {
                type: 'StringLiteral',
                value: 'div'
              },
              {
                type: 'ArrayExpression',
                elements: [
                  {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'h' },
                    arguments: [
                      { type: 'StringLiteral', value: 'p' },
                      { type: 'StringLiteral', value: 'Vue' }
                    ]
                  },
                  {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'h' },
                    arguments: [
                      { type: 'StringLiteral', value: 'p' },
                      { type: 'StringLiteral', value: 'Template' }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    })
  })
})
