import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

/**
 * 实例化Vue实例
 * @param options
 * @constructor
 */
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) { // 只能允许new来实例化
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // initMixin 模块中
  this._init(options)
}

// 初始化Mixin
initMixin(Vue)
// 初始化$data,$props,$set,$delete,$watch
stateMixin(Vue)
// 初始化$on,$once,$off,$emit
eventsMixin(Vue)
// 初始化_update,$forceUpdate,$destroy
lifecycleMixin(Vue)
// 初始化$nextTick,_render
renderMixin(Vue)

export default Vue
