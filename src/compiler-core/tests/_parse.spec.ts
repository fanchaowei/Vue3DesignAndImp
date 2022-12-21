import { _parse } from '../src/parse'

describe('_Parse', () => {
  // 转换基础标签
  test('element', () => {
    const template = `<div><span></span></div>`
    const ast = _parse(template)
    expect(ast).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [],
          isSelfClosing: false,
          children: [
            {
              type: 'Element',
              tag: 'span',
              props: [],
              isSelfClosing: false,
              children: []
            }
          ]
        }
      ]
    })
  })
  // 转换带属性的标签
  test('has Attribute', () => {
    const template = `<div id="foo" v-show="display"></div>`
    const ast = _parse(template)
    expect(ast).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [
            // 属性
            { type: 'Attribute', name: 'id', value: 'foo' },
            { type: 'Attribute', name: 'v-show', value: 'display' }
          ],
          isSelfClosing: false,
          children: []
        }
      ]
    })
    const template1 = `<div :id="dynamicId" @click="handler" v-on:mousedown="onMouseDown" ></div>`
    const ast1 = _parse(template1)
    expect(ast1).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [
            // 属性
            { type: 'Attribute', name: ':id', value: 'dynamicId' },
            { type: 'Attribute', name: '@click', value: 'handler' },
            { type: 'Attribute', name: 'v-on:mousedown', value: 'onMouseDown' }
          ],
          isSelfClosing: false,
          children: []
        }
      ]
    })
  })
  // 解析文本
  test('text', () => {
    const template = '<div>Text</div>'
    const ast = _parse(template)
    expect(ast).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [],
          isSelfClosing: false,
          children: [{ type: 'Text', content: 'Text' }]
        }
      ]
    })
  })
  // 解码命名字符
  test('decode text', () => {
    const template = '<div>Text&ltcc</div>'
    const ast = _parse(template)
    expect(ast).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [],
          isSelfClosing: false,
          children: [{ type: 'Text', content: 'Text<cc' }]
        }
      ]
    })
  })
  // 解码数字字符引用
  test('decode number test', () => {
    const template = '<div>Text - &#65; - &#x33;</div>'
    const ast = _parse(template)
    expect(ast).toStrictEqual({
      type: 'Root',
      children: [
        {
          type: 'Element',
          tag: 'div',
          props: [],
          isSelfClosing: false,
          children: [{ type: 'Text', content: 'Text - A - 3' }]
        }
      ]
    })
  })
})
