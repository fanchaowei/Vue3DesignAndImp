import { effect } from '../effect'
import { reactive } from '../reactive'
import { proxyRefs, ref, toRefs } from '../ref'

describe('ref', () => {
  it('实现基础的 ref', () => {
    const refVal = ref(1)

    const effecFn = jest.fn(() => {
      console.log(refVal.value)
    })
    effect(effecFn)

    refVal.value = 2
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('toRefs 与 toRef，解决响应丢失的问题', () => {
    const obj = reactive({
      foo: '1',
      bar: '2',
    })
    // 不使用 toRefs 进行转化的话，通过展开运算符（...）所获取的数据是原始数据，而不是响应式数据,这就会造成响应式的丢失
    // 转换后，得到的属性都是 ref 嵌套过的，就解决了响应式丢失的问题了。
    const newObj = {
      ...toRefs(obj),
    }

    expect(newObj.foo.value).toBe('1')
    expect(newObj.bar.value).toBe('2')

    const effecFn = jest.fn(() => {
      console.log(newObj.foo.value)
    })
    effect(effecFn)
    newObj.foo.value = 3
    expect(effecFn).toHaveBeenCalledTimes(2)
  })
  it('自动脱 ref', () => {
    // 自动脱 ref ，指的是用户在 template 内使用；或对象属性访问时，可以不写 .value
    const obj = reactive({
      foo: '1',
      bar: '2',
    })
    // 通过 proxyRefs 代理
    // 在 setup 导出时，vue 会将到处的对象数据用 proxyRefs 处理一遍
    const newObj = proxyRefs({
      ...toRefs(obj),
    })
    expect(newObj.foo).toBe('1')
    expect(newObj.bar).toBe('2')
    newObj.foo = 100
    expect(newObj.foo).toBe(100)
  })
  it('reactive 也存在脱 ref 能力', () => {
    // vue 存在，这里未实现
    const count = ref(0)
    const obj = reactive({ count })
    // 上面相当于下面
    // const obj = reactive(proxyRefs({ count }))
    // expect(obj.count).toBe(0)
  })
})
