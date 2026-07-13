"use strict";
/**
 * 函数的常规定义
 */
export type AnyFunc = (...args: any[]) => any;

/**
 * 空数组
 */
export type EmptyArray = never[];

/**
 * 空对象
 */
export type EmptyObject = Record<string | number | symbol, never>;

/**
 * 让对象 T 中的子属性变成 “不固定” (可自定义/可扩展未定义子属性)
 * @description
 * - 作用：将一个类型定义中，子属性的定义变成不固定的，允许自由拓展的
 * - 目的：兼容老代码，让一些老代码在进行类型定义的时候，允许一些未定义的属性不报错
 * @example
 * 示例：
 * interface Demo {
 *   a: string;
 *   b: number;
 * }
 * const demo: Unfixedify<Demo> = {
 *   a: 'abcdefg',
 *   b: 2,
 *   c: 3, // 允许写上额外新增的自定义属性 c ，即便 c 在 Demo 中没定义过
 * };
 */
export type Unfixedify<T> = T & {
  [k: string | number | symbol]: any;
  // [k: string]: any;
  // [k: number]: any;
  // [k: symbol]: any;
};

/**
 * 让对象 T 中的子属性变成“宽松”(可选&可自定义)
 * @description
 * - 1.子属性可选的
 * - 2.子属性可自定义，即 { [k: string | number | symbol]: any }
 *
 * 可用于“一些对象可能长得像某个类型时，但子属性又不局限于这个类型定义”的场景
 * @example
 * 示例：
 * interface Demo {
 *   a: string;
 *   b: number;
 * }
 * const demo: Loosify<Demo> = {
 *   a: 'abcdefg',
 *   b: 2,
 *   c: 3, // 允许写上额外新增的自定义属性 c ，即便 c 在 Demo 中没定义过
 * };
 * console.log(demo?.a); // demo 中所有子属性变成“可选”，即不一定都存在
 */
export type Loosify<T> = T extends AnyFunc
  ? T
  : T extends Record<any, any>
    ? Unfixedify<Partial<T>>
    : T;

/**
 * 获取函数的第一个参数类型
 * @example
 * function abc(p1: string, p2: number);
 * type P1 = FirstParam<typeof abc>; // string
 */
export type FirstParam<T extends AnyFunc> = T extends (first: infer FirstP, ...args: any[]) => any
  ? FirstP
  : never;

/**
 * 获取函数除第一个参数外的剩余参数类型
 *
 * @example
 * function abc(p1: string, p2: number, p3: boolean);
 * type RestArgs = RestParams<typeof abc>; // [number, boolean]
 */
export type RestParams<T extends AnyFunc> = T extends (first: any, ...rest: infer Rests) => any
  ? Rests
  : never;

/**
 * 获取 React 组件的 props 类型定义
 * - 针对一些第三方 react 组件，如果其内部 Props 并没有暴露出类型，可以使用这个泛型进行获取
 * @example
 *   const Demo = (props: { a: string, b: number }) => {}
 *   type Props = GetReactComponentProps<typeof Demo>; // { a: string, b: number }
 */
export type GetReactComponentProps<T> = T extends (props: infer R) => any
  ? R
  : T extends React.ComponentClass<infer R>
    ? R
    : any;
