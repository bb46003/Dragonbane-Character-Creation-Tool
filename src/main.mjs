import DoDCharacterCreation from "./character-creation.mjs";
import { SocketHandler } from "./socketHandler.mjs";

Hooks.once("init", function () {
  game.dragonbane = {
    ...game.dragonbane,
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
  game.settings.register(
    "dragonbane-character-creation-tool",
    "skip-folder-ha",
    {
      name: game.i18n.localize("DCCT.settings.skippedFoldersHA"),
      hint: game.i18n.localize("DCCT.settings.skippedFoldersHAHint"),
      scope: "world",
      type: Boolean,
      default: false,
      config: true,
    },
  );
  game.settings.register(
    "dragonbane-character-creation-tool",
    "selectedFoldersHA",
    {
      name: "Selected Folders",
      scope: "world",
      type: Array,
      config: false,
        default: []
    },
  );
  game.settings.register(
    "dragonbane-character-creation-tool",
    "skip-folder-kin",
    {
      name: game.i18n.localize("DCCT.settings.skippedFoldersKin"),
      hint: game.i18n.localize("DCCT.settings.skippedFoldersKinHint"),
      scope: "world",
      type: Boolean,
      default: false,
      config: true,
    },
  );
  game.settings.register(
    "dragonbane-character-creation-tool",
    "selectedFoldersKin",
    {
      name: "Selected Folders",
      scope: "world",
      type: Array,
      config: false,
      default: []
    },
  );
  game.settings.register(
    "dragonbane-character-creation-tool",
    "skip-folder-proffesions",
    {
      name: game.i18n.localize("DCCT.settings.skippedFoldersProfessions"),
      hint: game.i18n.localize("DCCT.settings.skippedFoldersProfessionHint"),
      scope: "world",
      type: Boolean,
      default: false,
      config: true,
    },
  );
  game.settings.register(
    "dragonbane-character-creation-tool",
    "selectedFoldersProfessions",
    {
      name: "Selected Folders",
      scope: "world",
      type: Array,
      config: false,
      default: []
    },
  );
  registerHandlebarsHelpers();
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

Hooks.on("renderSettingsConfig", async (app, html, data) => {
  const settings = [
    {
      skipKey: "skip-folder-ha",
      selectedKey: "selectedFoldersHA",
      inputName: "dragonbane-character-creation-tool.skip-folder-ha",
      itemType: "ability",
    },
    {
      skipKey: "skip-folder-kin",
      selectedKey: "selectedFoldersKin",
      inputName: "dragonbane-character-creation-tool.skip-folder-kin",
      itemType: "kin",
    },
    {
      skipKey: "skip-folder-proffesions",
      selectedKey: "selectedFoldersProfessions",
      inputName: "dragonbane-character-creation-tool.skip-folder-proffesions",
      itemType: "profession",
    },
  ];

  for (const config of settings) {
    const skipInput = html.querySelector(`input[name="${config.inputName}"]`);
    if (skipInput) {
      skipInput.addEventListener("change", async (ev) => {
        await game.settings.set(
          "dragonbane-character-creation-tool",
          config.skipKey,
          ev.target.checked,
        );
        if(!ev.target.checked){
          await game.settings.set(
            "dragonbane-character-creation-tool",
            config.selectedKey,
            []
          )
        }
        app.render({ force: true });
      });
    }

    const skipFolder = game.settings.get(
      "dragonbane-character-creation-tool",
      config.skipKey,
    );
    if (!skipFolder) {
      continue;
    }
    const setting = html.querySelector(
      `#settings-config-dragonbane-character-creation-tool\\.${config.skipKey}`,
    );
    if (!setting) {
      continue;
    }
const uniqueFolders = [
  ...new Map(
    game.items
      .filter((item) => item.type === config.itemType && item.folder)
      .map((item) => {
        const folder = item.folder;

 const name = [
  ...(folder.ancestors ?? []).toReversed(),
  folder,
]
  .map((f) => f.name)
  .join(" / ");

        return [
          folder.id,
          {
            name,
            folderId: folder.id,
          },
        ];
      }),
  ).values(),
];
    const selectedFolders = game.settings.get(
      "dragonbane-character-creation-tool",
      config.selectedKey,
    );
    const content = await foundry.applications.handlebars.renderTemplate(
      "modules/dragonbane-character-creation-tool/settings/settings.hbs",
      {
        uniqueFolders: uniqueFolders,
        selectedFolders: selectedFolders,
      },
    );
    setting.closest(".form-group").insertAdjacentHTML("afterend", content);
    const folderInputs = html.querySelectorAll(
      ".settings-folder-list input[type='checkbox']",
    );

    for (const input of folderInputs) {
      input.addEventListener("change", async () => {
        const selected = Array.from(
          html.querySelectorAll(
            ".settings-folder-list input[type='checkbox']:checked",
          ),
        ).map((input) => input.dataset.folder);
        await game.settings.set(
          "dragonbane-character-creation-tool",
          config.selectedKey,
          selected,
        );
      });
    }
  }
});
function registerHandlebarsHelpers() {
  Handlebars.registerHelper("isInArray", (string, array) => {
    if(string === null){
      return false
    }else{
    return array.includes(string);
    }
  });
}
