import {
  ITERATE_KEY,
  MAP_KEY_ITERATE_KEY,
  track,
  trigger,
} from '../reactivity/effect'
import { reactive } from '../reactivity/proxyMapAndSet'
import { triggerType } from './effect'

// 重写一些方法
export const mutableInstrumentations: any = {
  add(key: any) {
    return mutableInstrumentationsCommonHandle(this, 'add', key)
  },
  delete(key: any) {
    return mutableInstrumentationsCommonHandle(this, 'delete', key)
  },
  get(key: any) {
    const _this = this
    const target = _this.raw
    // 是否存在这个 key
    const had = target.has(key)
    if (had) {
      track(target, key)
      // 如果存在则取出返回
      const res = target.get(key)
      // 如果属性值是对象，则返回响应式对象(这里未考虑浅响应，可自行添加)
      return typeof res === 'object' ? reactive(res) : res
    }
  },
  set(key: any, value: any) {
    const _this = this
    const target = _this.raw
    // 获取旧值
    const oldVal = target.get(key)
    // 是否存在该值
    const had = target.has(key)
    // 避免 value 是响应式数据
    const rawValue = value.raw || value
    target.set(key, rawValue)
    if (!had) {
      // 不存在则依赖触发类型是添加
      trigger(target, key, triggerType.ADD)
    } else if (oldVal !== value || (oldVal === oldVal && value === value)) {
      // 如果新值与旧值不同并且新旧值都不是 NaN ，则依赖类型是修改
      trigger(target, key, triggerType.SET)
    }
  },
  forEach(callback: any, thisArg: any) {
    const target = this.raw
    // 与 ITERATE_KEY 建立响应式联系
    track(target, ITERATE_KEY)
    target.forEach((v: any, k: any) => {
      // 将参数都调用 wrap 方法，这样就能实现遍历时，对于属性的深度响应
      callback.call(thisArg, wrap(v), wrap(k), this)
    })
  },
  // 可迭代协议
  [Symbol.iterator]: iterationMethod,
  entries: iterationMethod,
  values() {
    return keysOrValuesIterationMethod(this, false)
  },
  keys() {
    return keysOrValuesIterationMethod(this, true)
  },
}

// 处理 values()，与处理迭代器大同小异
function keysOrValuesIterationMethod(_this: any, isKey: boolean) {
  const target = _this.raw

  let itr: any
  if (isKey) {
    itr = target.keys()
    track(target, MAP_KEY_ITERATE_KEY)
  } else {
    itr = target.values()
    // 调用 track 函数建立响应联系
    track(target, ITERATE_KEY)
  }

  return {
    next() {
      const { value, done } = itr.next()
      return {
        value: wrap(value),
        done,
      }
    },
    [Symbol.iterator]() {
      return this
    },
  }
}

function iterationMethod(this: any) {
  const target = this.raw

  // 获取原始迭代器的方法
  const itr = target[Symbol.iterator]()

  // 调用 track 函数建立响应联系
  track(target, ITERATE_KEY)

  return {
    // 迭代器协议（对象具有 next()）
    next() {
      const { value, done } = itr.next()
      // 将 next 输出的属性进行 reactive 嵌套
      return {
        value: value ? [wrap(value[0]), wrap(value[1])] : value,
        done,
      }
    },
    // 可迭代协议（对象实现 Symbol.iterator 方法）
    [Symbol.iterator]() {
      return this
    },
  }
}

// 创建一个用于判断参数的类型，并嵌套 reactive 的方法
const wrap = (val: any) =>
  typeof val === 'object' && val !== null ? reactive(val) : val

function mutableInstrumentationsCommonHandle(
  _this: any,
  methodName: string,
  key: any
) {
  // 获取原数据
  const target = _this.raw

  // 是否在 Set 中已经存在该值
  const hasKey = target.has(key)
  // 通过原数据执行对应方法
  const res = target[methodName](key)

  // 原 target 不存在该值的情况下，才触发依赖，提升性能
  if (!hasKey) {
    // 依赖触发, 类型为 ADD 或 DELETE 时 , trigger 会将 ITERATE_KEY 枚举相关联的副作用函数一并取出执行
    // 这样就解决了 Set 的 add 和 delete 操作会隐式访问 size 的问题
    trigger(target, key, triggerType.ADD)
  } else if (hasKey && methodName.toUpperCase() === triggerType.DELETE) {
    // delete 触发依赖
    trigger(target, key, triggerType.DELETE)
  }
  // 返回结果
  return res
}
