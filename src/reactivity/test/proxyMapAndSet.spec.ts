import { effect } from '../effect'
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
  it('Set 响应式', () => {
    const p = reactive(new Set([1, 2, 3]))

    const effecFn = jest.fn(() => {
      console.log(p.size)
    })

    effect(effecFn)

    expect(effecFn).toHaveBeenCalledTimes(1)
    p.add(4)
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('Map 的 get 与 set', () => {
    const p = reactive(new Map([['key', 1]]))

    const effecFn = jest.fn(() => {
      console.log(p.get('key'))
    })

    effect(effecFn)
    expect(effecFn).toHaveBeenCalledTimes(1)
    p.set('key', 2)
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('防止 set 方法污染原始数据', () => {
    const m = new Map()
    const p1 = reactive(m)
    const p2 = reactive(new Map())
    p1.set('p2', p2)

    const effecFn = jest.fn(() => {
      console.log(m.get('p2').size)
    })

    effect(effecFn)
    // 这里使用原始数据进行的 set ，不应该触发响应
    m.get('p2').set('foo', 1)
    expect(effecFn).toHaveBeenCalledTimes(1)
  })
  it('处理 forEach', () => {
    const m = new Map([[{ key: 1 }, { value: 1 }]])
    const p = reactive(m)

    // 实现最基础的响应式绑定
    const effecFn = jest.fn(() => {
      p.forEach((value: any, key: any, m: any) => {
        console.log(value)
        console.log(key)
      })
    })
    effect(effecFn)
    p.set({ key: 2 }, { value: 2 })
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('forEach 需要有深度响应的能力', () => {
    const key = { key: 1 }
    const value = new Set([1, 2, 3])
    // value 为 Set
    const p = reactive(new Map([[key, value]]))

    const effecFn = jest.fn(() => {
      p.forEach((value: any, key: any) => {
        console.log(value.size)
      })
    })
    effect(effecFn)
    p.get(key).delete(1)
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('完善 Map 类型的 forEach 响应式', () => {
    const p = reactive(new Map([['key', 1]]))

    // 因为 Map 进行 forEach 循环的时候，键和值都需要进行响应
    const effecFn = jest.fn(() => {
      p.forEach((value: any, key: any) => {
        console.log(value)
      })
    })
    effect(effecFn)
    // 改变 value 值时需要触发响应
    p.set('key', 2)
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('重写迭代器', () => {
    // 当我们使用 for...of 循环迭代一个代理对象时，内部会试图从代理对象 p 上读取 p[Symbol.iterator] 属性
    // 而 m[Symbol.iterator] 与 m.entries 是等价的
    // 所以我们需要重写这俩迭代器，实现响应式
    const m = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
    const p = reactive(m)

    const effectFn = jest.fn(() => {
      for (const [key, value] of p) {
        console.log(key, value)
      }
    })
    effect(effectFn)
    p.set('key3', 'value3')
    expect(effectFn).toHaveBeenCalledTimes(2)
  })
  it('values()', () => {
    const m = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
    const p = reactive(m)
    const effectFn = jest.fn(() => {
      for (const value of p.values()) {
        console.log(value)
      }
    })
    effect(effectFn)
    p.set('key3', 'value3')
    expect(effectFn).toHaveBeenCalledTimes(2)
  })
  it('keys()', () => {
    const m = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
    const p = reactive(m)
    const effectFn = jest.fn(() => {
      for (const value of p.keys()) {
        console.log(value)
      }
    })
    effect(effectFn)
    p.set('key3', 'value3')
    expect(effectFn).toHaveBeenCalledTimes(2)
    // 修改值没有改变 map key 的长度，不应该触发响应
    p.set('key2', 'value4')
    expect(effectFn).toHaveBeenCalledTimes(2)
  })
})
