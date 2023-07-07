import { effect, track, trigger } from './effect'

export function computed(getter: any) {
  // value 用来缓存上一次计算的值
  let value: any
  // dirty 标志，用来标识是否需要重新计算赋值，dirty 为 true 则为“脏”，需要重新计算结果
  let dirty = true

  // 创建一个懒加载的 effect。
  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      if (!dirty) {
        // 当 getter 内的数据发生变动时，触发该 scheduler ，将 dirty 设置为 true 。
        dirty = true
        // 当计算属性依赖的响应式数据变化时，手动调用 trigger 函数触发响应
        // 为什么我们要手动触发呢？因为当发生 effect 多层嵌套的时候，当计算属性变化，外层的 effect 不会被内层的 effect 收集到，所以我们需要手动触发。
        trigger(obj, 'value')
      }
    },
  })
  const obj = {
    get value() {
      if (dirty) {
        // 重新计算数据并赋值给缓存变量，将 dirty 改为 false
        value = effectFn()
        dirty = false
      }
      // 当读取 value 时，手动触发 track 函数进行追踪
      track(obj, 'value')
      return value
    },
  }
  // 返回 obj 对象，obj 对象当调用 obj.value 时，就会执行 effectFn() 函数获取返回值
  return obj
}
