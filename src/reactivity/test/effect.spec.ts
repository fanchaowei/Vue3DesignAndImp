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
})
