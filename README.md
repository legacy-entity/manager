
# manager

Manager for Entity/Component/Systems.

## Installing

`component-install entity/manager`

## API

### Manager()

  Manager class.

### Manager.isRoot()<small> =`Boolean`</small>

  Determine whether this is the root manager.


### Manager.createEntity(`c...`:`Object`)<small> =`entity`:`Entity`</small>

  Create an entity of components, and use it.


### Manager.removeEntity(`e`:`Entity`)<small> =`this`:`Manager`</small>

  Remove an entity.


### Manager.removeAllEntities()<small> =`this`:`Manager`</small>

  Remove all entities.


### Manager.applyComponents(`[e]`:`Entity`)

  Apply component data to an entity or all.


### Manager.createManager()<small> =`new_manager`:`Manager`</small>

  Create a child manager and use it.


### Manager.of(`arr`:`Array`)<small> =`entities`:`Set`</small>

  Get all entities using all
  the components in the array.


### Manager.each(`[c...]`:`Object`, `fn`:`Function`)<small> =`this`:`Object`</small>

  Iterate entities of certain components,
  or through all if no component is passed.


### Manager.get(`c`:`Component`)<small> =`Entity`</small>

  Get the first entity matching component.


### Manager.use(`item`:`Entity|Mixed|Manager`, `reuse`:`Boolean`)<small> =`this`:`Manager`</small>

  Use a entity, system or manager.

  When entity:
  - Registers an entity (creating a
    new one or reusing the one passed).

  When system:
  - Registers a system to be used.
    Order matters.

  When manager:
  - Adds the manager to its children.

### Manager.init()<small> =`this`:`Manager`</small>

  Game state switches.

  States:

    init -> ( start - pause - stop ) -> tear
            (---------loop---------)

### Manager.reset()<small> =`this`:`Manager`</small>

  Reset state.

  Executes:

    stop -> tear -> init -> start

### Manager.join(`e`:`Entity`)<small> =`this`:`Manager`</small>

  Join (late) an entity.

  It will try to apply components and systems
  based on the current state.

### Manager.snapshot()<small> =`Array`</small>

  Generate an array snapshot of all entities
  property values.

## License

MIT
