// 是否允许依赖收集
export let shouldTrack = true

// 改写的方法
export const arrayInstrumentations: {
  [propName: string]: any
} = {}
// 将需要改写的 api 统一添加到 arrayInstrumentations 内
;['includes', 'indexOf', 'lastIndexOf'].forEach((method: any) => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args: any): any {
    // this 是代理对象
    const _this: any = this
    // 现在 代理对象中查找是否存在结果
    let res = originMethod.apply(_this, args)
    // 如果代理对象中找不到结果，就从原始对象中找结果
    if (!res) {
      res = originMethod.apply(_this.raw, args)
    }
    // 返回结果
    return res
  }
})
;['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method: any) => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args: any): any {
    const _this = this
    // 执行这些 api 方法时，不进行依赖收集
    shouldTrack = false
    let res = originMethod.apply(_this, args)
    shouldTrack = true
    return res
  }
})
