import { reactive } from '../reactive'
import { effect } from '../effect'
import { computed } from '../computed'
describe('computed', () => {
  it('happy path', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)

    const sumRes = computed(() => obj.foo + obj.bar)

    expect(sumRes.value).toBe(3)
  })

  it('cache value', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)

    const sumRes = computed(() => obj.foo + obj.bar)

    expect(sumRes.value).toBe(3)
    expect(sumRes.value).toBe(3)
    expect(sumRes.value).toBe(3)
    obj.bar++
    expect(sumRes.value).toBe(4)
  })

  it('nested', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)

    const sumRes = computed(() => obj.foo + obj.bar)

    const effectFn = jest.fn(() => {
      console.log(sumRes.value)
    })

    effect(effectFn)

    obj.foo++
    expect(sumRes.value).toBe(4)
    expect(effectFn).toHaveBeenCalledTimes(2)
  })
})
