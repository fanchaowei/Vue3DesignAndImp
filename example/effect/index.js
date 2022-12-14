// 记录需要触发依赖的副作用函数
let activeEffect
// 为了避免嵌套的 effect 中，activeEffect 互相影响，所以增加一个 stack 来处理，当有新增的副作用函数就存入，执行完就推出。
const effectStack = []

const bucket = new WeakMap()

const reactive = (data) => {
  return new Proxy(data, {
    get(target, key) {
      // 依赖收集
      track(target, key)
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      trigger(target, key)
      return true
    },
  })
}

function track(target, key) {
  // 如果不存在副作用函数，则返回
  if (!activeEffect) return
  // 从桶中一次通过 target -> key 来获取对应的依赖，如果不存在则进行新建
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  // 进行依赖收集
  deps.add(activeEffect)
  // 储存所有与当前副作用存在联系的依赖集合
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  // 依次获取对应依赖
  const depsMap = bucket.get(target)
  const effects = depsMap.get(key)
  // 执行依赖
  // effects && effects.forEach((fn) => fn())

  // 再创建一个 effectsToRun 变量并嵌套 effects 的原因是，effectFn 内存在 cleanup 删除，然后 fn() 又会重新添加导致无限循环
  // 而再嵌套一层则可避免这种问题。因为 effects 的删除和添加不影响 effectsToRun 这个新创建的变量。
  const effectsToRun = new Set()
  effects.forEach((effectFn) => {
    // 为了避免无限循环递归，判断当前执行的依赖是否等于目前进行依赖收集的副作用函数。不是才放入 effectsToRun 进行调用。
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
  effectsToRun.forEach((effectFn) => {
    // 如果副作用函数存在调度器函数，则调用调度器，并将副作用函数作为参数传入
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

function effect(fn, options = {}) {
  const effectFn = () => {
    // 如果因为修改了响应式数据触发依赖，则我们先对之前存的关于这个副作用函数的依赖全部删除，在触发 fn() 的时候会重新添加依赖
    // 这样的好处在于，当存在修改了响应式数据后，可能有一部分数据被隐藏无需触发响应式，清空之后重新添加依赖时，就可以不添加那部分被隐藏的依赖。
    cleanup(effectFn)
    // 当 effecFn 执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn
    // 将当前正在执行的 effectFn 加入栈中
    effectStack.push(effectFn)
    fn()
    // 当前执行的 effectFn 已执行完毕，将它推出栈
    effectStack.pop()
    // 将标识赋值回栈内的上一个 effectFn ，这样就能防止嵌套 effect 引起的调用错乱
    activeEffect = effectStack[effectStack.length - 1]
  }
  // 将 options 挂载到 effectFn上
  effectFn.options = options
  effectFn.deps = []
  effectFn()
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    // 将 effectFn 从依赖集合中移除
    deps.delete(effectFn)
  }
  // 重置 effectFn.deps 数组
  effectFn.deps.length = 0
}
