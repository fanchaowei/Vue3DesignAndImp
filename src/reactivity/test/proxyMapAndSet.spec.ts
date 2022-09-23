import { reactive } from '../proxyMapAndSet'

describe('MapAndSet', () => {
  it('Set', () => {
    const s = new Set([1, 2, 3])
    const p = reactive(s)

    // 访问 size
    console.log(p.size)

    // 删除
    p.delete(1)
  })
})
