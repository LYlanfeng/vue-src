/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  /**
   * Vue实例唯一初始化方法
   * @param options
   * @private
   */
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this // vm：当前实例对象
    // a uid
    vm._uid = uid++ // uid 每一个Vue实例的唯一标识

    let startTag, endTag // 开始标签，结束标签
    /* istanbul ignore if */
    //浏览器性能监控
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag) // 开始性能监控
    }

    // a flag to avoid this being observed
    vm._isVue = true // 当前对象是Vue实例
    // merge options
    if (options && options._isComponent) { //判断是否是组件
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      //优化内部组件实例化
      //因为动态选项合并非常慢，没有一个是内部组件选项需要特殊处理。
      //初始化内部组件
      initInternalComponent(vm, options)
    } else {
      //合并参数 将两个对象合成一个对象 将父值对象和子值对象合并在一起，并且优先取值子值，如果没有则取子值
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor), // 解析constructor上的options属性的
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      //初始化 代理 监听
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self 暴露真实的self
    vm._self = vm
    initLifecycle(vm) //初始化生命周期 标志
    initEvents(vm) //初始化事件
    initRender(vm) // 初始化渲染
    callHook(vm, 'beforeCreate') //触发beforeCreate钩子函数
    initInjections(vm) // resolve injections before data/props 在数据/道具之前解决注入问题 //初始化 inject
    initState(vm) // 初始化状态
    // 解决后提供数据/道具  provide 选项应该是一个对象或返回一个对象的函数。该对象包含可注入其子孙的属性，用于组件之间通信。
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created') //触发created钩子函数

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag) // 结束性能监控
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}
// 解析new Vue constructor上的options拓展参数属性的 合并 过滤去重数据
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  // 有super属性，说明Ctor是Vue.extend构建的子类 继承的子类
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super) // 回调超类 表示继承父类
    const cachedSuperOptions = Ctor.superOptions  // Vue构造函数上的options,如directives,filters,....
    if (superOptions !== cachedSuperOptions) { //判断如果 超类的options不等于子类的options 的时候
      // super option changed,
      // need to resolve new options.
      //超级选项改变，
      //需要解决新的选项。
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 解决修改选项 转义数据 合并 数据
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options 更新基本扩展选项
      if (modifiedOptions) {
        // extendOptions合并拓展参数
        extend(Ctor.extendOptions, modifiedOptions)
      }
      // 优先取Ctor.extendOptions 将两个对象合成一个对象 将父值对象和子值对象合并在一起，并且优先取值子值，如果没有则取子值
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {  //如果参数含有name 组件name
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
