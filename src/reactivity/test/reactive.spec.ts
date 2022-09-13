import {
  reactive,
  shallowReactive,
  readonly,
  shallowReadOnly,
} from '../reactive'
import { effect } from '../effect'

describe('reactive', () => {
  it('浅响应与深响应', () => {
    const obj = reactive({
      foo: {
        bar: 1,
      },
    })
    const obj1 = shallowReactive({
      baz: 1,
      foo: {
        bar: 1,
      },
    })
    let times = 0

    const effecFn = effect(() => {
      console.log(obj.foo.bar)
      times++
    })

    const effecFn1 = effect(() => {
      console.log(obj1.foo.bar)
      times++
    })

    // 深响应
    obj.foo.bar = 2
    expect(times).toBe(3)
    // 浅响应
    obj1.foo.bar = 2
    expect(times).toBe(3)
    obj1.baz = 2
    expect(times).toBe(3)
  })

  it('深只读和浅只读', () => {
    // 深只读
    const obj = readonly({
      baz: 1,
      foo: {
        bar: 1,
      },
    })
    obj.baz = 2
    obj.foo.bar = 2
    expect(obj.baz).toBe(1)
    expect(obj.foo.bar).toBe(1)

    // 浅只读
    const obj1 = shallowReadOnly({
      baz: 1,
      foo: {
        bar: 1,
      },
    })
    obj1.baz = 2
    obj1.foo.bar = 2
    expect(obj1.baz).toBe(1)
    expect(obj1.foo.bar).toBe(2)
  })

  /**
   * 代理数组
   * 下列一系列单元测试都是针对数组的
   */
  it('array', () => {
    const arr = reactive(['foo'])

    // 读取
    const effecFn = jest.fn(() => {
      console.log(arr[0])
    })
    effect(effecFn)
    arr[0] = 'bar'
    expect(effecFn).toHaveBeenCalledTimes(2)

    // 修改数组的长度
    arr.length = 0
    expect(effecFn).toHaveBeenCalledTimes(3)
  })
  it('对新的索引值进行赋值', () => {
    const arr = reactive(['foo'])

    const effecFn = jest.fn(() => {
      console.log(arr.length)
    })

    effect(effecFn)

    arr[1] = 'bar'
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
})
