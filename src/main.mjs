import DoDCharacterCreation from "./character-creation.mjs"

Hooks.once("init", function () {

    game.dragonbane = {
        characterCreation: DoDCharacterCreation
    }
})

Hooks.once("ready", function () {

})

