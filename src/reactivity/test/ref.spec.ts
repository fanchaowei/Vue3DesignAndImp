import { effect } from '../effect'
import { reactive } from '../reactive'
import { ref, toRefs } from '../ref'

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
})
