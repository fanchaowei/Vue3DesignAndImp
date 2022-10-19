import { createApp, Fragment } from '../../lib/vue3-design-and-imp.esm.js'

// 移动
// let vnode = {
//   type: 'div',
//   children: [
//     { type: 'p', children: '1', key: 1 },
//     { type: 'div', children: '2', key: 2 },
//     { type: 'span', children: '3', key: 3 },
//   ],
// }
// let newVNode = {
//   type: 'div',
//   children: [
//     { type: 'div', children: '5', key: 2 },
//     { type: 'span', children: '6', key: 3 },
//     { type: 'p', children: '4', key: 1 },
//   ],
// }

// 添加
// let vnode = {
//   type: 'div',
//   children: [
//     { type: 'p', children: '1', key: 1 },
//     { type: 'div', children: '2', key: 2 },
//     { type: 'span', children: '3', key: 3 },
//   ],
// }
// let newVNode = {
//   type: 'div',
//   children: [
//     { type: 'div', children: '5', key: 2 },
//     { type: 'span', children: '6', key: 3 },
//     { type: 'span', children: '7', key: 4 },
//     { type: 'p', children: '4', key: 1 },
//   ],
// }

// 删除
// let vnode = {
//   type: 'div',
//   children: [
//     { type: 'p', children: '1', key: 1 },
//     { type: 'div', children: '2', key: 2 },
//     { type: 'span', children: '3', key: 3 },
//   ],
// }
// let newVNode = {
//   type: 'div',
//   children: [
//     { type: 'div', children: '5', key: 2 },
//     { type: 'p', children: '4', key: 1 },
//   ],
// }

let vnode = {
  type: 'div',
  children: [
    { type: 'p', children: '1', key: 1 },
    { type: 'p', children: '2', key: 2 },
    { type: 'p', children: '3', key: 3 },
    { type: 'p', children: '4', key: 4 },
  ],
}

let newVNode = {
  type: 'div',
  children: [
    { type: 'p', children: '2', key: 2 },
    { type: 'p', children: '4', key: 4 },
    { type: 'p', children: '1', key: 1 },
    { type: 'p', children: '3', key: 3 },
  ],
}

createApp(vnode, document.querySelector('#app'))
setTimeout(() => {
  createApp(newVNode, document.querySelector('#app'))
}, 3000)
