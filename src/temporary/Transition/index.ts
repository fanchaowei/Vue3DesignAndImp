export const Transition = {
  name: 'Transition',
  setup(props: any, { slots }: any) {
    return () => {
      const innerVNode = slots.default()

      innerVNode.transition = {
        beforeEnter(el: any) {
          // 设置初始状态和运动状态
          el.classList.add('enter-from')
          el.classList.add('enter-active')
        },
        enter(el: any) {
          // 下一帧修改
          nextFrame(() => {
            // 移除初始状态，添加结束状态
            el.classList.remove('enter-from')
            el.classList.add('enter-to')

            // 监听 transitionend 事件，完成收尾工作
            el.addEventListener('transitionend', () => {
              el.classList.remove('enter-to')
              el.classList.remove('enter-active')
            })
          })
        },
        leave(el: any, performRemove: any) {
          el.classList.add('leave-from')
          el.classList.add('leave-active')

          // 强制 reflow，使得初始状态生效
          document.body.offsetHeight

          nextFrame(() => {
            el.classList.remove('leave-from')
            el.classList.add('leave-to')

            el.addEventListener('transitionend', () => {
              el.classList.remove('leave-to')
              el.classList.remove('leave-active')
              // 卸载
              performRemove()
            })
          })
        }
      }

      return innerVNode
    }
  }
}

function nextFrame(fn: Function) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fn()
    })
  })
}
