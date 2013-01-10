
var slice = [].slice

/**
 * Module dependencies.
 */

var Entity = require('entity')

/**
 * Export Manager.
 */

module.exports = function (parent) {
  return new Manager(parent)
}

/**
 * Manager class.
 */

function Manager (parent) {
  this.parent = parent
  this.root = this.parent || this
  this.children = []

  this.systems = []
  this.entities = []
  this.components = {}
  this.componentsIndex = []

  this.listeners = {}

  this._state = 'none'
}

var proto = Manager.prototype

proto.on = function (ev, fn) {
  this.listeners[ev] = this.listeners[ev] || []
  this.listeners[ev].push(fn)
  return this
}

proto.emit = function (ev, a, b, c, d) {
  if (!(ev in this.listeners)) return
  setTimeout(function () {
    for (var i=0, len=this.listeners[ev].length; i<len; i++) {
      this.listeners[ev][i].call(this, a, b, c, d)
    }
  }.bind(this), 0)
  return this
}

proto.isRoot = function () {
  return this.parent === this
}

proto.addListeners = function (obj) {
  Object.keys(obj)
    .filter(function (k) { return '_' != k.substr(0,1) })
    .forEach(function (k) {
      if ('function' == typeof obj[k]) {
        this.on(k, function () {
          var args = slice.call(arguments)

          if (!obj[k].length) {
            return obj[k].call(obj)
          }

          this.each(obj, function (e) {
            obj[k].apply(obj, [e].concat(args))
          })
        })
      }
    }, this)
}

/**
 * Apply component data to an entity or all.
 */

proto.applyComponents = function (e) {
  if (e) {
    e.components.forEach(function (c) {
      e.applyComponent(c)
    })
    return this
  }
  else {
    this.each(this.applyComponents.bind(this))
  }
  return this
}

proto.snapshot = function () {
  return JSON.stringify(this.entities)
}

proto.reset = function () {
  this.stop()
  this.tear()
  setTimeout(function () {
    this.init()
    this.start()
  }.bind(this), 0)
  return this
}

proto.init = function () { return this.state('init') }
proto.start = function () { return this.state('start') }
proto.pause = function () { return this.state('pause') }
proto.stop = function () { return this.state('stop') }
proto.tear = function () { return this.state('tear') }

proto.state = function (s) {
  if (null == s) return this._state
  this._state = s
  this.emit(s)
  return this
}

proto.of = function (arr) {
  var res = []
  var ents = []
  for (var i=0, c, len=arr.length; i<len; i++) {
    c = arr[i]
    if ('string' == typeof c) {
      ents.push(this.entities.filter(function (e) {
        return (c in e)
      }))
    }
    else {
      c = c.component || c
      var index = this.componentsIndex
      var idx = index.indexOf(c)
      if (~idx) ents.push(this.components[idx] || [])
    }
  }
  var exclude
  if (!ents.length) return res
  for (var i=0, e, len=ents[0].length; i<len; i++) {
    e = ents[0][i]
    exclude = false
    ents.forEach(function (list) {
      if (!~list.indexOf(e)) exclude = true
    })
    if (!exclude) res.push(e)
  }
  return res
}

proto.each = function (c) {
  var args
  if ('function' == typeof c) {
    this.entities.forEach(c, this)
    return this
  }
  else if (Array.isArray(c)) {
    args = c
  }
  else {
    args = slice.call(arguments)
  }
  var fn = args.pop()
  this.of(args).forEach(fn)
  return this
}

proto.get = function (c) {
  return this.of(c)[0]
}

proto.use = function (item, reuse) {
  if (item instanceof Entity) {
    var e = item
    if (!reuse) e = new Entity(item)
    if (!~this.entities.indexOf(e)) {
      var self = this
      e.on('use', function (c) {
        self.reg(c, e)
      })
      this.entities.push(e)
      this.registerComponents(e)
      if (this.root != this) {
        if (!~this.root.entities.indexOf(e)) {
          this.root.entities.push(e)
          this.root.registerComponents(e)
        }
      }
    }
  }
  else if ('object' == typeof item) {
    item = item.system || item
    this.addListeners(item)
    if (!('children' in item)) {
      item.emit = this.emit.bind(this)
      item.each = this.each.bind(this)
      item.of = this.of.bind(this)
      this.systems.push(item)
    }
    else {
      item.root = this.root
      this.children.push(item)
    }
  }
  else console.log('unknown', item)
  return this
}

proto.registerComponents = function (e) {
  var self = this
  e.components.forEach(function (c) {
    self.reg(c, e)
  })
}

proto.reg = function (c, e) {
  var comps = this.components
  var index = this.componentsIndex
  var idx = index.indexOf(c)
  if (~idx) {
    if (!~comps[idx].indexOf(e)) {
      comps[idx].push(e)
    }
  }
  else {
    index.push(c)
    comps[index.length-1] = [e]
  }
}

proto.join = function (e) {
  this.applyComponents(e)
  var s = this.state()
  if ('none' == s) return this
  if ('init' == s || 'start' == s || 'pause' == s || 'stop' == s) {
    e.init(this.systems)
  }
  if ('start' == s || 'pause' == s) {
    e.start(this.systems)
  }
  if ('pause' == s) {
    e.pause(this.systems)
  }
  return this
}

proto.createEntity = function () {
  var args = slice.call(arguments)
  var e = args[0]
  if (!(e instanceof Entity)) {
    e = new Entity()
    args.forEach(function (arg) {
      e.use(arg)
    })
  }
  this.use(e, true)
  return e
}

proto.removeAllEntities = function () {
  this.entities.slice().forEach(function (e) {
    this.root.removeEntity(e)
    this.removeEntity(e)
  }, this)
}

proto.removeEntity = function (e) {
  var self = this
  
  var idx = this.entities.indexOf(e)
  if (~idx) this.entities.splice(idx, 1)
  
  e.components.forEach(function (c) {
    var idx = self.componentsIndex.indexOf(c)
    var comps = self.components[idx]
    if (null != comps) {
      var idx = comps.indexOf(e)
      if (~idx) comps.splice(idx, 1)
    }
  })
}

proto.createManager = function () {
  var manager = new Manager(this)
  this.use(manager)
  return manager
}

function mixin (t, s, f) {
  for (var k in s) {
    if (f || !(k in t)) t[k] = s[k]
  }
}
