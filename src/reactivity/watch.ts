import { effect } from './effect'

/**
 *
 * @param source 响应式数据
 * @param cb 回调函数
 */
export function watch(source: any, cb: any, options: any = {}) {
  let getter
  if (typeof source === 'function') {
    // 是函数则说明用户传入了 getter 直接赋值
    getter = source
  } else {
    getter = () => traverse(source)
  }

  let oldValue: any, newValue: any
  // 将 scheduler 抽离成
  const job = () => {
    // 执行副作用函数获取新值
    newValue = effectFn()
    cb(newValue, oldValue)
    // 在执行 cb 后，新值就变成了旧值
    oldValue = newValue
  }

  const effectFn = effect(
    // 递归遍历去触发 source 的读取，建立连接
    getter,
    {
      lazy: true,
      scheduler: () => {
        if (options.flush === 'post') {
          const p = Promise.resolve()
          p.then(job)
        } else {
          job()
        }
      },
    }
  )
  if (options.immediate) {
    // 存在 immediate，则立即执行
    job()
  } else {
    // 第一次执行时，手动获取一次旧值
    oldValue = effectFn()
  }
}

// 递归遍历数据
// 遍历循环数据的目的，就是为了让数据内的每个元素都进行依赖收集和副作用函数建立连接
function traverse(value: any, seen = new Set()) {
  // 如果数据不是对象或为 null 或已经存在在 seen 中了，就返回
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  // 将遍历过的数据存入 seen 中，避免循环引用引起的死循环
  seen.add(value)
  // 循环遍历
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}
