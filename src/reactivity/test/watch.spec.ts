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

  // 避免因在 watch 内部编写请求/异步，多次触发该 watch，导致返回的结果紊乱。
  // 新增 onInvalidate
  it('onInvalidate', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)

    let finalData: any = 0
    let times = 0
    let res: any
    watch(obj, async (newValue: any, oldValue: any, onInvalidate: any) => {
      // 定义一个标志，代表当前副作用函数是否过期，false 代表没有过期
      let expired = false

      // 调用该特定函数，注册一个回调。
      onInvalidate(() => {
        // 将副作用函数设置为过期
        expired = true
      })

      // 模拟发送网络请求的操作
      await setTimeout(() => {
        if (!times) {
          res = 10
        } else {
          res = 20
        }
        times++
      }, 1000)

      // 只有副作用函数没有过期，才执行该后续操作。
      if (!expired) {
        finalData = res
      }
    })
    obj.foo++
    Promise.resolve().then(() => {
      obj.foo++
    })

    // TODO
    // 该测试存在报错，将 expect 放入异步中执行则会报错
    // setTimeout(() => {
    //   expect(finalData).toBe(20)
    // }, 0)
  })
})
