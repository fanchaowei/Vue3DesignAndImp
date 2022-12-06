import { ref, shallowRef } from '../reactivity'
import { Text } from '../runtime-core'

// 该函数用于定义一个异步组件，接受一个异步组件加载器作为参数
export function defineAsyncComponent(options: any) {
  // options 可以是配置项，也可以是加载器
  if (typeof options === 'function') {
    // 如果是加载器，则给他变成配置项的形式
    options = {
      loader: options
    }
  }
  let { loader } = options

  // 用于存储异步加载的组件
  let InnerComp: any = null

  // 记录重试次数
  let retries = 0
  // 封装 load 函数来加载异步组件
  function load() {
    return loader().catch((err: any) => {
      if(options.onError) {
        // 如果用户传入 onError，则返回一个 promise
        return new Promise((resolve, reject) => {
          // 重试
          const retry = () => {
            resolve(load())
            retries++
          }
          // 失败
          const fail = () => reject(err)
          // 将两种方法作为参数，传给用户调用
          options.onError(retry, fail, retries)
        })
      } else {
        throw err
      }
    }) 
  }

  return {
    name: 'AsyncComponentWrapper',
    setup() {
      // 异步组件是否加载成功的判断标识
      const loaded = ref(false)
      // 错误对象 error，用于保存加载失败、超时等情况时，报出的错误。
      const error = shallowRef(null)
      // 是否加载中的标识
      const loading = ref(false)
      // 加载的定时器
      let loadingTimer: any = null

      if(options.delay) {
        // 如果配置了 delay ，则开启一个判断是否加载的定时器
        loadingTimer = setTimeout(() => {
          loading.value = true
        }, options.delay)
      } else {
        loading.value = true
      }


      // 调用封装的 load 来加载 loader
      load().then((c: any) => {
          // 如果异步组件加载成功，就赋值给 InnerComp ,并将标识设置为 true
          InnerComp = c
          loaded.value = true
        })
        // 捕获加载失败的错误
        .catch((e: any) => (error.value = e))
        .finally(() => {
          // 异步组件加载完成后，关闭加载组件
          loading.value = false,
          clearTimeout(loadingTimer)
        })

      // 超时的定时器
      let timer: any = null
      if (options.timeout) {
        // 如果配置项里设置了 timeout，则开启一个计时器
        timer = setTimeout(() => {
          // 超时后创建一个错误对象，并赋值给 error.value
          const err = new Error(
            `Async component timed out after ${options.timeout}ms.`
          )
          error.value = err
        }, options.timeout)
      }
      // 组件卸载时，销毁定时器
      onUnmounted(() => {
        clearTimeout(timer)
      })

      // 占位内容
      const placeholder = { type: Text, children: '' }

      return () => {
        if (loaded.value) {
          // 如果加载成功，则渲染组件
          return { type: InnerComp }
        } else if (error.value && options.errorComponent) {
          // 只有存在报错，并且用户传入了 errorComponent 时，才展示 error 组件
          return { type: options.errorComponent, props: { error: error.value } }
        } else if(loading.value && options.loadingComponent) {
          // 如果异步组件正在加载中，则输出 loading 组件
          return { type: options.loadingComponent }
        }
        return placeholder
      }
    }
  }
}

// 本模型暂未实现该生命周期，代替一下
function onUnmounted(arg0: () => void) {}
