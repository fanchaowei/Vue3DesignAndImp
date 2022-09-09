import { triggerType } from '../shared/effect'
import { track, trigger, ITERATE_KEY } from './effect'

/**
 * 创建响应式数据
 * @param obj 需要代理的对象
 * @param isShallow 是否浅响应
 * @param isReadOnly 是否只读
 * @returns
 */
function createReactive(obj: any, isShallow = false, isReadOnly = false) {
  return new Proxy(obj, {
    /**
     * 对象的基本语义 get
     * @param target 原对象
     * @param key 属性名
     * @param receiver 代理对象
     * @returns
     */
    get(target, key, receiver): any {
      // 代理对象可通过 raw 属性访问原始对象
      if (key === 'raw') {
        return target
      }
      // Reflect.get() 的第三个参数相当于指定 this 的指向，
      // 将代理对象指定为 this ，有利于解决一些属性内部的 this 指向了原对象，导致无法副作用函数执行的问题。
      let res = Reflect.get(target, key, receiver)

      // 非只读的情况下，才需要建立响应式联系
      if (!isReadOnly) {
        // 依赖收集
        track(target, key)
      }

      // 如果是浅响应则直接返回原始值
      if (isShallow) {
        return res
      }

      if (typeof res === 'object' && res !== null) {
        // 如果获取的值是一个对象，则再将该值包装成响应式数据
        // 判断是否只读，是的话就用 readonly 包装后续值
        return isReadOnly ? readonly(res) : reactive(res)
      }
      return res
    },
    set(target, key: any, newVal, receiver) {
      // 获取旧值
      const oldVal = target[key]

      if (isReadOnly) {
        console.warn(`属性 ${key} 是只读的`)
        return true
      }

      // 判断是新增还是修改
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? triggerType.SET
        : triggerType.ADD

      const res = Reflect.set(target, key, newVal, receiver)

      // 判断 receiver 是否是 target 的代理对象
      // receiver.raw 可以拿到原始数据，这里为了避免是从 target 的原型对象可能也是响应式对象，造成触发多次响应。
      if (target === receiver.raw) {
        // 后面的新旧值和自己判断是否相等，是避免新旧值是 NaN，因为 NaN 在任何情况下都是 NaN !== NaN
        if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
          // 触发依赖
          trigger(target, key, type)
        }
      }
      return res
    },
    // 是否含有某个属性，拦截 in 修饰符
    has(target, key) {
      // 依赖收集
      track(target, key)
      return Reflect.has(target, key)
    },
    // 拦截 for...in 循环
    ownKeys(target) {
      // 因为 ownKey 只能拿到整个 target 对象，而不能拿到具体的 key 属性，所以使用一个枚举标识来绑定
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    // 删除拦截
    deleteProperty(target, key: any) {
      if (isReadOnly) {
        console.warn(`属性 ${key} 是只读的`)
        return true
      }

      // 查看对象中是不是存在这个属性
      const hasKey = Object.prototype.hasOwnProperty.call(target, key)
      // 删除属性
      const res = Reflect.deleteProperty(target, key)

      if (hasKey && res) {
        // 只有删除自己的属性成功，才触发依赖
        trigger(target, key, triggerType.DELETE)
      }
      return res
    },
  })
}

export const reactive = (data: any) => {
  return createReactive(data)
}

export const shallowReactive = (data: any) => {
  return createReactive(data, true)
}

export const readonly = (data: any) => {
  return createReactive(data, false, true)
}

export const shallowReadOnly = (data: any) => {
  return createReactive(data, true, true)
}
