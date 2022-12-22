import { openBlock, createBlock, createVNode } from '../VNode'

describe('renderer', () => {
  test('createBlock', () => {
    const VNodes =
      (openBlock(),
      createBlock('div', null, [createVNode('p', { class: 'foo' }, null, 1)]))
    console.log(VNodes)
  })
})
