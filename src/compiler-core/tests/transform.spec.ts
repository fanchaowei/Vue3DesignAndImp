import { parse } from '../src/parse'
import { transforms } from '../src/transform'
import { dump } from '../src/utils'

describe('transform', () => {
  test('base', () => {
    const ast = parse(`<div><p>Vue</p><p>Template</p></div>`)
    transforms(ast)
  })
})
