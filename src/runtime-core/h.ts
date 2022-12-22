import { createVNode } from './VNode'

export function h(type: any, flags: any, props?: any, children?: any) {
  return createVNode(type, flags, props, children)
}
