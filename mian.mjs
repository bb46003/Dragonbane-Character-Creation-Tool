import characterCreation from "modules/apps/character-creation.mjs"

Hooks.once("init", function () {

    game.dragonbane = {
        characterCreation: characterCreation
    }
})