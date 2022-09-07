import { triggerType } from '../shared/effect'

// 记录需要触发依赖的副作用函数
let activeEffect: any
// 为了避免嵌套的 effect 中，activeEffect 互相影响，所以增加一个 stack 来处理，当有新增的副作用函数就存入，执行完就推出。
const effectStack: any = []
// 存储 对象 -> 属性 -> 副作用函数 的桶。
const bucket = new WeakMap()
// 拦截 for...in 循环所使用的枚举
const ITERATE_KEY = Symbol()

export const reactive = (data: any) => {
  return new Proxy(data, {
    /**
     * 对象的基本语义 get
     * @param target 原对象
     * @param key 属性名
     * @param receiver 代理对象
     * @returns
     */
    get(target, key, receiver) {
      // 依赖收集
      track(target, key)
      // Reflect.get() 的第三个参数相当于指定 this 的指向，
      // 将代理对象指定为 this ，有利于解决一些属性内部的 this 指向了原对象，导致无法副作用函数执行的问题。
      return Reflect.get(target, key, receiver)
    },
    set(target, key, newVal, receiver) {
      // 判断是新增还是修改
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? triggerType.SET
        : triggerType.ADD

      const res = Reflect.set(target, key, newVal, receiver)
      // target[key] = newVal
      // 触发依赖
      trigger(target, key, type)
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
  })
}

// 依赖收集
export function track(target: any, key: any) {
  // 如果不存在副作用函数，则返回
  if (!activeEffect) return
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
export function trigger(target: any, key: any, type: any) {
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

  // 只有操作是添加操作时，才触发相关的副作用函数
  if (type === triggerType.ADD) {
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
