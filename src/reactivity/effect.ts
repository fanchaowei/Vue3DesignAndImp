import { triggerType } from '../shared/effect'
import { shouldTrack } from '../shared/reactive'

// 记录需要触发依赖的副作用函数
let activeEffect: any
// 为了避免嵌套的 effect 中，activeEffect 互相影响，所以增加一个 stack 来处理，当有新增的副作用函数就存入，执行完就推出。
const effectStack: any = []
// 存储 对象 -> 属性 -> 副作用函数 的桶。
// 为什么这里选择 WeakMap 而不是 Map？
// 因为被 Map 作为 key 的对象，即使没有其他引用，也不会被垃圾回收，可以通过 Map.keys() 获取到
// 而 WeakMap 的 key 在没有其他引用的时候会被垃圾回收，这样就节省了内存。因为没有其他引用意味着这个对象已经无用了
const bucket = new WeakMap()
// 拦截 for...in 等循环的一些操作，用于链接副作用函数所使用的枚举
export const ITERATE_KEY = Symbol()
// 提供给 Map 类型绑定副作用函数的枚举
export const MAP_KEY_ITERATE_KEY = Symbol()

// 依赖收集
export function track(target: any, key: any) {
  // 如果不存在副作用函数，则返回；如果 shouldTrack 标识为 false ，代表不需要依赖收集
  if (!activeEffect || !shouldTrack) return
  // 从桶中一次通过 target -> key 来获取对应的依赖，如果不存在则进行新建
  // 此时通过对象取出了对象对应的 Map 数组
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  // 通过对象属性取出对应的副作用函数数组
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  // 进行依赖收集
  deps.add(activeEffect)
  // 储存所有与当前副作用存在联系的依赖集合
  activeEffect.deps.push(deps)
}

// 触发依赖
export function trigger(target: any, key: any, type?: any, newVal?: any) {
  // 依次获取对应依赖
  const depsMap = bucket.get(target)
  if (!depsMap) return
  // 获取与属性 key 相关的副作用函数
  const effects = depsMap.get(key)
  // 执行依赖
  // effects && effects.forEach((fn) => fn())

  // 再创建一个 effectsToRun 变量并嵌套 effects 的原因是，effectFn 内存在 cleanup 删除，然后 fn() 又会重新添加导致无限循环
  // 而再嵌套一层则可避免这种问题。因为 effects 的删除和添加不影响 effectsToRun 这个新创建的变量。
  const effectsToRun = new Set()
  effects &&
    effects.forEach((effectFn: any) => {
      // 为了避免无限循环递归，判断当前执行的依赖是否等于目前进行依赖收集的副作用函数。不是才放入 effectsToRun 进行调用。
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })

  // 如果是数组，并且是添加操作，则将和数组 length 有关的副作用函数取出执行
  if (type === triggerType.ADD && Array.isArray(target)) {
    const lengthEffects = depsMap.get('length')
    lengthEffects &&
      lengthEffects.forEach((effectFn: any) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn)
        }
      })
  }
  // 如果 target 是数组并且修改了 length 属性
  if (Array.isArray(target) && key === 'length') {
    // 我们需要找出索引大于等于新设置的值的元素(因为这些值现在都是超出长度的值，会被删除)，取出它们相关的副作用函数，存入 effectsToTun 中等待执行
    depsMap.forEach((effects: any, key: any) => {
      if (key >= newVal) {
        effects.forEach((effectFn: any) => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
          }
        })
      }
    })
  }

  // 只有操作是添加或删除操作时，才触发相关的副作用函数
  if (
    type === triggerType.ADD ||
    type === triggerType.DELETE ||
    // 因为 Map 类型在循环时，键和值都应该存在响应式，所以添加这个判断
    (type === triggerType.SET &&
      Object.prototype.toString.call(target) === '[object Map]')
  ) {
    // 获取与枚举标识 ITERATE_KEY 相关的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY)
    // 将与枚举标识 ITERATE_KEY 关联的副作用函数也取出添加到 effectsToRun 中
    iterateEffects &&
      iterateEffects.forEach((effectFn: any) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn)
        }
      })
  }

  // 当是删除和增加操作，并且是 Map 类型时，额外取出 Map 枚举所链接的副作用函数
  if (
    (type === triggerType.ADD || type === triggerType.DELETE) &&
    Object.prototype.toString.call(target) === '[object Map]'
  ) {
    const iterateEffects = depsMap.get(MAP_KEY_ITERATE_KEY)
    iterateEffects &&
      iterateEffects.forEach((effectFn: any) => {
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn)
        }
      })
  }

  effectsToRun &&
    effectsToRun.forEach((effectFn: any) => {
      // 如果副作用函数存在调度器函数，则调用调度器，并将副作用函数作为参数传入
      if (effectFn.options.scheduler) {
        effectFn.options.scheduler(effectFn)
      } else {
        effectFn()
      }
    })
}

// 用于执行副作用函数，并通过执行副作用函数的过程触发 proxy，将副作用函数存入桶中
export function effect(fn: any, options: any = {}) {
  const effectFn: any = () => {
    // 如果因为修改了响应式数据触发依赖，则我们先对之前存的关于这个副作用函数的依赖全部删除，在触发 fn() 的时候会重新添加依赖
    // 这样的好处在于，当存在修改了响应式数据后，可能有一部分数据被隐藏无需触发响应式，清空之后重新添加依赖时，就可以不添加那部分被隐藏的依赖。
    cleanup(effectFn)
    // 当 effecFn 执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn
    // 将当前正在执行的 effectFn 加入栈中
    effectStack.push(effectFn)
    // 需要执行的函数可能存在返回值，将返回值存入 res 变量
    const res = fn()
    // 当前执行的 effectFn 已执行完毕，将它推出栈
    effectStack.pop()
    // 将标识赋值回栈内的上一个 effectFn ，这样就能防止嵌套 effect 引起的调用错乱
    activeEffect = effectStack[effectStack.length - 1]
    // return 副作用函数返回值
    return res
  }
  // 将 options 挂载到 effectFn上
  effectFn.options = options
  effectFn.deps = []
  if (!options.lazy) {
    // 不是懒执行的时候，直接执行
    effectFn()
    return
  }
  // 是懒执行则返回函数本身，方便用户后续直接调用
  return effectFn
}

function cleanup(effectFn: any) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    // 将 effectFn 从依赖集合中移除
    deps.delete(effectFn)
  }
  // 重置 effectFn.deps 数组
  effectFn.deps.length = 0
}
