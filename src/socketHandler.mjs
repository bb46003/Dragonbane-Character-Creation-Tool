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
      }
    });
  }
  emit(data) {
    return game.socket.emit(this.identifier, data);
  }
}
