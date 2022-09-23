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
  it('for...in 遍历数组', () => {
    const arr = reactive(['foo'])

    const effecFn = jest.fn(() => {
      for (const key in arr) {
        console.log(key)
      }
    })

    effect(effecFn)

    expect(effecFn).toHaveBeenCalledTimes(1)
    // TODO 根据 5.7.4 增加了对 push 等方法的重写后，无法使用 push。
    // 当前找到原因是因为重写后 push 不会和 length 建立联系。
    // 在每次执行副作用函数的时候会执行 cleanup() 来清除副作用函数。
    // 而由于是因为 push 触发的副作用函数，shouldTrack 为 false，push 现在不会添加副作用函数的链接
    // 故造成了执行完 push 后，后续响应式丢失。
    // arr.push('bar')
    arr[2] = 'baz'
    expect(effecFn).toHaveBeenCalledTimes(2)
    arr.length = 0
    expect(effecFn).toHaveBeenCalledTimes(3)
  })
  it('includes', () => {
    const obj = {}
    const arr = reactive([obj])

    // 如果不处理，该值会为 false 。这是因为 reactive 会深度的为内部对象属性新建代理对象。
    // 这就导致，arr.includes(arr[0])，创建了两个 obj 的代理对象，两个代理对象理所应当是不相同。
    expect(arr.includes(arr[0])).toBe(true)
    // 将原始对象输入查找
    expect(arr.includes(obj)).toBe(true)
  })
  it('push', () => {
    const arr = reactive(['foo'])
    effect(() => {
      arr.push('bar')
    })
    effect(() => {
      arr.push('baz')
    })
    // 处理 push 之后，防止多个副作用函数无限互相调用
    expect(arr[1]).toBe('bar')
    expect(arr[2]).toBe('baz')
  })
})
