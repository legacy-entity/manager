require('stagas-watch-js')
var assert = require('component-assert')
var Entity = require('entity-entity')
var Manager = require('manager')

describe("Manager()", function () {

  describe("when called with new", function () {
    it("should return a manager instance", function () {
      var game = new Manager()
      assert(game instanceof Manager)
    })

    it('should be root', function () {
      var game = new Manager()
      assert(true === game.isRoot())
    })

    it('should bind events', function () {
      var game = new Manager()
      assert(1===game._callbacks.init.length)
      assert(1===game._callbacks.tear.length)
    })
  })

  describe("when called with new with a parent", function () {
    it("should return a manager instance", function () {
      var parent = new Manager()
      var child = new Manager(parent)
      assert(child instanceof Manager)
    })

    it('should be child', function () {
      var parent = new Manager()
      var child = new Manager(parent)
      assert(false === child.isRoot())
      assert(parent === child.parent)
    })
  })

  describe(".createEntity()", function () {
    it("should create an Entity", function () {
      var game = new Manager()
      var e = game.createEntity()
      assert(e instanceof Entity)
    })

    it("should pass components to the Entity", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      assert(e.components.has(c))
    })

    it("should add the Entity", function () {
      var game = new Manager()
      var e = game.createEntity()
      assert(game.entities.has(e))
    })

    it("should add the Entity components", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      assert(game.components.has(c))
    })

    it("should add the Entity in component entities", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      assert(c.entities.has(e))
    })
  })

  describe(".removeEntity()", function () {
    it("should remove an Entity", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      assert(game.entities.has(e))
      assert(game.components.has(c))
      assert(c.entities.has(e))

      game.removeEntity(e)
      assert(!game.entities.has(e))
      assert(!game.components.has(c))
      assert(!c.entities.has(e))
    })

    it("should keep component if used\
        by another Entity", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      var eb = game.createEntity(c)
      assert(game.entities.has(e))
      assert(game.entities.has(eb))
      assert(game.components.has(c))
      assert(c.entities.has(e))

      game.removeEntity(e)
      assert(!game.entities.has(e))
      assert(game.components.has(c))
      assert(!c.entities.has(e))

      game.removeEntity(eb)
      assert(!game.components.has(c))
    })
  })

  describe(".removeAllEntities()", function () {
    it("should remove all Entities", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      var eb = game.createEntity(c)
      assert(game.entities.has(e))
      assert(game.entities.has(eb))
      assert(game.components.has(c))
      assert(c.entities.has(e))

      game.removeAllEntities()
      assert(!game.entities.has(e))
      assert(!game.entities.has(eb))
      assert(!game.components.has(c))
      assert(!c.entities.has(e))
      assert(!c.entities.has(eb))
    })
  })

  describe(".registerComponents()", function () {
    it("should register components of an entity", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var c2 = { lol: [Number, 101] }
      var e = new Entity()
      e.add(c)
      e.add(c2)
      game.registerComponents(e)
      assert(game.components.has(c))
      assert(game.components.has(c2))
      assert(c.entities.has(e))
      assert(c2.entities.has(e))
    })
  })

  describe(".registerComponent()", function () {
    it("should register a components of an entity", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = new Entity()
      e.add(c)
      game.registerComponent(c, e)
      assert(game.components.has(c))
      assert(c.entities.has(e))
    })
  })

  describe(".applyComponents()", function () {
    it("should apply all components for all entities", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var c2 = { lol: [Number, 101] }
      var e = game.createEntity(c, c2)
      var e2 = game.createEntity(c)
      game.applyComponents()
      assert('bar'===e.foo())
      assert(101===e.lol())
      assert('bar'===e2.foo())
    })

    it("should be separate instances", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var e = game.createEntity(c)
      var e2 = game.createEntity(c)
      game.applyComponents()
      e.foo('yoyo')
      assert('yoyo'===e.foo())
      assert('bar'===e2.foo())
    })
  })

  describe(".createManager()", function () {
    it("should create a child manager", function () {
      var parent = new Manager()
      var child = parent.createManager()
      assert(child instanceof Manager)
    })

    it("should not be root", function () {
      var parent = new Manager()
      var child = parent.createManager()
      assert(false===child.isRoot())
    })

    it("should have parent", function () {
      var parent = new Manager()
      var child = parent.createManager()
      assert(parent===child.parent)
    })

    it("should be used by parent", function () {
      var parent = new Manager()
      var child = parent.createManager()
      assert(parent.children.has(child))
    })
  })

  describe(".addListeners()", function () {
    it("should add listeners for the methods\
        of an object", function (done) {
      var game = new Manager()
      var obj = {
        foo: function () {
          assert(true)
          done()
        }
      }
      game.addListeners(obj)
      game.emit('foo')
    })

    it("should work with components", function (done) {
      var game = new Manager()
      var obj = {
        foo: function (_e) {
          assert(e===_e)
          done()
        }
      }
      var e = game.createEntity(obj)
      game.addListeners(obj)
      game.emit('foo')
    })

    it("should pass arguments", function (done) {
      var game = new Manager()
      var obj = {
        foo: function (e, a, b) {
          assert('bar'===a)
          assert(101===b)
          done()
        }
      }
      game.createEntity(obj)
      game.addListeners(obj)
      game.emit('foo', 'bar', 101)
    })
  })


  describe(".of()", function () {
    describe("when passed an array of two components", function () {
      it("should return a set of entities matching\
          the components in the array", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var set = game.of([c,c2])
        assert(1===set.size())
        assert(set.has(e))
        assert(!set.has(e2))
      })
    })

    describe("when passed one component", function () {
      it("should return a set of entities matching\
          the components in the array", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var set = game.of([c])
        assert(2===set.size())
        assert(set.has(e))
        assert(set.has(e2))
      })
    })

    describe("when passed an empty array", function () {
      it("should return an empty set", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var set = game.of([])
        assert(0===set.size())
        assert(!set.has(e))
        assert(!set.has(e2))
      })
    })

    describe("when passed a component with no entities", function () {
      it("should return an empty set", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var b = { other: [String, 'another'] }
        var set = game.of([b])
        assert(0===set.size())
        assert(!set.has(e))
        assert(!set.has(e2))
      })
    })
  })

  describe(".each()", function () {
    describe("when passed a function", function () {
      it("should iterate all entities", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var i = 0
        game.each(function (e) {
          assert(e instanceof Entity)
          i++
        })
        assert(2===i)
      })
    })

    describe("when passed a component and a function", function () {
      it("should iterate all entities matching\
          that component", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var i = 0
        game.each(c, function (e) {
          assert(e instanceof Entity)
          assert(e.has(c))
          i++
        })
        assert(2===i)

        var i = 0
        game.each(c2, function (e) {
          assert(e instanceof Entity)
          assert(e.has(c2))
          i++
        })
        assert(1===i)
      })
    })

    describe("when passed multiple components and a function", function () {
      it("should iterate all entities matching\
          those components", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var i = 0
        game.each(c, c2, function (e) {
          assert(e instanceof Entity)
          assert(e.has(c))
          assert(e.has(c2))
          i++
        })
        assert(1===i)
      })
    })
  })

  describe(".get()", function () {
    describe("when passed a component", function () {
      it("should return one entity", function () {
        var game = new Manager()
        var c = { foo: [String, 'bar'] }
        var c2 = { lol: [Number, 101] }
        var e = game.createEntity(c, c2)
        var e2 = game.createEntity(c)

        var g = game.get(c)
        assert(e===g)
      })
    })
  })

  describe(".use()", function () {
    describe("when passed a manager", function () {
      it("should add it to its children", function () {
        var game = new Manager()
        var other = new Manager()
        game.use(other)
        assert(game.children.has(other))
      })
    })

    describe("when passed an entity", function () {
      it("should add it to its entities", function () {
        var game = new Manager()
        var e = new Entity()
        game.use(e)
        assert(game.entities.has(e))
      })
    })

    describe("when passed a system", function () {
      it("should add it to its systems", function () {
        var game = new Manager()
        var sys = { foo: function () {} }
        game.use(sys)
        assert(game.systems.has(sys))
      })
    })
  })

  describe(".runSystems()", function () {
    it("should run the systems for an entity", function (done) {
      var game = new Manager()
      var sys = {
        start: function (_e) {
          assert(e===_e)
          done()
        }
      }
      var e = new Entity()
      e.add(sys)
      game.runSystems(e, 'start')
    })
  })

  describe(".init()", function () {
    it("should set state `init`", function (done) {
      var game = new Manager()
      var sys = {
        init: function () {
          assert(true)
          done()
        }
      }
      game.use(sys)
      game.init()
    })
  })

  describe(".start()", function () {
    it("should set state `start`", function (done) {
      var game = new Manager()
      var sys = {
        start: function () {
          assert(true)
          done()
        }
      }
      game.use(sys)
      game.start()
    })
  })

  describe(".pause()", function () {
    it("should set state `pause`", function (done) {
      var game = new Manager()
      var sys = {
        pause: function () {
          assert(true)
          done()
        }
      }
      game.use(sys)
      game.pause()
    })
  })

  describe(".stop()", function () {
    it("should set state `pause`", function (done) {
      var game = new Manager()
      var sys = {
        stop: function () {
          assert(true)
          done()
        }
      }
      game.use(sys)
      game.stop()
    })
  })

  describe(".tear()", function () {
    it("should set state `tear`", function (done) {
      var game = new Manager()
      var sys = {
        tear: function () {
          assert(true)
          done()
        }
      }
      game.use(sys)
      game.tear()
    })
  })

  describe(".reset()", function () {
    it("should reset the game", function (done) {
      var game = new Manager()
      var i = 0;
      var sys = {
        init: function () {
          i++
          assert(4===i)
        }
      , ready: function () {
          i++
          assert(3===i)
        }
      , start: function () {
          i++
          assert(5===i)
          done()
        }
      , stop: function () {
          i++
          assert(1===i)
        }
      , tear: function () {
          i++
          assert(2===i)
        }
      }
      game.use(sys)
      game.reset()
    })
  })

  describe(".state()", function () {
    describe("when called without arguments", function () {
      it("should return current state", function () {
        var game = new Manager()
        assert('ready'===game.state())
      })

      it("even if it changed", function () {
        var game = new Manager()
        game.state('start')
        assert('start'===game.state())
      })
    })

    describe("when called with a string", function () {
      it("should change state", function () {
        var game = new Manager()
        game.state('pause')
        assert('pause'===game.state())
      })

      it("should change again", function () {
        var game = new Manager()
        game.state('start')
        assert('start'===game.state())
        game.state('pause')
        assert('pause'===game.state())
      })
    })
  })

  describe(".join()", function () {
    it("should apply components and systems to a late\
        join entity", function (done) {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var i = 0
      var sys = {
        start: function (_e) {
          assert(e===_e)
          assert('bar'===_e.foo())
          i++
        }
      , stop: function (_e) {
          assert(1===i)
          assert(e===_e)
          assert('bar'===_e.foo())
          done()
        }
      }
      game.use(sys)
      game.init().start()

      var e = new Entity()
      e.add(c)
      e.add(sys)
      game.join(e)

      game.stop()
    })
  })

  describe(".snapshot()", function () {
    it("should return a serialized snapshot", function () {
      var game = new Manager()
      var c = { foo: [String, 'bar'] }
      var i = 0
      var sys = {
        start: function () {
          i++
        }
      , stop: function () {
          assert(1===i)
        }
      }
      var e = game.createEntity(c, sys)
      game.use(sys)
      game.init().start()
      assert('bar'===e.foo())
      var snap = game.snapshot()
      var json = JSON.stringify(snap)
      assert('[{"foo":"bar"}]'===json)
    })
  })
})
