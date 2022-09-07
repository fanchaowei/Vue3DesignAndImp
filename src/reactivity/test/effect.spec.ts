import { effect, reactive } from '../effect'

describe('effect', () => {
  it('happy path', () => {
    expect(1 + 1).toBe(2)
  })

  it('lazy', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)

    const effectFn = effect(
      () => {
        return obj.foo + obj.bar
      },
      {
        lazy: true,
      }
    )
    expect(effectFn()).toBe(3)
  })

  /**
   * 响应系统需要应该拦截一切操作，以便数据触发时能正确的响应。
   * 可能的读取操作有如下三种：
   * 1. 访问属性：obj.foo
   * 2. 判断对象或原型上是否存在给定的 key ：key in obj
   * 3. 使用 for...in 循环遍历对象：for (const key in obj) {}
   */
  //拦截 in 操作符
  it('in Operators', () => {
    const data = { bar: 2 }
    const obj = reactive(data)

    let haveFoo = false
    const effecFn = effect(() => {
      haveFoo = 'foo' in obj
    })
    expect(haveFoo).toBe(false)
    obj.foo = 1
    expect(haveFoo).toBe(true)
  })

  // 拦截 for...in 循环
  it('for...in', () => {
    const data = { foo: 1 }
    const obj = reactive(data)
    let times = 0

    const effectFn = effect(() => {
      for (const key in obj) {
        times++
      }
    })
    expect(times).toBe(1)
    obj.bar = 2
    expect(times).toBe(3)
  })

  //
  it('修改对象属性，for...in 副作用函数无需执行', () => {
    const data = { foo: 1 }
    const obj = reactive(data)
    let times = 0

    const effectFn = effect(() => {
      for (const key in obj) {
        times++
      }
    })
    expect(times).toBe(1)
    obj.foo = 2
    expect(times).toBe(1)
  })
})
