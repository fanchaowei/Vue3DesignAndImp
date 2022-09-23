function createReactive(obj: any) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'size') {
        return Reflect.get(target, key, target)
      }
      return target[key].bind(target)
    },
  })
}

// 存储原始对象到代理对象的映射，作用在于防止对象内还存在对象属性的情况下，导致内部的对象属性创建了多个代理对象
const reactiveMap = new Map()

export const reactive = (data: any) => {
  // 查看是否已经存在对应的代理对象了
  const existionProxy = reactiveMap.get(data)
  // 存在就输出该代理对象
  if (existionProxy) {
    return existionProxy
  }

  const proxy = createReactive(data)

  // 将创建的代理对象存入 Map 中，供后续查找使用
  reactiveMap.set(data, proxy)
  return proxy
}
