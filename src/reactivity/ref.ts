import { reactive, shallowReactive } from './reactive'

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

export function shallowRef(val: any) {
  const wrapper = {
    value: val,
  } 

  Object.defineProperty(wrapper, '__v_isRef', {
    value: true
  })
  return shallowReactive(wrapper)
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

// 对是 ref 的响应式数据做脱 ref 处理
export function proxyRefs(target: any) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const value: any = Reflect.get(target, key, receiver)

      return value.__v_isRef ? value.value : value
    },
    set(target, key, newValue, receiver) {
      const value = target[key]
      if (value.__v_isRef) {
        // 是 ref 则设置 .value
        value.value = newValue
        return true
      }
      return Reflect.set(target, key, newValue, receiver)
    },
  })
}
