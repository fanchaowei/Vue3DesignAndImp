import { reactive } from './reactive'

export function ref(val: any) {
  // 将原始值使用对象嵌套
  const wrapper = {
    value: val,
  }

  // 在 wrapper 对象上定义一个 __v_isRef 属性，并这只为 true
  // 该属性的作用是用于区分是 ref 还是 reactive
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  })

  // 使用 reactive 变为响应式
  return reactive(wrapper)
}

// 将响应式对象的属性转化为 ref
// obj 为响应式对象
export function toRef(obj: any, key: any) {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(value) {
      obj[key] = value
    },
  }
  // 在 wrapper 对象上定义一个 __v_isRef 属性，并这只为 true
  // 该属性的作用是用于区分是 ref 还是 reactive
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  })
  return wrapper
}
// 将整个响应式对象内的属性都转化为 ref
export function toRefs(obj: any) {
  const ret: any = {}
  for (const key in obj) {
    // 循环响应式对象并调用 toRef 依次转化
    ret[key] = toRef(obj, key)
  }
  return ret
}
