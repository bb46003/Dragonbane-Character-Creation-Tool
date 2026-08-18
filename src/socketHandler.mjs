import CreateActor from "./actor-creation.mjs";

export class SocketHandler {
  constructor() {
    this.identifier = "module.dragonbane-item-browser";
    this.registerSocketEvents();
  }
  registerSocketEvents() {
    game.socket.on(this.identifier, async (data) => {
      switch (data.type) {
        case "creatActor":
          if (game.user.isGM) {
            const actor = new CreateActor(data.userId, data.dataset);
            await actor.create();
          }
          break;
        case "actorCreated":
          const user = data.userId;
          if (game.user.id === user) {
            const proceed = await foundry.applications.api.DialogV2.prompt({
              content: game.i18n.format("DCCT.yourCharacterIsCreated", {
                name: data.name,
              }),
              rejectClose: false,
              modal: true,
            });
          }
      }
    });
  }
  emit(data) {
    return game.socket.emit(this.identifier, data);
  }
}
