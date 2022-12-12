import { tokenize } from '../src/parse'

describe('Parse', () => {
  test('tokenize', () => {
    const template = `<p>Vue<p>`
    const ast = tokenize(template)
    expect(ast).toStrictEqual([
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
})
