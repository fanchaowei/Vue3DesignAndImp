import { ref } from "../reactivity";
import { Text } from "../runtime-core";

// 该函数用于定义一个异步组件，接受一个异步组件加载器作为参数
export function defineAsyncComponent(options: any) {
  // options 可以是配置项，也可以是加载器
  if(typeof options === 'function') {
    // 如果是加载器，则给他变成配置项的形式
    options = {
      loader: options
    }
  }

  let { loader } = options

  // 用于存储异步加载的组件
  let InnerComp: any = null
  return {
    name: 'AsyncComponentWrapper',
    setup() {
      // 异步组件是否加载成功的判断标识
      const loaded = ref(false)
      // 是否超时，true 为超时
      const timeout = ref(false)
      loader().then((c:any) => {
        // 如果异步组件加载成功，就赋值给 InnerComp ,并将标识设置为 true
        InnerComp = c
        loaded.value = true
      })

      let timer:any = null
      if(options.timeout) {
      // 如果配置项里设置了 timeout，则开启一个计时器
        timer = setTimeout(() => {
          // 超时后将 timeout 设置为 true
          timeout.value = true
        }, options.timeout)
      }
      // 组件卸载时，销毁定时器
      onUnmounted(() => {
        clearTimeout(timer)
      })

      // 占位内容
      const placeholder = { type: Text, children: '' }

      return () => {
        if(loaded.value) {
          // 如果加载成功，则渲染组件
          return { type: InnerComp }
        } else if(timeout.value) {
          // 如果加载超时，并且用户指定了 error 组件，则渲染该组件，否则渲染占位内容
          return options.errorComponent ? { type: options.errorComponent }: placeholder
        }
      }
    }
  }
}

// 本模型暂未实现该生命周期，代替一下
function onUnmounted(arg0: () => void) {
}
