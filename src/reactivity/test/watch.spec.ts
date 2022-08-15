import { reactive } from '../effect'
import { watch } from '../watch'

describe('watch', () => {
  it('happy path', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)
    const fn = jest.fn(() => {
      console.log('数据改变')
    })
    watch(obj, fn)
    obj.foo++
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('getter', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)
    const fn = jest.fn(() => {
      console.log('数据改变')
    })
    watch(
      // 传入一个 getter 函数
      () => obj.foo,
      fn
    )
    obj.foo++
    expect(fn).toHaveBeenCalledTimes(1)
    obj.bar++
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('getOldValAndNewVal', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)
    watch(
      () => obj.foo,
      (newVal: any, oldVal: any) => {
        console.log(newVal, oldVal)
      }
    )

    obj.foo++
    obj.foo++
  })

  it('immediate', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)
    const fn = jest.fn(() => {
      console.log('变化了')
    })
    watch(obj, fn, {
      immediate: true,
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('flush', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)
    const fn = jest.fn(() => {
      console.log('变化了')
    })
    watch(obj, fn, {
      // 当值为 flush 的值为 post 时，需要将副作用函数放入一个微任务队列中
      // 目前无法模拟 flush 为 pre 时的操作。
      flush: 'post',
    })
  })
})
