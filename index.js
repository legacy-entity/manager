
/*!
 *
 * Manager for Entity/Component/Systems
 *
 * http://github.com/entity
 *
 * MIT
 *
 */

/**
 * Reference to slice.
 */

var slice = [].slice

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
var Entity = require('entity')
var Set = require('set')

/**
 * Exports.
 */

module.exports = Manager

/**
 * Manager class.
 */

function Manager (parent) {
  this.parent = parent || this
  this.root = this.parent.root || this

  this.children = new Set()

  this.systems = new Set()
  this.entities = new Set()
  this.components = new Set()

  this.bindEvents()
  this.state('ready')
}

/**
 * Make Emitter.
 */

Emitter(Manager.prototype)

/**
 * Determine whether this is the root manager.
 *
 * @return {Boolean}
 * @api public
 */

Manager.prototype.isRoot = function () {
  return this.root === this
}

/**
 * Bind behavior on certain events.
 *
 * @return {Manager} this
 * @api private
 */

Manager.prototype.bindEvents = function () {
  var self = this

  // lazily apply components on init

  this.on('init', function () {
    if (!this.hasAppliedComponents) {
      this.applyComponents()
    }
  })

  // return to ready
  // after tear fires

  this.on('tear', function () {
    setTimeout(function () {
      self.state('ready')
    }, 0)
  })

  return this
}

/**
 * Create an entity of components, and use it.
 *
 * @param {Object} c...
 * @return {Entity} entity
 * @api public
 */

Manager.prototype.createEntity = function () {
  var comps = slice.call(arguments)
  var e = new Entity()
  comps.forEach(function (c) {
    e.add(c)
  })
  this.use(e)
  return e
}

/**
 * Remove an entity.
 *
 * @param {Entity} e
 * @return {Manager} this
 * @api public
 */

Manager.prototype.removeEntity = function (e) {
  var self = this
  this.entities.remove(e)
  e.components.each(function (c) {
    c.entities.remove(e)

    // remove component when
    // it has no entities
    if (!c.entities.size()) {
      self.components.remove(c)
    }
  })

  return this
}

/**
 * Remove all entities.
 *
 * @return {Manager} this
 * @api public
 */

Manager.prototype.removeAllEntities = function () {
  var self = this
  this.entities.values().slice().forEach(function (e) {
    self.removeEntity(e)
  })
  return this
}

/**
 * Register all the components of an entity.
 *
 * @param {Entity} e
 * @return {Manager} this
 * @api private
 */

Manager.prototype.registerComponents = function (e) {
  var self = this
  e.components.each(function (c) {
    self.registerComponent(c, e)
  })
  return this
}

/**
 * Register a component with an entity.
 *
 * @param {Object} c
 * @param {Entity} e
 * @return {Object} this
 * @api private
 */

Manager.prototype.registerComponent = function (c, e) {
  c.entities = c.entities || new Set()
  c.entities.add(e)
  this.components.add(c)
  return this
}

/**
 * Apply component data to an entity or all.
 *
 * @param {Entity} [e]
 * @api public
 */

Manager.prototype.applyComponents = function (e) {
  if (e) {
    e.applyComponents()
    return this
  }
  else {
    this.entities.each(function (e) {
      e.applyComponents()
    })
    this.hasAppliedComponents = true
  }
  return this
}

/**
 * Create a child manager and use it.
 *
 * @return {Manager} new_manager
 * @api public
 */

Manager.prototype.createManager = function () {
  var manager = new Manager(this)
  this.use(manager)
  return manager
}

/**
 * Attach listeners for the methods of an object.
 *
 * @param {Object} obj
 * @return {Manager} this
 * @api private
 */

Manager.prototype.addListeners = function (obj) {
  var self = this

  Object.keys(obj)
  .filter(function (key) { // don't add private methods
    return '_' != key.substr(0,1)
  })
  .forEach(function (key) {
    var val = obj[key]
    if ('function' == typeof val) {
      var fn = val
      self.on(key, function () {
        var args = slice.call(arguments)

        if (!fn.length) {
          return fn.call(obj)
        }

        self.each(obj, function (e) {
          fn.apply(obj, [e].concat(args))
        })
      })
    }
  })

  return this
}

/**
 * Get all entities using all
 * the components in the array.
 *
 * @param {Array} arr
 * @return {Set} entities
 * @api public
 */

Manager.prototype.of = function (arr) {
  var self = this
  if (!arr.length) return new Set()
  if (1===arr.length && arr[0].entities) {
    return new Set(arr[0].entities.values())
  }
  var entities = arr.reduce(function (p, n) {
    return p.intersect(n.entities || new Set())
  }, this.entities)
  return entities
}

/**
 * Iterate entities of certain components,
 * or through all if no component is passed.
 *
 * @param {Object} [c...]
 * @param {Function} fn
 * @return {Object} this
 * @api public
 */

Manager.prototype.each = function (c, fn) {
  var args
  if ('function' == typeof c) {
    this.entities.each(c)
    return this
  }
  else if (Array.isArray(c)) {
    args = c
  }
  else {
    args = slice.call(arguments)
  }
  fn = args.pop()
  this.of(args).each(fn)
  return this
}

/**
 * Get the first entity matching component.
 *
 * @param {Component} c
 * @return {Entity}
 * @api public
 */

Manager.prototype.get = function (c) {
  return this.of([c]).values()[0]
}

/**
 * Use a entity, system or manager.
 *
 * When entity:
 * - Registers an entity (creating a
 *   new one or reusing the one passed).
 *
 * When system:
 * - Registers a system to be used.
 *   Order matters.
 *
 * When manager:
 * - Adds the manager to its children.
 *
 * @param {Entity|Mixed|Manager} item
 * @param {Boolean} reuse
 * @return {Manager} this
 * @api public
 */

Manager.prototype.use = function (item, reuse) {
  if (item instanceof Manager) {
    this.children.add(item)
  }
  else if (item instanceof Entity) {
    var e = item
    e.on('add', function (c) {
      self.registerComponent(c, e)
    })
    this.entities.add(e)
    this.registerComponents(e)
  }
  else {
    this.addListeners(item)
    this.systems.add(item)
  }
  return this
}

/**
 * Run the systems for an entity alone.
 *
 * @param {Entity} e
 * @param {String} method
 * @return {Manager} this
 * @api private
 */

Manager.prototype.runSystems = function (e, method) {
  e.components.each(function (c) {
    if (method in c) c[method].call(c, e)
  })
  return this
}

/**
 * Game state switches.
 *
 * States:
 *
 *   init -> ( start - pause - stop ) -> tear
 *           (---------loop---------)
 *
 * @return {Manager} this
 * @api public
 */

Manager.prototype.init = function () { return this.state('init') }
Manager.prototype.start = function () { return this.state('start') }
Manager.prototype.pause = function () { return this.state('pause') }
Manager.prototype.stop = function () { return this.state('stop') }
Manager.prototype.tear = function () { return this.state('tear') }

/**
 * Reset state.
 *
 * Executes:
 *
 *   stop -> tear -> init -> start
 *
 * @return {Manager} this
 * @api public
 */

Manager.prototype.reset = function () {
  this.stop()
  this.tear()
  this.once('ready', function () {
    this.init()
    this.start()
  })
  return this
}

/**
 * State accessor. Also emits state on change.
 *
 * @param {String} [s]
 * @return {Mixed}
 * @api private
 */

Manager.prototype.state = function (s) {
  if (null == s) return this._state
  this._state = s
  this.emit(s)
  this.emit('state', s)
  return this
}

/**
 * Join (late) an entity.
 *
 * It will try to apply components and systems
 * based on the current state.
 *
 * @param {Entity} e
 * @return {Manager} this
 * @api public
 */

Manager.prototype.join = function (e) {
  this.use(e)
  this.applyComponents(e)
  var s = this.state()
  if ('none' == s) return this
  if ('init' == s || 'start' == s || 'pause' == s || 'stop' == s) {
    this.runSystems(e, 'init')
  }
  if ('start' == s || 'pause' == s) {
    this.runSystems(e, 'start')
  }
  if ('pause' == s) {
    this.runSystems(e, 'pause')
  }
  return this
}

/**
 * Generate an array snapshot of all entities
 * property values.
 *
 * @return {Array}
 * @api public
 */

Manager.prototype.snapshot = function () {
  var snap = this.entities
  .values()
  .map(function (e) {
    return e._properties
  })
  return snap
}
