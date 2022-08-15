import { reactive, effect } from '../../lib/vue3-design-and-imp.esm.js'

// const data = { ok: true, text: 'hello world' }
// const data = { foo: true, bar: true }
const data = { foo: 1, bar: 2 }

const obj = (window.obj = reactive(data))

// effect(() => {
//   console.log('执行函数')
//   document.body.innerText = obj.ok ? obj.text : 'not'
// })

// let temp1, temp2
// effect(() => {
//   console.log('effectFn1 执行')
//   effect(() => {
//     console.log('effectFn2 执行')
//     temp2 = obj.bar
//   })
//   temp1 = obj.foo
// })

// effect(
//   () => {
//     console.log(obj.foo)
//   },
//   // options
//   {
//     // scheduler 是一个调度器函数，它的意义在于用户可以传入特定的函数进行执行，使响应式系统有可调度性
//     scheduler(fn) {
//       jobQueue.add(fn)
//       flushJob()
//     },
//   }
// )
// obj.foo++
// obj.foo++

const effectFn = effect(
  () => {
    return obj.foo + obj.bar
  },
  {
    lazy: true,
  }
)
console.log('@@@', effectFn())
