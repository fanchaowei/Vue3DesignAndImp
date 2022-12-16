import { generate } from '../src/codegen'
import { parse } from '../src/parse'
import { transforms } from '../src/transform'

describe('codegen', () => {
  test('happy path', () => {
    const ast: any = parse(`<div><p>Vue</p><p>Template</p></div>`)
    transforms(ast)
    const code = generate(ast.jsNode)
    expect(code).toMatchSnapshot()
  })
})
