var assert = require('component-assert')
var manager = require('manager')
var Entity = require('entity-entity')

describe('manager()', function(){
  describe('when called without a parent', function(){
    var game
    it('should return a manager instance', function(){
      game = manager()
      assert(game instanceof manager)
    })

    it('should be root', function () {
      assert(true === game.isRoot())
    })
  })

  describe("a manager", function () {
    var game
    before(function () {
      game = manager()
    })
  
    it("should listen to events", function (done) {
      game.on('foo', function (s) {
        assert('bar' == s)
        done()
      })
      game.emit('foo', 'bar')
    })

    it("should use entities", function () {
      var e = new Entity()
      assert(game === game.use(e))
      assert(game.entities[game.entities.length-1] instanceof Entity)
    })

    it("should reuse entities", function () {
      var e = new Entity()
      assert(game === game.use(e, true))
      assert(e === game.entities[game.entities.length-1])
    })

    it("should use systems", function (done) {
      var s = {
        init: function () {
          assert(true)
          done()
        }
      }
      game.use(s)
      game.init()
    })

    it("should fire the basic events", function () {
      var s = {
        init: function () { assert(true) }
      , start: function () { assert(true) }
      , pause: function () { assert(true) }
      , stop: function () { assert(true) }
      , tear: function () { assert(true) }
      }
      game.use(s)
      game.init()
      game.start()
      game.pause()
      game.stop()
      game.tear()
    })
  })
})
