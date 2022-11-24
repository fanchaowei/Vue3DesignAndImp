// 任务队列
const queue = new Set()
// 一个标识，代表是否正在刷新任务队列
let isFlush = false
const p = Promise.resolve()

export default function queueJob(job: any) {
  // 将一个任务添加到缓冲队列中，并开始刷新队列
  queue.add(job)
  if (!isFlush) {
    isFlush = true
    p.then(() => {
      try {
        queue.forEach((job: any) => job())
      } finally {
        // 重置状态
        isFlush = true
        queue.clear()
      }
    })
  }
}
