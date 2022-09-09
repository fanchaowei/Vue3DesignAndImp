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
})
