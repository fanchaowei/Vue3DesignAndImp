import { ref } from "../reactivity";
import { Text } from "../runtime-core";

// 该函数用于定义一个异步组件，接受一个异步组件加载器作为参数
export function defineAsyncComponent(loader: any) {
  // 用于存储异步加载的组件
  let InnerComp: any = null
  return {
    name: 'AsyncComponentWrapper',
    setup() {
      // 异步组件是否加载成功的判断标识
      const loaded = ref(false)
      loader().then((c:any) => {
        // 如果异步组件加载成功，就赋值给 InnerComp ,并将标识设置为 true
        InnerComp = c
        loaded.value = true
      })
      return () => {
        // 如果标识为 true ，则返回该数组的渲染函数，否则渲染一个占位内容
        return loaded.value ? { type: InnerComp } : { type: Text, children: '加载中或加载失败' }
      }
    }
  }
}