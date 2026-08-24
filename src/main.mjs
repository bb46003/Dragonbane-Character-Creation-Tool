import DoDCharacterCreation from "./character-creation.mjs";
import { SocketHandler } from "./socketHandler.mjs";

Hooks.once("init", function () {
  game.dragonbane = {
    characterCreation: DoDCharacterCreation,
  };
  const module = game.modules.get("dragonbane-character-creation-tool");
  module.socketHandler = new SocketHandler();
  game.settings.register("dragonbane-character-creation-tool", "additionalHA", {
    name: game.i18n.localize("DCCT.settings.aditionalHA"),
    hint: game.i18n.localize("DCCT.settings.aditionalHAHint"),
    scope: "world",
    type: Boolean,
    default: false,
    config: true,
  });
});

Hooks.on("renderAbstractSidebarTab", function (ev, app) {
  const element = app;

  const header = element.querySelector(".directory-header.flexcol");
  if (!header) return;

  const currentButtons = header.querySelector(
    ".header-actions.action-buttons.flexrow",
  );

  if (!currentButtons) return;

  const button = document.createElement("button");

  button.type = "button";
  button.classList.add("header-control");
  const label = game.i18n.localize("DCCT.characterCreator");
  button.innerHTML = `
        <i class="fas fa-star"></i>
        <span>${label}</span>
    `;

  button.addEventListener("click", () => {
    const creator = new game.dragonbane.characterCreation();
    creator.render({ force: true });
  });
  currentButtons.after(button);
});
