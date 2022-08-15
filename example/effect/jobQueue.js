// 定义一个任务队列
const jobQueue = new Set()
const p = Promise.resolve()

let isFlushing = false
// 这类似一个防抖
function flushJob() {
  if (isFlushing) return
  isFlushing = true
  p.then(() => {
    // 等所有同步操作完再执行
    jobQueue.forEach((job) => job())
  }).finally(() => {
    isFlushing = false
  })
}
